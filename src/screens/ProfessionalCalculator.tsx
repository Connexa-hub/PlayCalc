// src/screens/ProfessionalCalculator.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
  TextInput,
  Platform,
  AppState,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { create, all } from 'mathjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';

const math = create(all);
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const NUMERIC_GRID = [['7','8','9'],['4','5','6'],['1','2','3'],['0','.']];
const ARITHMETIC_STACK = ['+', '−', '×', '÷'];
const SCIENTIFIC_GRID = [['sin','cos','tan'],['log','ln','√'],['x^y','1/x','π'],['(',')','C']];

function getInitials(str: string) {
  if (!str) return '';
  return str.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#81c784', '#64b5f6', '#ffb74d', '#ff8a65', '#ba68c8', '#ffd54f', '#4db6ac'];
function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export const SwipeableHistoryItem = ({
  entry,
  index,
  onResume,
  onDelete,
  onPin,
  setSelectedIndex,
  setModalVisible,
  setTempName
}) => {
  const animX = useRef(new Animated.Value(0)).current;
  const deleteIconAnim = useRef(new Animated.Value(0)).current;
  const [isRemoving, setIsRemoving] = useState(false);
  const [swiping, setSwiping] = useState<null | 'left' | 'right'>(null);

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

  const panResponder = useRef(
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

        if ((g.dx > swipeThreshold) || (g.vx > fastSwipe)) {
          Animated.spring(animX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start(() => onPin(index));
        }
        else if ((g.dx < -swipeThreshold || g.vx < -fastSwipe) && !entry.pinned) {
          animateDeleteAndRemove();
        }
        else if ((g.dx < -swipeThreshold || g.vx < -fastSwipe) && entry.pinned) {
          Animated.sequence([
            Animated.timing(animX, { toValue: -30, duration: 80, useNativeDriver: true }),
            Animated.timing(animX, { toValue: 30, duration: 80, useNativeDriver: true }),
            Animated.timing(animX, { toValue: 0, duration: 80, useNativeDriver: true }),
          ]).start();
        }
        else {
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
      {swiping === 'right' &&
        <View style={[historyStyles.actionBg, historyStyles.pinAction]}>
          <MaterialIcons name="push-pin" size={24} color="#fff" style={{ marginRight: 6 }} />
          <Text style={historyStyles.actionText}>{entry.pinned ? 'Unpin' : 'Pin'}</Text>
        </View>
      }
      {swiping === 'left' &&
        <View style={[historyStyles.actionBg, historyStyles.deleteAction]}>
          <Animated.View style={{
            flexDirection: 'row',
            alignItems: 'center',
            transform: [{ translateX: deleteIconTranslate }],
            opacity: deleteIconOpacity,
          }}>
            <MaterialIcons name="delete" size={24} color="#fff" style={{ marginRight: 6 }} />
            <Text style={historyStyles.actionText}>
              {entry.pinned ? 'Unpin to Delete' : 'Delete'}
            </Text>
          </Animated.View>
        </View>
      }
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          historyStyles.cardWrapper,
          { transform: [{ translateX: animX }] }
        ]}
      >
        <TouchableOpacity
          onPress={() => onResume(entry)}
          onLongPress={() => { setSelectedIndex(index); setTempName(entry.name || ''); setModalVisible(true); }}
          activeOpacity={0.82}
        >
          <View style={historyStyles.card}>
            <View style={[historyStyles.avatarCircle, { backgroundColor: avatarColor }]}>
              <Text style={historyStyles.avatarText}>{avatarText}</Text>
            </View>
            <View style={historyStyles.cardContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={historyStyles.titleText} numberOfLines={1}>{entry.name || entry.input}</Text>
                {entry.pinned && (
                  <MaterialIcons name="push-pin" size={16} color="#0288d1" style={historyStyles.pinIcon} />
                )}
              </View>
              <Text style={historyStyles.resultText} numberOfLines={1}>{entry.result}</Text>
              <Text style={historyStyles.timestamp}>{entry.timestamp}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const ProfessionalCalculator = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [angleMode, setAngleMode] = useState('rad');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tempName, setTempName] = useState('');
  const [swipeAction, setSwipeAction] = useState<{[key:number]: 'pin'|'delete'|null}>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const angleModeRef = useRef('rad');
  const scope = useState({})[0];
  const panelAnim = useRef(new Animated.Value(0)).current;
  const modeRotation = useRef(new Animated.Value(0)).current;
  const initialPanelValue = useRef(0);

  const navigation = useNavigation();

  const rotate = modeRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    loadHistory();
    loadCurrent();
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState.match(/inactive|background/)) {
        saveCurrent();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [input, result, justEvaluated]);

  useEffect(() => {
    const customSin = (angle:number) => {
      const rad = angleModeRef.current === 'deg' ? math.unit(angle,'deg').toNumber('rad') : angle;
      return math.sin(rad);
    };
    const customCos = (angle:number) => {
      const rad = angleModeRef.current === 'deg' ? math.unit(angle,'deg').toNumber('rad') : angle;
      return math.cos(rad);
    };
    const customTan = (angle:number) => {
      const rad = angleModeRef.current === 'deg' ? math.unit(angle,'deg').toNumber('rad') : angle;
      return math.tan(rad);
    };
    math.import({ sin: customSin, cos: customCos, tan: customTan }, { override: true });
  }, []);

  const loadHistory = async () => {
    const stored = await AsyncStorage.getItem('calcHistory');
    if (stored) {
      const parsed = JSON.parse(stored).map((entry:any)=>({
        ...entry,
        pinned: entry.pinned ?? false,
        name: entry.name ?? '',
        id: entry.id || (entry.timestamp + Math.random().toString(36).slice(2))
      }));
      setHistory(parsed);
    }
  };

  const loadCurrent = async () => {
    const stored = await AsyncStorage.getItem('calcCurrent');
    if (stored) {
      const { input, result, justEvaluated } = JSON.parse(stored);
      setInput(input);
      setResult(result);
      setJustEvaluated(justEvaluated);
    }
  };

  const saveCurrent = async () => {
    await AsyncStorage.setItem('calcCurrent', JSON.stringify({ input, result, justEvaluated }));
  };

  const saveToHistory = async (expr:string, res:string) => {
    if (!expr || !res || res === 'Error' || (history[0]?.input === expr && history[0]?.result === res)) return;
    const timestamp = new Date().toLocaleString();
    const newEntry = {
      input: expr,
      result: res,
      timestamp,
      pinned: false,
      name: '',
      id: Date.now().toString() + Math.random().toString(36).slice(2)
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    await AsyncStorage.setItem('calcHistory', JSON.stringify(updated));
  };

  const updateHistoryStorage = async () => {
    await AsyncStorage.setItem('calcHistory', JSON.stringify(history));
  };

  const handleClick = (val:string) => {
    if(val==='C'){
      if(input && result) saveToHistory(input,result||'—');
      setInput(''); setResult(''); setJustEvaluated(false);
    }
    else if(val==='DEL'){ setInput(prev=>prev.slice(0,-1)); }
    else if(val==='='){ handleEquals(); }
    else if(val==='x^y'){
      if (justEvaluated) {
        setInput(result + '^');
        setResult('');
        setJustEvaluated(false);
      } else {
        setInput(prev=>prev+'^');
      }
    }
    else if(val==='1/x'){
      const base = justEvaluated ? result : input;
      setInput('1/('+base+')');
      setResult('');
      setJustEvaluated(false);
    }
    else if(['sin','cos','tan','log','ln','√'].includes(val)){
      const mapped = val==='√'?'sqrt':val;
      if (justEvaluated) {
        setInput(mapped + '(');
        setResult('');
        setJustEvaluated(false);
      } else {
        setInput(prev=>prev+mapped+'(');
      }
    }else if(val==='π'){
      if (justEvaluated) {
        setInput('π');
        setResult('');
        setJustEvaluated(false);
      } else {
        setInput(prev=>prev+'π');
      }
    }
    else if(val==='('||val===')'){
      if (justEvaluated) {
        setInput(val);
        setResult('');
        setJustEvaluated(false);
      } else {
        setInput(prev=>prev+val);
      }
    }
    else if(justEvaluated && (!isNaN(Number(val)) || val === '.')){ setInput(val); setResult(''); setJustEvaluated(false); }
    else if(justEvaluated && (ARITHMETIC_STACK.includes(val) || val === 'x^y')) {
      const calcVal = val==='×'?'*':val==='÷'?'/':val==='−'?'-':val==='x^y'?'^':val;
      setInput(result + calcVal);
      setResult('');
      setJustEvaluated(false);
    }
    else{ const calcVal = val==='×'? '*':val==='÷'? '/':val==='−'?'-':val; setInput(prev=>prev+calcVal);}
  };

  const handleEquals = () => {
    if(!input || /^[\d.]+$/.test(input)){ setResult(''); return; }
    let expr = input.replace(/π/g, Math.PI.toString()).replace(/√/g,'sqrt').replace(/log/g,'log10');
    try{
      const res = math.evaluate(expr,scope);
      const resStr = res.toString();
      setResult(resStr);
      scope.ans=res;
      setJustEvaluated(true);
      saveToHistory(input, resStr);
    }
    catch(e){ setResult('Error');}
  };

  const handleDelete = (index:number) => {
    if (history[index].pinned) return;
    const updated = [...history];
    updated.splice(index,1);
    setHistory(updated);
    updateHistoryStorage();
  };

  const handlePin = (index:number) => {
    const updated = [...history];
    updated[index].pinned=!updated[index].pinned;
    setHistory(updated);
    updateHistoryStorage();
  };

  const handleSaveName = () => {
    if(selectedIndex!==null){
      const updated = [...history];
      updated[selectedIndex].name = tempName;
      setHistory(updated);
      updateHistoryStorage();
    }
    setModalVisible(false);
  };

  const openPanel = () => {
    setPanelOpen(true);
    Animated.timing(panelAnim,{toValue:SCREEN_HEIGHT,duration:300,useNativeDriver:false}).start();
  };

  const closePanel = () => {
    setPanelOpen(false);
    Animated.timing(panelAnim,{toValue:0,duration:300,useNativeDriver:false}).start();
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder:()=>true,
    onPanResponderGrant:()=>initialPanelValue.current=panelAnim._value,
    onPanResponderMove:(_,g)=>{
      const newVal=initialPanelValue.current+g.dy;
      panelAnim.setValue(Math.max(0,Math.min(SCREEN_HEIGHT,newVal)));
    },
    onPanResponderRelease:(_,g)=>{
      const threshold = SCREEN_HEIGHT*0.3;
      if(panelAnim._value>threshold||g.vy>0.2) openPanel(); else closePanel();
    }
  })).current;

  const handleSetAngleMode = (newMode:string) => {
    Animated.timing(modeRotation,{toValue:1,duration:200,useNativeDriver:true}).start(()=>{
      setAngleMode(newMode); angleModeRef.current=newMode;
      modeRotation.setValue(0);
    });
  };

  const renderKey = (val:string,labelStyle:any) => (
    <TouchableOpacity key={val} onPress={()=>handleClick(val)} style={[styles.key,val==='C'?styles.clearKey:{}]}>
      <Text style={val==='C'?styles.clearKeyLabel:labelStyle}>{val}</Text>
    </TouchableOpacity>
  );

  const shareHistory = async () => {
    const shareText = history.map(h => `${h.name || h.input} = ${h.result} (${h.timestamp})`).join('\n\n');
    const uri = FileSystem.cacheDirectory + 'calculator_history.txt';
    await FileSystem.writeAsStringAsync(uri, shareText);
    await Sharing.shareAsync(uri, { mimeType: 'text/plain', dialogTitle: 'Share Calculation History' });
  };

  const renderHistoryHeader = () => (
    <View style={historyStyles.historyHeader}>
      <TouchableOpacity onPress={closePanel} style={historyStyles.headerIcon}>
        <MaterialIcons name="arrow-back" size={26} color="#222" />
      </TouchableOpacity>
      <TextInput
        style={historyStyles.searchInput}
        placeholder="Search history..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={historyStyles.headerIconsRight}>
        <TouchableOpacity onPress={shareHistory} style={historyStyles.headerIcon}>
          <MaterialIcons name="share" size={24} color="#222" />
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setMenuVisible(!menuVisible)} style={historyStyles.headerIcon}>
          <MaterialIcons name="more-vert" size={24} color="#222" />
        </TouchableOpacity>
        {menuVisible && (
          <View style={historyStyles.menuDropdown}>
            <TouchableOpacity onPress={() => { setHistory([]); AsyncStorage.removeItem('calcHistory'); setMenuVisible(false); }}>
              <Text style={historyStyles.menuItem}>Clear All History</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMenuVisible(false); alert('Export feature coming soon!'); }}>
              <Text style={historyStyles.menuItem}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setMenuVisible(false); alert('Settings feature coming soon!'); }}>
              <Text style={historyStyles.menuItem}>Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212"/>
      <Animated.View style={[historyStyles.historyPanel, {height: panelAnim}]}>
        {renderHistoryHeader()}
        <View {...panResponder.panHandlers} style={historyStyles.pullDash}/>
        <ScrollView style={historyStyles.historyScroll} contentContainerStyle={{paddingBottom:30}}>
          {history.length === 0 ? (
            <Text style={historyStyles.emptyText}>No calculation history.</Text>
          ) : (() => {
            const filteredHistory = history.filter(h => (h.name || h.input).toLowerCase().includes(searchQuery.toLowerCase()));
            const sortedHistory = [...filteredHistory].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
            return sortedHistory.map((h) =>
              <SwipeableHistoryItem
                key={h.id || h.timestamp}
                entry={h}
                index={history.findIndex(e => (e.id || e.timestamp) === (h.id || h.timestamp))}
                onResume={(e)=>{setInput(e.input); setResult(''); closePanel();}}
                onDelete={handleDelete}
                onPin={handlePin}
                setSelectedIndex={setSelectedIndex}
                setModalVisible={setModalVisible}
                setTempName={setTempName}
              />
            );
          })()}
        </ScrollView>
      </Animated.View>

      <View style={styles.displayBox}>
        <TouchableOpacity style={[styles.iconButton, {position:'absolute',left:10,bottom:90}]} onPress={openPanel}>
          <MaterialIcons name="history" size={24} color="#fff"/>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, {position:'absolute',left:10,bottom:50}]} onPress={() => navigation.navigate('Calculator')}>
          <MaterialCommunityIcons name="calculator" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, {position:'absolute',left:10,bottom:10}]} onPress={()=>handleSetAngleMode(angleMode==='rad'?'deg':'rad')}>
          <Animated.Text style={{color:'#fff',fontSize:20, transform: [{rotate}]}}>{angleMode.toUpperCase()}</Animated.Text>
        </TouchableOpacity>
        {input!=='' && <TouchableOpacity onPress={()=>setJustEvaluated(false)}><Text style={styles.inputText}>{input}</Text></TouchableOpacity>}
        {result!=='' && <Text style={styles.resultText}>{result}</Text>}
      </View>

      <View style={styles.gridRow}>
        <View style={styles.numericColumn}>
          {NUMERIC_GRID.map((row,rowIndex)=><View style={styles.row} key={rowIndex}>{row.map(v=>renderKey(v,styles.numericKeyLabel))}</View>)}
        </View>
        <View style={styles.verticalDivider}/>
        <View style={styles.centerGrid}>
          <View style={styles.arithmeticColumn}>{ARITHMETIC_STACK.map(v=>renderKey(v,styles.arithmeticKeyLabel))}</View>
          <View style={styles.controlColumn}>
            <TouchableOpacity onPress={()=>handleClick('DEL')} style={styles.transparentIcon}>
              <MaterialIcons name="backspace" size={24} color="#fff"/>
            </TouchableOpacity>
            <View style={{flex:1}}/>
            <TouchableOpacity onPress={()=>handleClick('=')} style={styles.equalsButton}>
              <Text style={styles.label}>=</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.verticalDivider}/>
        <View style={styles.scientificColumn}>
          {SCIENTIFIC_GRID.map((row,rowIndex)=><View style={styles.row} key={rowIndex}>{row.map(v=>renderKey(v,styles.scientificKeyLabel))}</View>)}
        </View>
      </View>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={()=>setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Name this calculation</Text>
            <TextInput style={styles.modalInput} value={tempName} onChangeText={setTempName} placeholder="Enter name" placeholderTextColor="#888"/>
            <TouchableOpacity style={styles.modalButton} onPress={handleSaveName}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#121212',paddingHorizontal:8,paddingVertical:6},
  displayBox:{backgroundColor:'#1a1a1a',borderRadius:10,padding:20,marginBottom:10,height:125,justifyContent:'flex-end'},
  inputText:{fontSize:26,color:'#fff',fontWeight:'500',textAlign:'right'},
  resultText:{fontSize:20,color:'#00e676',fontWeight:'400',textAlign:'right',marginTop:4},
  gridRow:{flexDirection:'row',justifyContent:'space-between',flex:1},
  numericColumn:{flex:0.6,marginHorizontal:2,justifyContent:'space-evenly',paddingBottom:16},
  centerGrid:{flexDirection:'row',flex:0.3,justifyContent:'space-between',marginHorizontal:2},
  scientificColumn:{flex:0.8,marginHorizontal:2,justifyContent:'space-evenly',paddingBottom:16},
  arithmeticColumn:{flex:1.2,justifyContent:'space-evenly',paddingBottom:5},
  controlColumn:{flex:1,justifyContent:'space-between',alignItems:'center',paddingVertical:6,paddingBottom:16,paddingRight:5},
  row:{flexDirection:'row',justifyContent:'space-between',marginBottom:4,paddingBottom:1,paddingRight:5},
  key:{flex:1,marginVertical:3,marginHorizontal:2,paddingVertical:5,backgroundColor:'transparent',alignItems:'center',justifyContent:'center'},
  numericKeyLabel:{fontSize:19,color:'#fff',fontWeight:'600',textAlign:'center'},
  arithmeticKeyLabel:{fontSize:26,color:'#ffeb3b',fontWeight:'600',textAlign:'center'},
  scientificKeyLabel:{fontSize:15,color:'#80d8ff',fontWeight:'500',textAlign:'center'},
  clearKey:{backgroundColor:'#b71c1c',borderRadius:6},
  clearKeyLabel:{fontSize:13,color:'#fff',fontWeight:'500',textAlign:'center'},
  label:{fontSize:30,color:'#fff',fontWeight:'600',textAlign:'center'},
  equalsButton:{backgroundColor:'#00c853',borderRadius:10,justifyContent:'center',alignItems:'center',width:35,height:'45%',alignSelf:'center'},
  transparentIcon:{padding:6,alignItems:'center',justifyContent:'center'},
  verticalDivider:{width:1,height:'90%',backgroundColor:'#555',marginHorizontal:4,paddingBottom:5,paddingTop:5,borderRadius:4},
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    backgroundColor: '#f5f7fa',
    zIndex: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0008',
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
    backgroundColor: '#f5f7fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 9,
  },
  headerIcon: { padding: 7, borderRadius: 17 },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#1a237e',
    textAlign: 'center',
    letterSpacing: 1.1,
  },
  headerIconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    position: 'relative',
  },
  menuDropdown: {
    position:'absolute',
    top:38,
    right:0,
    backgroundColor:'#fff',
    borderRadius:10,
    shadowColor:'#000',
    shadowOffset:{width:0,height:2},
    shadowOpacity:0.15,
    shadowRadius:8,
    paddingVertical:6,
    minWidth:150,
    elevation:12,
    zIndex:99
  },
  menuItem: {
    paddingVertical:10,
    paddingHorizontal:18,
    fontSize:16,
    color:'#263238',
    fontWeight:'500'
  },
  pullDash: {
    width: 48,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 10,
  },
  historyScroll: {
    paddingHorizontal: 10,
    paddingTop: 0,
  },
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
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
    backgroundColor: '#81c784',
    justifyContent: 'flex-start',
  },
  deleteAction: {
    backgroundColor: '#e57373',
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
    backgroundColor: '#fff',
    minHeight: 68,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 2,
    elevation: 3,
    shadowColor: '#0002',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 15, borderWidth: 2, borderColor: '#eee',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#444' },
  cardContent: { flex: 1, minWidth: 0, flexDirection: 'column', justifyContent: 'center' },
  titleText: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 2, flex: 1 },
  resultText: { fontSize: 16, color: '#00796b', fontWeight: '600', marginBottom: 2 },
  timestamp: { fontSize: 12, color: '#757575', alignSelf: 'flex-end', marginTop: 2 },
  pinIcon: { marginLeft: 7, marginTop: 2 },
});

export default ProfessionalCalculator;
