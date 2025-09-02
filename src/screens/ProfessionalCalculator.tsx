import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { evaluate } from 'mathjs';
import * as ScreenOrientation from 'expo-screen-orientation';

const BUTTON_GRID = [
  // Rearranged to match the screenshot layout
  ['7', '8', '9', '÷', 'sin'],
  ['4', '5', '6', '×', 'cos'],
  ['1', '2', '3', '-', 'tan'],
  ['0', '.', 'C', '+', 'log'],
  ['(', ')', '%', '=', 'ln'],
  ['√', 'x^y', '1/x', 'π', 'DEL'],
];

const ProfessionalCalculator = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);
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
    } catch (error) {
      setResult('Error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.displayBox}>
        <Text style={styles.inputText}>{input}</Text>
        {result !== '' && <Text style={styles.resultText}>{result}</Text>}
      </View>
      <ScrollView style={styles.grid}>
        {BUTTON_GRID.map((row, rowIndex) => (
          <View style={styles.row} key={rowIndex}>
            {row.map((button, colIndex) => (
              <Button
                mode="contained"
                key={colIndex}
                style={[styles.button, button === 'C' ? styles.clearButton : {}, button === '=' ? styles.equalsButton : {}]}
                onPress={() => handleClick(button)}
                labelStyle={styles.label}
              >
                {button}
              </Button>
            ))}
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
});

export default ProfessionalCalculator;
