import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const BUTTONS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['0', '.', 'C', '+'],
];

const Calculator = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const theme = useTheme();
  const navigation = useNavigation();

  const handleClick = (val: string) => {
    if (val === 'C') {
      setInput('');
      setJustEvaluated(false);
    } else if (val === '⌫') {
      setInput((prev) => prev.slice(0, -1));
    } else if (justEvaluated && !isNaN(Number(val))) {
      setInput(val);
      setJustEvaluated(false);
    } else {
      const calcVal = val === '×' ? '*' : val === '÷' ? '/' : val;
      setInput((prev) => prev + calcVal);
    }
  };

  const handleEquals = () => {
    try {
      const safeResult = Function(`"use strict"; return (${input})`)();
      const resultStr = safeResult.toString();
      setHistory((prev) => [...prev, `${input} = ${resultStr}`]);
      setInput(resultStr);
      setJustEvaluated(true);
    } catch {
      setInput('Error');
      setJustEvaluated(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.display}>{input || '0'}</Text>
        <ScrollView style={styles.history}>
          {history.map((entry, index) => (
            <Text
              key={index}
              style={styles.historyItem}
              onPress={() => {
                const expression = entry.split('=')[0].trim();
                setInput(expression);
                setJustEvaluated(false);
              }}
            >
              {entry}
            </Text>
          ))}
        </ScrollView>
      </View>

      {/* Buttons */}
      <View style={styles.grid}>
        {BUTTONS.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((btn) => (
              <TouchableOpacity
                key={btn}
                style={[
                  styles.button,
                  btn === 'C' ? styles.clearButton : styles.normalButton,
                ]}
                onPress={() => handleClick(btn)}
              >
                <Text style={styles.buttonText}>{btn}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Backspace and Equals */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, styles.backspaceButton]}
            onPress={() => handleClick('⌫')}
          >
            <MaterialCommunityIcons name="backspace-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.equalsButton]}
            onPress={handleEquals}
          >
            <Text style={styles.equalsText}>=</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scientific Mode Button */}
      <TouchableOpacity
        style={styles.scientificButton}
        onPress={() => navigation.navigate('ProfessionalCalculator')}
      >
        <Text style={styles.scientificText}>Scientific Mode</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 12,
    justifyContent: 'flex-end',
  },
  displayContainer: {
    marginBottom: 16,
  },
  display: {
    fontSize: 40,
    color: '#fff',
    textAlign: 'right',
    fontWeight: '700',
    marginBottom: 12,
  },
  history: {
    maxHeight: 100,
  },
  historyItem: {
    color: '#aaa',
    fontSize: 16,
    paddingVertical: 4,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'column',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  normalButton: {
    backgroundColor: '#1e1e1e',
  },
  clearButton: {
    backgroundColor: '#ff4444',
  },
  backspaceButton: {
    backgroundColor: '#444',
  },
  equalsButton: {
    backgroundColor: '#6200ea',
  },
  buttonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  equalsText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '700',
  },
  scientificButton: {
    marginTop: 16,
    backgroundColor: '#00e676',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  scientificText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121212',
  },
});

export default Calculator;
