import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  SafeAreaView,
  StatusBar,
  Keyboard,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  AppState,
} from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as NavigationBar from 'expo-navigation-bar';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { create, all } from 'mathjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { PanResponder } from 'react-native';

const math = create(all);
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const TAB_HEIGHT = 50;

// Type Definitions
interface HistoryEntry {
  id: string;
  input: string;
  result: string;
  timestamp: string;
  pinned: boolean;
  name: string;
}

interface SwipeableHistoryItemProps {
  entry: HistoryEntry;
  index: number;
  onResume: (entry: HistoryEntry) => void;
  onDelete: (index: number) => void;
  onPin: (index: number) => void;
  setSelectedIndex: (index: number) => void;
  setModalVisible: (visible: boolean) => void;
  setTempName: (name: string) => void;
}

const getInitials = (str: string): string => {
  if (!str) return '';
  return str.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
};

const AVATAR_COLORS = ['#81c784', '#64b5f6', '#ffb74d', '#ff8a65', '#ba68c8', '#ffd54f', '#4db6ac'];

const getAvatarColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const SwipeableHistoryItem: React.FC<SwipeableHistoryItemProps> = ({
  entry,
  index,
  onResume,
  onDelete,
  onPin,
  setSelectedIndex,
  setModalVisible,
  setTempName,
}) => {
  const animX = useRef(new Animated.Value(0)).current;
  const deleteIconAnim = useRef(new Animated.Value(0)).current;
  const [isRemoving, setIsRemoving] = useState(false);
  const [swiping, setSwiping] = useState<'left' | 'right' | null>(null);

  const swipeThreshold = SCREEN_WIDTH * 0.28;
  const fastSwipe = 0.5;

  useEffect(() => {
    animX.setValue(0);
    deleteIconAnim.setValue(0);
    setSwiping(null);
    setIsRemoving(false);
  }, [entry.pinned, entry.input, entry.result, entry.name, entry.timestamp]);

  const deleteIconTranslate = deleteIconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40],
  });

  const deleteIconOpacity = deleteIconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.2],
  });

  const animateDeleteAndRemove = () => {
    setIsRemoving(true);
    Animated.parallel([
      Animated.timing(animX, {
        toValue: -SCREEN_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(deleteIconAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDelete(index);
    });
  };

  const historyPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isRemoving,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && !isRemoving,
      onPanResponderGrant: () => {
        if (isRemoving) return;
        animX.stopAnimation();
        animX.setOffset(animX._value);
        animX.setValue(0);
        setSwiping(null);
      },
      onPanResponderMove: (_, g) => {
        if (isRemoving) return;
        animX.setValue(Math.max(-SCREEN_WIDTH, Math.min(SCREEN_WIDTH, g.dx)));
        if (g.dx > 0) setSwiping('right');
        else if (g.dx < 0) setSwiping('left');
      },
      onPanResponderRelease: (_, g) => {
        if (isRemoving) return;
        animX.flattenOffset();

        if (g.dx > swipeThreshold || g.vx > fastSwipe) {
          Animated.spring(animX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start(() => onPin(index));
        } else if ((g.dx < -swipeThreshold || g.vx < -fastSwipe) && !entry.pinned) {
          animateDeleteAndRemove();
        } else if ((g.dx < -swipeThreshold || g.vx < -fastSwipe) && entry.pinned) {
          Animated.sequence([
            Animated.timing(animX, { toValue: -30, duration: 80, useNativeDriver: true }),
            Animated.timing(animX, { toValue: 30, duration: 80, useNativeDriver: true }),
            Animated.timing(animX, { toValue: 0, duration: 80, useNativeDriver: true }),
          ]).start();
        } else {
          Animated.spring(animX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
        setSwiping(null);
        deleteIconAnim.setValue(0);
      },
    })
  ).current;

  const avatarColor = getAvatarColor(entry.name || entry.input || '');
  const avatarText = getInitials(entry.name || entry.input || '');

  if (isRemoving) return null;

  return (
    <View style={historyStyles.rowContainer}>
      {swiping === 'right' && (
        <View style={[historyStyles.actionBg, historyStyles.pinAction]}>
          <MaterialIcons name="push-pin" size={24} color="#fff" style={{ marginRight: 6 }} />
          <Text style={historyStyles.actionText}>{entry.pinned ? 'Unpin' : 'Pin'}</Text>
        </View>
      )}
      {swiping === 'left' && (
        <View style={[historyStyles.actionBg, historyStyles.deleteAction]}>
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              transform: [{ translateX: deleteIconTranslate }],
              opacity: deleteIconOpacity,
            }}
          >
            <MaterialIcons name="delete" size={24} color="#fff" style={{ marginRight: 6 }} />
            <Text style={historyStyles.actionText}>
              {entry.pinned ? 'Unpin to Delete' : 'Delete'}
            </Text>
          </Animated.View>
        </View>
      )}
      <Animated.View
        {...historyPanResponder.panHandlers}
        style={[historyStyles.cardWrapper, { transform: [{ translateX: animX }] }]}
      >
        <TouchableOpacity
          onPress={() => onResume(entry)}
          onLongPress={() => {
            setSelectedIndex(index);
            setTempName(entry.name || '');
            setModalVisible(true);
          }}
          activeOpacity={0.82}
        >
          <View style={historyStyles.card}>
            <View style={[historyStyles.avatarCircle, { backgroundColor: avatarColor }]}>
              <Text style={historyStyles.avatarText}>{avatarText}</Text>
            </View>
            <View style={historyStyles.cardContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={historyStyles.titleText} numberOfLines={1}>
                  {entry.name || entry.input}
                </Text>
                {entry.pinned && (
                  <MaterialIcons
                    name="push-pin"
                    size={16}
                    color="#0288d1"
                    style={historyStyles.pinIcon}
                  />
                )}
              </View>
              <Text style={historyStyles.resultText} numberOfLines={1}>
                {entry.result}
              </Text>
              <Text style={historyStyles.timestamp}>{entry.timestamp}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const Calculator: React.FC = () => {
  const navigation = useNavigation();
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [tabVisible, setTabVisible] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [panelOpen, setPanelOpen] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tempName, setTempName] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const MAX_FONT = 48;
  const MIN_FONT = 16;
  const [fontSize, setFontSize] = useState<number>(MAX_FONT);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeTabAnim = useRef(new Animated.Value(0)).current;
  const slideTabAnim = useRef(new Animated.Value(TAB_HEIGHT)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const initialPanelValue = useRef(0);

  const lastTap = useRef<number | null>(null);
  const inputRef = useRef<TextInput>(null);

useEffect(() => {
  // === Hook Setup ===
  const setup = async () => {
    try {
      // Lock orientation to portrait when the component mounts
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBehaviorAsync('overlay-swipe');
      navigation.setOptions({ tabBarStyle: { display: 'none' } });
      await loadHistory();
      await loadCurrent();
    } catch (error) {
      console.error('Setup error:', error);
    }
  };

  setup();

  // Navigation focus listener to ensure portrait mode on screen focus
  const unsubscribe = navigation.addListener('focus', async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } catch (error) {
      console.error('Error locking orientation on focus:', error);
    }
  });

  // === Hook Cleanup (return) ===
  return () => {
    // Reset to portrait when unmounting
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
      .catch(error => console.error('Error resetting orientation on unmount:', error));
    // Remove navigation listener
    unsubscribe();
  };
}, [navigation]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState.match(/inactive|background/)) {
        saveCurrent();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [input, result]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeTabAnim, {
        toValue: tabVisible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideTabAnim, {
        toValue: tabVisible ? 0 : TAB_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tabVisible]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setNativeProps({ showSoftInputOnFocus: false });
    }
  }, []);

  useEffect(() => {
    if (result !== '') {
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [result]);

  useEffect(() => {
    if (input.length > 12 && fontSize > MIN_FONT) {
      setFontSize(prev => Math.max(MIN_FONT, prev - 1));
    } else if (input.length <= 12 && fontSize !== MAX_FONT) {
      setFontSize(MAX_FONT);
    }
  }, [input]);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('calcHistory');
      if (stored) {
        const parsed = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          pinned: entry.pinned ?? false,
          name: entry.name ?? '',
          id: entry.id || `${entry.timestamp}${Math.random().toString(36).slice(2)}`,
        }));
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadCurrent = async () => {
    try {
      const stored = await AsyncStorage.getItem('calcCurrent');
      if (stored) {
        const { input, result } = JSON.parse(stored);
        setInput(input);
        setResult(result);
      }
    } catch (error) {
      console.error('Error loading current:', error);
    }
  };

  const saveCurrent = async () => {
    try {
      await AsyncStorage.setItem('calcCurrent', JSON.stringify({ input, result }));
    } catch (error) {
      console.error('Error saving current:', error);
    }
  };

  const saveToHistory = async (expr: string, res: string) => {
    if (!expr || !res || res === 'Error' || (history[0]?.input === expr && history[0]?.result === res))
      return;
    const timestamp = new Date().toLocaleString();
    const newEntry: HistoryEntry = {
      input: expr,
      result: res,
      timestamp,
      pinned: false,
      name: '',
      id: `${Date.now()}${Math.random().toString(36).slice(2)}`,
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    try {
      await AsyncStorage.setItem('calcHistory', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const updateHistoryStorage = async () => {
    try {
      await AsyncStorage.setItem('calcHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Error updating history:', error);
    }
  };

  const handleClick = (value: string) => {
    if (value === 'C') {
      if (input && result) saveToHistory(input, result || '—');
      setInput('');
      setResult('');
    } else if (value === '⌫') {
      setInput(input.slice(0, -1));
    } else {
      setInput(prev => prev + value);
    }
  };

  const handleEquals = () => {
    try {
      const expression = input.replace(/×/g, '*').replace(/÷/g, '/');
      const evalResult = math.evaluate(expression);
      const resultStr = evalResult.toString();
      setResult(resultStr);
      saveToHistory(input, resultStr);
    } catch {
      setResult('Error');
    }
  };

  const handleDelete = (index: number) => {
    if (history[index].pinned) return;
    const updated = [...history];
    updated.splice(index, 1);
    setHistory(updated);
    updateHistoryStorage();
  };

  const handlePin = (index: number) => {
    const updated = [...history];
    updated[index].pinned = !updated[index].pinned;
    setHistory(updated);
    updateHistoryStorage();
  };

  const handleSaveName = () => {
    if (selectedIndex !== null) {
      const updated = [...history];
      updated[selectedIndex].name = tempName;
      setHistory(updated);
      updateHistoryStorage();
    }
    setModalVisible(false);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      Keyboard.dismiss();
      setTabVisible(prev => !prev);
    }
    lastTap.current = now;
  };

  const openPanel = () => {
    setPanelOpen(true);
    Animated.timing(panelAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
const closePanel = () => {
  setPanelOpen(false);
  Animated.spring(panelAnim, {
    toValue: 0,
    bounciness: 8, // Adds a slight bounce for natural feel
    speed: 12, // Controls animation speed (higher is faster)
    useNativeDriver: false,
  }).start();
};

const panelPanResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      initialPanelValue.current = panelAnim._value;
    },
    onPanResponderMove: (_, g) => {
      const newVal = initialPanelValue.current + g.dy;
      panelAnim.setValue(Math.max(0, Math.min(SCREEN_HEIGHT, newVal)));
    },
    onPanResponderRelease: (_, g) => {
      const threshold = SCREEN_HEIGHT * 0.3;
      if (g.dy < -10 || g.vy < -0.1) { // Close on slight upward swipe or fast upward velocity
        closePanel();
      } else if (panelAnim._value > threshold || g.vy > 0.2) {
        openPanel();
      } else {
        closePanel();
      }
    },
  })
).current;
  const shareHistory = async () => {
    try {
      const shareText = history
        .map(h => `${h.name || h.input} = ${h.result} (${h.timestamp})`)
        .join('\n\n');
      const uri = `${FileSystem.cacheDirectory}calculator_history.txt`;
      await FileSystem.writeAsStringAsync(uri, shareText);
      await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: 'Share Calculation History' });
    } catch (error) {
      console.error('Error sharing history:', error);
    }
  };

  const renderHistoryHeader = () => (
    <View style={historyStyles.historyHeader}>
      <TouchableOpacity onPress={closePanel} style={historyStyles.headerIcon}>
        <MaterialIcons name="arrow-back" size={26} color="#fff" />
      </TouchableOpacity>
      <TextInput
        style={historyStyles.searchInput}
        placeholder="Search history..."
        placeholderTextColor="#aaa"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={historyStyles.headerIconsRight}>
        <TouchableOpacity onPress={shareHistory} style={historyStyles.headerIcon}>
          <MaterialIcons name="share" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMenuVisible(!menuVisible)}
          style={historyStyles.headerIcon}
        >
          <MaterialIcons name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
        {menuVisible && (
          <View style={historyStyles.menuDropdown}>
            <TouchableOpacity
              onPress={() => {
                setHistory([]);
                AsyncStorage.removeItem('calcHistory');
                setMenuVisible(false);
              }}
            >
              <Text style={historyStyles.menuItem}>Clear All History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                alert('Export feature coming soon!');
              }}
            >
              <Text style={historyStyles.menuItem}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                alert('Settings feature coming soon!');
              }}
            >
              <Text style={historyStyles.menuItem}>Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const BUTTONS = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', 'C', '+'],
    ['', '⌫', '=', ''],
  ];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <BlurView intensity={40} tint="dark" style={styles.blurHeader} />

      {!panelOpen && (
        <View style={styles.fixedIconRow}>
          <Pressable onPress={openPanel}>
            <MaterialCommunityIcons name="history" size={28} color="#fff" />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ProfessionalCalculator')}>
            <MaterialCommunityIcons name="square-root" size={28} color="#FFFDD0" />
          </Pressable>
        </View>
      )}

      <Animated.View style={[historyStyles.historyPanel, { height: panelAnim }]}>
        {renderHistoryHeader()}
        <ScrollView style={historyStyles.historyScroll} contentContainerStyle={{ paddingBottom: 30 }}>
          {history.length === 0 ? (
            <Text style={historyStyles.emptyText}>No calculation history.</Text>
          ) : (
            (() => {
              const filteredHistory = history.filter(h =>
                (h.name || h.input).toLowerCase().includes(searchQuery.toLowerCase())
              );
              const sortedHistory = [...filteredHistory].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
              return sortedHistory.map((h, idx) => (
                <SwipeableHistoryItem
                  key={h.id || h.timestamp}
                  entry={h}
                  index={history.findIndex(e => (e.id || e.timestamp) === (h.id || h.timestamp))}
                  onResume={(e) => {
                    setInput(e.input);
                    setResult('');
                    closePanel();
                  }}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  setSelectedIndex={setSelectedIndex}
                  setModalVisible={setModalVisible}
                  setTempName={setTempName}
                />
              ));
            })()
          )}
        </ScrollView>
        <Animated.View
          {...panelPanResponder.panHandlers}
          style={[historyStyles.pullDashContainer]}
        >
          <View style={historyStyles.pullDash} />
        </Animated.View>
      </Animated.View>

      <View style={[styles.container, { paddingBottom: tabVisible ? TAB_HEIGHT : 16 }]}>
        <Pressable style={styles.display} onPress={handleDoubleTap}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[styles.inputText, { fontSize }]}
              value={input}
              onChangeText={setInput}
              multiline={false}
              cursorColor="#00ff00"
              selectionColor="#00ff00"
              textAlign="right"
              editable
              showSoftInputOnFocus={false}
              underlineColorAndroid="transparent"
            />
          </View>
          <Animated.Text
            style={[styles.resultText, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {result}
          </Animated.Text>
        </Pressable>

        <View style={styles.grid}>
          {BUTTONS.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((btn, j) =>
                btn === '' ? (
                  <View key={`spacer-${j}-${i}`} style={{ flex: 1, margin: 6 }} />
                ) : (
                  <Pressable
                    key={`${btn}-${j}-${i}`}
                    onPress={() => (btn === '=' ? handleEquals() : handleClick(btn))}
                    style={({ pressed }) => [
                      styles.button,
                      btn === 'C'
                        ? styles.clearButton
                        : btn === '⌫'
                        ? styles.backspaceButton
                        : btn === '='
                        ? styles.equalsButton
                        : styles.normalButton,
                      pressed && styles.buttonPressed,
                      pressed && btn === '=' ? styles.equalsPressed : null,
                    ]}
                  >
                    {btn === '⌫' ? (
                      <MaterialCommunityIcons name="backspace-outline" size={24} color="#fff" />
                    ) : (
                      <Text style={btn === '=' ? styles.equalsText : styles.buttonText}>{btn}</Text>
                    )}
                  </Pressable>
                )
              )}
            </View>
          ))}
        </View>
      </View>

      <Animated.View
        style={[styles.fakeTabBar, { opacity: fadeTabAnim, transform: [{ translateY: slideTabAnim }] }]}
      >
        <Pressable style={styles.tabButton} onPress={() => navigation.navigate('Calculator')}>
          <MaterialCommunityIcons name="calculator-variant" size={26} color="#00e676" />
        </Pressable>
        <Pressable style={styles.tabButton} onPress={() => navigation.navigate('Converter')}>
          <MaterialCommunityIcons name="currency-usd" size={26} color="#aaa" />
        </Pressable>
      </Animated.View>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Name this calculation</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter name"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleSaveName}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Calculator;

