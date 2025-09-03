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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { evaluate } from 'mathjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const NUMERIC_GRID = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '.'],
];

const ARITHMETIC_STACK = ['+', '−', '×', '÷'];

const SCIENTIFIC_GRID = [
  ['sin', 'cos', 'tan'],
  ['log', 'ln', '√'],
  ['x^y', '1/x', 'π'],
  ['(', ')', 'C'],
];

const ProfessionalCalculator = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const panelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    loadHistory();
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  useEffect(() => {
    let archiveTimer;
    if (justEvaluated && input && result) {
      archiveTimer = setTimeout(() => {
        saveToHistory(input, result);
        setInput('');
      }, 5 * 60 * 1000);
    }
    return () => clearTimeout(archiveTimer);
  }, [justEvaluated, input, result]);

  const loadHistory = async () => {
    const stored = await AsyncStorage.getItem('calcHistory');
    if (stored) setHistory(JSON.parse(stored));
  };

  const saveToHistory = async (expression, outcome) => {
    const timestamp = new Date().toLocaleString();
    const newEntry = { input: expression, result: outcome, timestamp };
    const updated = [newEntry, ...history].slice(0, 20);
    setHistory(updated);
    await AsyncStorage.setItem('calcHistory', JSON.stringify(updated));
  };

  const handleClick = (val) => {
    if (val === 'C') {
      if (input || result) saveToHistory(input, result || '—');
      setInput('');
      setResult('');
      setJustEvaluated(false);
    } else if (val === 'DEL') {
      setInput((prev) => prev.slice(0, -1));
    } else if (val === '=') {
      handleEquals();
    } else if (val === 'x^y') {
      setInput((prev) => prev + '^');
    } else if (val === '1/x') {
      setInput((prev) => '1/(' + prev + ')');
    } else if (['sin', 'cos', 'tan', 'log', 'ln', '√'].includes(val)) {
      const mapped = val === '√' ? 'sqrt' : val;
      setInput((prev) => prev + mapped + '(');
    } else if (val === 'π') {
      setInput((prev) => prev + 'π');
    } else if (val === '(' || val === ')') {
      setInput((prev) => prev + val);
    } else if (justEvaluated && !isNaN(Number(val))) {
      setInput(val);
      setResult('');
      setJustEvaluated(false);
    } else {
      const calcVal = val === '×' ? '*' : val === '÷' ? '/' : val === '−' ? '-' : val;
      setInput((prev) => prev + calcVal);
    }
  };
