import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  PanResponder,
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
import BannerAd from '../components/BannerAd';
import { showInterstitial } from '../components/InterstitialAd';

const math = create(all);
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const TAB_HEIGHT = 50;

// Key: Adjust this value to control the tiny gap between buttons-ad and ad-tab (or buttons-ad when tab hidden)
const TINY_GAP = 1; // <<< Tweak this for more/less space (set to 0 for no space)

// Key: Adjust this based on the actual height of your BannerAd component (e.g., 50 for standard banner ads)
const AD_HEIGHT = 50; // <<< Tweak this if your ad height differs

// Key: Adjust this value to add horizontal padding to the button grid when tab is visible, reducing button size to address space needs
const BUTTON_REDUCTION_PADDING = 10; // <<< Tweak this to make buttons smaller when tab visible (higher value = smaller buttons)

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
  return str
    .split(' ')
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
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
        // using internal value to set offset; this is acceptable at runtime
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const current: any = animX;
        try {
          current.setOffset(current._value);
        } catch {
          // fallback if _value is not available
        }
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

// ------ Banner Ad logic ------
const HISTORY_BANNER_INSERT_CHANCE = 0.3; // 30% chance to show banner in history scroll
const HISTORY_BANNER_MAX = 2; // Max 2 banners per history scroll
const HISTORY_BANNER_PLACE_MAX = 20; // Only show banner if history length is at least 5

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

  // PANEL ANIMATION: use translateY (closed = SCREEN_HEIGHT, open = 0)
  const panelAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  // keep a JS-side latest value via listener so pan responder logic can read it reliably
  const panelAnimValue = useRef<number>(SCREEN_HEIGHT);
  useEffect(() => {
    const id = panelAnim.addListener(({ value }) => {
      panelAnimValue.current = value;
    });
    return () => {
      try {
        panelAnim.removeListener(id);
      } catch {}
    };
  }, [panelAnim]);

  const initialPanelValue = useRef<number>(SCREEN_HEIGHT);

  const lastTap = useRef<number | null>(null);
  // ensure TextInput ref typing allows null
  const inputRef = useRef<TextInput | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  // --- Interstitial ad evaluation count ---
  const [evalCount, setEvalCount] = useState(0);

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
      // Type assertion for setNativeProps availability
      (inputRef.current as any).setNativeProps({ showSoftInputOnFocus: false });
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

  const formatNumberWithCommas = (value: string): string => {
    const parts = value.split('.');
    const integerPart = parts[0].replace(/[^0-9-]/g, '');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${formattedInteger}.${parts[1]}` : formattedInteger;
  };

  const parseNumberWithCommas = (value: string): string => {
    return value.replace(/,/g, '');
  };

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem('calcHistory');
      if (stored) {
        const parsed = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          pinned: entry.pinned ?? false,
          name: entry.name ?? '',
          id: entry.id || `${entry.timestamp}${Math.random().toString(36).slice(2)}`,
          result: formatNumberWithCommas(entry.result),
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
        setResult(result ? formatNumberWithCommas(result) : '');
      }
    } catch (error) {
      console.error('Error loading current:', error);
    }
  };

  const saveCurrent = async () => {
    try {
      await AsyncStorage.setItem('calcCurrent', JSON.stringify({ input, result: parseNumberWithCommas(result) }));
    } catch (error) {
      console.error('Error saving current:', error);
    }
  };

  const saveToHistory = async (expr: string, res: string) => {
    if (!expr || !res || res === 'Error' || (history[0]?.input === expr && history[0]?.result === parseNumberWithCommas(res)))
      return;
    const timestamp = new Date().toLocaleString();
    const newEntry: HistoryEntry = {
      input: expr,
      result: formatNumberWithCommas(res),
      timestamp,
      pinned: false,
      name: '',
      id: `${Date.now()}${Math.random().toString(36).slice(2)}`,
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    try {
      await AsyncStorage.setItem('calcHistory', JSON.stringify(updated.map(entry => ({
        ...entry,
        result: parseNumberWithCommas(entry.result)
      }))));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const updateHistoryStorage = async () => {
    try {
      await AsyncStorage.setItem('calcHistory', JSON.stringify(history.map(entry => ({
        ...entry,
        result: parseNumberWithCommas(entry.result)
      }))));
    } catch (error) {
      console.error('Error updating history:', error);
    }
  };

  const handleClick = (value: string) => {
    if (value === 'C') {
      if (input && result) saveToHistory(input, parseNumberWithCommas(result));
      setInput('');
      setResult('');
      setSelection(null);
    } else if (value === '⌫') {
      if (selection && selection.start === selection.end && selection.start > 0) {
        setInput(prev => prev.slice(0, selection.start - 1) + prev.slice(selection.start));
        setSelection({ start: selection.start - 1, end: selection.start - 1 });
      } else {
        setInput(prev => prev.slice(0, -1));
        setSelection(null);
      }
    } else {
      if (selection && selection.start === selection.end) {
        setInput(prev => prev.slice(0, selection.start) + value + prev.slice(selection.start));
        setSelection({ start: selection.start + 1, end: selection.start + 1 });
      } else {
        setInput(prev => prev + value);
        setSelection(null);
      }
    }
  };

  // ---- Interstitial Ad logic ----
  const handleEquals = () => {
    try {
      const expression = input.replace(/×/g, '*').replace(/÷/g, '/');
      const evalResult = math.evaluate(expression);
      const resultStr = evalResult.toString();
      setResult(formatNumberWithCommas(resultStr));
      saveToHistory(input, resultStr);

      setEvalCount(prev => {
        const next = prev + 1;
        if (next >= 6) {
          showInterstitial();
          return 0;
        }
        return next;
      });

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

  // OPEN / CLOSE using translateY (GPU accelerated)
  const openPanel = () => {
    // make sure panel visible/interactable before animating in
    setPanelOpen(true);
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(panelAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      // Only set panelOpen to false after animation completes
      setPanelOpen(false);
    });
  };

  const panelPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // set initial from the JS-side latest value
        initialPanelValue.current = panelAnimValue.current ?? SCREEN_HEIGHT;
      },
      onPanResponderMove: (_, g) => {
        const newVal = initialPanelValue.current + g.dy;
        panelAnim.setValue(Math.max(0, Math.min(SCREEN_HEIGHT, newVal)));
      },
      onPanResponderRelease: (_, g) => {
        const threshold = SCREEN_HEIGHT * 0.3;
        const currentVal = panelAnimValue.current ?? 0;
        // If the gesture pulls upward quickly, open the panel fully
        if (g.dy < -10 || g.vy < -0.1) {
          openPanel();
        } else if (currentVal > threshold || g.vy > 0.3) {
          // translateY > threshold (moved down enough) -> close
          closePanel();
        } else {
          openPanel();
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

  // --- History Panel with stable banner ad insertion ---
  // Memoize the mixedItems based on history and searchQuery so it doesn't change on every render.
  const getHistoryWithAdsStable = useMemo(() => {
    return (filteredHistory: HistoryEntry[]) => {
      if (filteredHistory.length < 5) return filteredHistory.map((h, idx) => ({ type: 'item', entry: h, idx }));
      const arr: { type: 'item' | 'ad'; entry?: HistoryEntry; idx?: number }[] = [];
      const maxBanner = Math.min(HISTORY_BANNER_MAX, Math.floor(filteredHistory.length / 5));
      const bannerPositions: number[] = [];
      // generate deterministic-ish positions based on content length to avoid reshuffle each render
      for (let i = 1; i <= maxBanner; i++) {
        const sliceStart = (i - 1) * Math.floor(filteredHistory.length / maxBanner);
        const sliceEnd = Math.min(filteredHistory.length - 2, sliceStart + Math.floor(filteredHistory.length / maxBanner));
        const pos = Math.min(filteredHistory.length - 2, Math.max(2, Math.floor(sliceStart + (sliceEnd - sliceStart) / 2)));
        bannerPositions.push(pos);
      }
      let inserts = 0;
      for (let i = 0; i < filteredHistory.length; i++) {
        if (bannerPositions.includes(i) && inserts < maxBanner) {
          arr.push({ type: 'ad' });
          inserts++;
        }
        arr.push({ type: 'item', entry: filteredHistory[i], idx: i });
      }
      return arr;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Banner Ad positioning: always absolute, adjust bottom based on tab visibility ---
  const bannerAdBottomStyle = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: tabVisible ? TAB_HEIGHT + TINY_GAP : 0,
  };

  // --- Container padding to prevent buttons overlapping ad/tab ---
  const containerPaddingBottom = AD_HEIGHT + TINY_GAP + (tabVisible ? TAB_HEIGHT + TINY_GAP : 0);

  // --- Grid horizontal padding to reduce button size when tab visible ---
  const gridPaddingHorizontal = tabVisible ? BUTTON_REDUCTION_PADDING : 0;

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

      {/* --- History Panel with stable banner ad --- */}
      <Animated.View
        {...panelPanResponder.panHandlers}
        pointerEvents={panelOpen ? 'auto' : 'none'}
        style={[
          historyStyles.historyPanel,
          {
            // keep panel full-screen height to avoid relayout; animate translateY
            height: SCREEN_HEIGHT,
            transform: [{ translateY: panelAnim }],
            zIndex: panelOpen ? 15 : -1,
          },
        ]}
      >
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
              const mixedItems = getHistoryWithAdsStable(sortedHistory);
              return mixedItems.map((item, i) => {
                if (item.type === 'ad') {
                  return (
                    <View key={`banner-history-${i}`} style={{ marginVertical: 9, alignItems: 'center' }}>
                      <BannerAd style={{}} />
                    </View>
                  );
                } else if (item.type === 'item' && item.entry) {
                  return (
                    <SwipeableHistoryItem
                      key={item.entry.id || item.entry.timestamp}
                      entry={item.entry}
                      index={history.findIndex(e => (e.id || e.timestamp) === (item.entry!.id || item.entry!.timestamp))}
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
                  );
                }
                return null;
              });
            })()
          )}
        </ScrollView>
      </Animated.View>

      {/* Key: Container with dynamic paddingBottom to make space for ad and tab */}
      <View style={[styles.container, { paddingBottom: containerPaddingBottom }]}>
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
              selection={selection}
              onSelectionChange={({ nativeEvent: { selection } }) => setSelection(selection)}
            />
          </View>
          <Animated.Text
            style={[styles.resultText, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            {result}
          </Animated.Text>
        </Pressable>

        {/* Key: Grid with dynamic paddingHorizontal to reduce button size when tab visible */}
        <View style={[styles.grid, { paddingHorizontal: gridPaddingHorizontal }]}>
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

      {/* Banner Ad always absolute, positioned based on tab visibility */}
      <View style={[styles.bannerAdContainer, bannerAdBottomStyle]}>
        <BannerAd style={{ alignSelf: 'center' }} />
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

// Styles remain unchanged except grid and removal of pullDash styles
const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#000' },
  blurHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, zIndex: 5 },
  container: { flex: 1, justifyContent: 'flex-end' },
  display: { minHeight: 100, paddingHorizontal: 10, marginBottom: 4, marginTop: 20 },
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
  resultText: { color: '#ff9500', fontSize: 24, textAlign: 'right', paddingBottom:8, marginTop: 6 },
  grid: {paddingBottom:0},
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
  bannerAdContainer: {
    width: '100%',
    alignItems: 'center',
    zIndex: 9,
  },
});

const historyStyles = StyleSheet.create({
  historyPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
    // removed direct reference to panelOpen here (panelOpen is component state and not available at style creation time)
    zIndex: 0,
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
  headerIcon: { padding: 7,paddingTop:10, borderRadius: 17 },
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