// Styles remain unchanged
const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#000' },
  blurHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, zIndex: 5 },
  container: { flex: 1, justifyContent: 'flex-end' },
  display: { minHeight: 180, paddingHorizontal: 10, marginBottom: 20 },
  fixedIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 16) : 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  inputWrapper: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', minHeight: 60 },
  inputText: { color: '#fff', fontFamily: 'monospace', width: '100%', textAlignVertical: 'center' },
  resultText: { color: '#ff9500', fontSize: 24, textAlign: 'right', marginTop: 6 },
  grid: {},
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: '#2e2e2e',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  normalButton: { backgroundColor: '#1c1c1e' },
  clearButton: { backgroundColor: '#d32f2f' },
  backspaceButton: { backgroundColor: '#555' },
  equalsButton: { backgroundColor: '#ff9500', elevation: 10 },
  buttonText: { color: '#fff', fontSize: 24 },
  equalsText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  buttonPressed: {
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  equalsPressed: { backgroundColor: '#e68900' },
  fakeTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_HEIGHT,
    backgroundColor: '#121212',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0,
    zIndex: 10,
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '80%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 8,
    color: '#fff',
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: '#00c853',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

const historyStyles = StyleSheet.create({
  historyPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    zIndex: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 18) : 18,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 9,
  },
  headerIcon: { padding: 7, borderRadius: 17 },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    backgroundColor: '#1e1e1e',
    fontSize: 16,
    color: '#fff',
  },
  headerIconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    position: 'relative',
  },
  menuDropdown: {
    position: 'absolute',
    top: 38,
    right: 0,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    paddingVertical: 6,
    minWidth: 150,
    elevation: 12,
    zIndex: 99,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  pullDashContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  pullDash: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFDD0',
    marginVertical: 12,
  },
  historyScroll: {
    paddingHorizontal: 10,
    paddingTop: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 17,
    marginTop: 30,
    fontStyle: 'italic',
  },
  rowContainer: {
    width: '100%',
    minHeight: 74,
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  actionBg: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 0,
    borderRadius: 15,
    paddingLeft: 24,
    paddingRight: 24,
  },
  pinAction: {
    backgroundColor: '#0288d1',
    justifyContent: 'flex-start',
  },
  deleteAction: {
    backgroundColor: '#d32f2f',
    justifyContent: 'flex-end',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardWrapper: { zIndex: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#1e1e1e',
    minHeight: 68,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 2,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#333',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  cardContent: { flex: 1, minWidth: 0, flexDirection: 'column', justifyContent: 'center' },
  titleText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 2, flex: 1 },
  resultText: { fontSize: 16, color: '#00e676', fontWeight: '600', marginBottom: 2 },
  timestamp: { fontSize: 12, color: '#aaa', alignSelf: 'flex-end', marginTop: 2 },
  pinIcon: { marginLeft: 7, marginTop: 2 },
});