const handleEquals = () => {
    const hasOperator = /[+\-*/^]/.test(input);
    if (!hasOperator) {
      setResult('');
      return;
    }

    try {
      const expression = input
        .replace(/π/g, Math.PI.toString())
        .replace(/√/g, 'sqrt')
        .replace(/ln/g, 'log')
        .replace(/sin\(/g, 'sin(radians(')
        .replace(/cos\(/g, 'cos(radians(')
        .replace(/tan\(/g, 'tan(radians(');

      const evalResult = evaluate(expression);
      setResult(evalResult.toString());
      setJustEvaluated(true);
    } catch (error) {
      setResult('');
    }
  };

  const resumeFromHistory = (entry) => {
    setInput(entry.input);
    setResult('');
    setJustEvaluated(false);
    closePanel();
  };

  const openPanel = () => {
    setPanelOpen(true);
    Animated.timing(panelAnim, {
      toValue: SCREEN_HEIGHT * 0.8,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const closePanel = () => {
    setPanelOpen(false);
    Animated.timing(panelAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panelAnim.setValue(Math.min(gestureState.dy, SCREEN_HEIGHT * 0.8));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SCREEN_HEIGHT * 0.3) {
          openPanel();
        } else {
          closePanel();
        }
      },
    })
  ).current;

  const renderKey = (val, labelStyle) => {
    const isClear = val === 'C';
    return (
      <TouchableOpacity
        key={val}
        onPress={() => handleClick(val)}
        style={[styles.key, isClear && styles.clearKey]}
      >
        <Text style={isClear ? styles.clearKeyLabel : labelStyle}>{val}</Text>
      </TouchableOpacity>
    );
  };
return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <Animated.View style={[styles.historyPanel, { height: panelAnim }]}>
        <View {...panResponder.panHandlers} style={styles.pullDash} />
        <ScrollView style={styles.historyScroll}>
          {history.map((entry, index) => (
            <TouchableOpacity key={index} onPress={() => resumeFromHistory(entry)}>
              <Text style={styles.historyItem}>
                {entry.input} = {entry.result} ({entry.timestamp})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <View style={styles.displayBox}>
        {input !== '' && (
          <TouchableOpacity onPress={() => setJustEvaluated(false)}>
            <Text style={styles.inputText}>{input}</Text>
          </TouchableOpacity>
        )}
        {result !== '' && <Text style={styles.resultText}>{result}</Text>}
      </View>

      <View style={styles.gridRow}>
        <View style={styles.numericColumn}>
          {NUMERIC_GRID.map((row, rowIndex) => (
            <View style={styles.row} key={rowIndex}>
              {row.map((val) => renderKey(val, styles.numericKeyLabel))}
            </View>
          ))}
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.centerGrid}>
          <View style={styles.arithmeticColumn}>
            {ARITHMETIC_STACK.map((val) => renderKey(val, styles.arithmeticKeyLabel))}
          </View>

          <View style={styles.controlColumn}>
            <TouchableOpacity onPress={() => handleClick('DEL')} style={styles.transparentIcon}>
              <MaterialIcons name="backspace" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              onPress={() => handleClick('=')}
              style={styles.equalsButton}
            >
              <Text style={styles.label}>=</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.scientificColumn}>
          {SCIENTIFIC_GRID.map((row, rowIndex) => (
            <View style={styles.row} key={rowIndex}>
              {row.map((val) => renderKey(val, styles.scientificKeyLabel))}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 8,
    paddingVertical: 6,
    paddingRight: 35,
  },
  displayBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
    height: 125,
    justifyContent: 'flex-end',
  },
  inputText: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'right',
  },
  resultText: {
    fontSize: 20,
    color: '#00e676',
    fontWeight: '400',
    textAlign: 'right',
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  numericColumn: {
    flex: 0.6,
    marginHorizontal: 2,
    justifyContent: 'space-evenly',
    paddingBottom: 16,
  },
  centerGrid: {
    flexDirection: 'row',
    flex: 0.3,
    justifyContent: 'space-between',
    marginHorizontal: 2,
  },
  scientificColumn: {
    flex: 0.8,
    marginHorizontal: 2,
    justifyContent: 'space-evenly',
    paddingBottom: 16,
  },
  arithmeticColumn: {
    flex: 1.2,
    justifyContent: 'space-evenly',
    paddingBottom: 5,
  },
  controlColumn: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingBottom: 16,
    paddingRight: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 1,
    paddingRight: 5,
  },
  key: {
    flex: 1,
    marginVertical: 3,
    marginHorizontal: 2,
    paddingVertical: 5,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numericKeyLabel: {
    fontSize: 19,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  arithmeticKeyLabel: {
    fontSize: 26,
    color: '#ffeb3b',
    fontWeight: '600',
    textAlign: 'center',
  },
  scientificKeyLabel: {
    fontSize: 15,
    color: '#80d8ff',
    fontWeight: '500',
    textAlign: 'center',
  },
  clearKey: {
    backgroundColor: '#b71c1c',
    borderRadius: 6,
  },
  clearKeyLabel: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
  },
  label: {
    fontSize: 30,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  equalsButton: {
    backgroundColor: '#00c853',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 35,
    height: '45%',
    alignSelf: 'center',
  },
  transparentIcon: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    height: '90%',
    backgroundColor: '#555',
    marginHorizontal: 4,
    paddingBottom: 5,
    paddingTop: 5,
    borderRadius: 4,
  },
  historyPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e1e1e',
    zIndex: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  pullDash: {
    width: 40,
    height: 5,
    backgroundColor: '#cccccc', // 👈 light gray for visibility
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 8,
  },
  historyScroll: {
    paddingHorizontal: 12,
  },
  historyItem: {
    color: '#ccc',
    fontSize: 13,
    marginVertical: 4,
  },
});
export default ProfessionalCalculator;
