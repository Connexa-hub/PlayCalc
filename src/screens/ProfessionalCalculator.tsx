import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Text as RNText,
  Animated,
} from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { evaluate } from 'mathjs';
import * as ScreenOrientation from 'expo-screen-orientation';

const NUMERIC_GRID = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '.'],
];

const ARITHMETIC_GRID = [
  ['+', '-', '×', '÷'],
  ['=', 'DEL', 'C'],
];

const SCIENTIFIC_GRID = [
  ['sin', 'cos', 'tan'],
  ['log', 'ln', '√'],
  ['x^y', '1/x', 'π'],
  ['(', ')'],
];

const ProfessionalCalculator = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const handleClick = (val: string) => {
    if (val === 'C') {
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
    } else if (val === '%') {
      setInput((prev) => prev + '/100');
    } else if (['sin', 'cos', 'tan', 'log', 'ln', '√'].includes(val)) {
      const mapped = val === '√' ? 'sqrt' : val;
      setInput((prev) => prev + mapped + '(');
    } else if (val === 'π') {
      setInput((prev) => prev + 'π');
    } else if (justEvaluated && !isNaN(Number(val))) {
      setInput(val);
      setResult('');
      setJustEvaluated(false);
    } else {
      const calcVal = val === '×' ? '*' : val === '÷' ? '/' : val;
      setInput((prev) => prev + calcVal);
    }
  };

  const handleEquals = () => {
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

      const timestamp = new Date().toLocaleString();
      setHistory([{ input, result: evalResult.toString(), timestamp }, ...history]);
    } catch (error) {
      setResult('Error');
    }
  };

  const resumeFromHistory = (entry) => {
    setInput(entry.input);
    setResult('');
    setJustEvaluated(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
        <Text style={styles.historyToggle}>
          {showHistory ? 'Hide History ▲' : 'Show History ▼'}
        </Text>
      </TouchableOpacity>

      {showHistory && (
        <ScrollView style={styles.historyBox}>
          {history.map((entry, index) => (
            <TouchableOpacity key={index} onPress={() => resumeFromHistory(entry)}>
              <Text style={styles.historyItem}>
                {entry.input} = {entry.result} ({entry.timestamp})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.displayBox}>
        {justEvaluated && (
          <TouchableOpacity onPress={() => setJustEvaluated(false)}>
            <Text style={styles.inputText}>{input}</Text>
          </TouchableOpacity>
        )}
        {result !== '' && <Text style={styles.resultText}>{result}</Text>}
        {!justEvaluated && <Text style={styles.inputText}>{input}</Text>}
      </View>

      <ScrollView style={styles.grid}>
        {[NUMERIC_GRID, ARITHMETIC_GRID, SCIENTIFIC_GRID].map((grid, i) => (
          <View key={i}>
            {grid.map((row, rowIndex) => (
              <View style={styles.row} key={rowIndex}>
                {row.map((button, colIndex) => (
                  <Button
                    mode="contained"
                    key={colIndex}
                    style={[
                      styles.button,
                      button === 'C' ? styles.clearButton : {},
                      button === '=' ? styles.equalsButton : {},
                    ]}
                    onPress={() => handleClick(button)}
                    labelStyle={styles.label}
                  >
                    {button}
                  </Button>
                ))}
              </View>
            ))}
            {i < 2 && <View style={styles.divider} />}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  displayBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    height: 100,
    justifyContent: 'flex-end',
  },
  inputText: {
    fontSize: 28,
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
  grid: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
  },
  label: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#ff4444',
  },
  equalsButton: {
    backgroundColor: '#0044aa',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 8,
  },
  historyToggle: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 6,
  },
  historyBox: {
    maxHeight: 120,
    marginBottom: 8,
  },
  historyItem: {
    color: '#ccc',
    fontSize: 14,
    marginVertical: 2,
    paddingHorizontal: 8,
  },
});

export default ProfessionalCalculator;
