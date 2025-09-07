import React, { useState, 
useRef, useEffect } from 'react'; import {
  View, Text, StyleSheet, Pressable, TextInput, Animated, 
  SafeAreaView, StatusBar, Keyboard, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur'; import MaterialCommunityIcons 
from 'react-native-vector-icons/MaterialCommunityIcons'; import * as 
NavigationBar from 'expo-navigation-bar'; import { useNavigation } 
from '@react-navigation/native'; const TAB_HEIGHT = 50; const 
Calculator: React.FC = () => {
  const navigation = useNavigation(); const [input, setInput] = 
  useState(''); const [result, setResult] = useState(''); const 
  [tabVisible, setTabVisible] = useState(false); const MAX_FONT = 48; 
  const MIN_FONT = 16; const [fontSize, setFontSize] = 
  useState(MAX_FONT); const fadeAnim = useRef(new 
  Animated.Value(0)).current; const slideAnim = useRef(new 
  Animated.Value(20)).current; const fadeTabAnim = useRef(new 
  Animated.Value(0)).current; const slideTabAnim = useRef(new 
  Animated.Value(TAB_HEIGHT)).current; const lastTap = useRef<number | 
  null>(null); const inputRef = useRef<TextInput>(null); useEffect(() 
  => {
    NavigationBar.setVisibilityAsync('hidden'); 
    NavigationBar.setBehaviorAsync('overlay-swipe'); 
    navigation.setOptions({ tabBarStyle: { display: 'none' } });
  }, []);
  useEffect(() => { Animated.parallel([ Animated.timing(fadeTabAnim, { 
      toValue: tabVisible ? 1 : 0, duration: 250, useNativeDriver: 
      true }), Animated.timing(slideTabAnim, { toValue: tabVisible ? 0 
      : TAB_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [tabVisible]);
  const handleDoubleTap = () => { const now = Date.now(); if 
    (lastTap.current && now - lastTap.current < 300) {
      Keyboard.dismiss(); setTabVisible(prev => !prev);
    }
    lastTap.current = now;
  };
  useEffect(() => { if (inputRef.current) { 
      inputRef.current.setNativeProps({ showSoftInputOnFocus: false 
      });
    }
  }, []);
  useEffect(() => { if (result !== '') { fadeAnim.setValue(0); 
      slideAnim.setValue(20); Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, 
        useNativeDriver: true }), Animated.timing(slideAnim, { 
        toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [result]);
  useEffect(() => { if (input.length > 12 && fontSize > MIN_FONT) { 
      setFontSize(prev => Math.max(MIN_FONT, prev - 1));
    } else if (input.length <= 12 && fontSize !== MAX_FONT) {
      setFontSize(MAX_FONT);
    }
  }, [input]);
  const handleClick = (value: string) => { if (value === 'C') { 
      setInput(''); setResult('');
    } else if (value === '⌫') {
      setInput(input.slice(0, -1));
    } else {
      setInput(prev => prev + value);
    }
  };
  const handleEquals = () => { try { const expression = 
      input.replace(/×/g, '*').replace(/÷/g, '/'); const evalResult = 
      eval(expression); setResult(evalResult.toString());
    } catch {
      setResult('Error');
    }
  };
  const BUTTONS = [ ['7', '8', '9', '÷'], ['4', '5', '6', '×'], ['1', 
    '2', '3', '-'], ['0', '.', 'C', '+'], ['', '⌫', '=', ''],
  ]; return ( <SafeAreaView style={styles.safeContainer}> <StatusBar 
      translucent backgroundColor="transparent" 
      barStyle="light-content" /> <BlurView intensity={40} tint="dark" 
      style={styles.blurHeader} /> {/* Fixed icons just below status 
      bar */} <View style={styles.fixedIconRow}>
        <MaterialCommunityIcons name="history" size={28} color="#fff" 
        /> <MaterialCommunityIcons name="function" size={28} 
        color="#fff" />
      </View> <View style={[styles.container, { paddingBottom: 
      tabVisible ? TAB_HEIGHT : 16 }]}>
        {/* Double-tap area */} <Pressable style={styles.display} 
        onPress={handleDoubleTap}>
          <View style={styles.inputWrapper}> <TextInput ref={inputRef} 
              style={[styles.inputText, { fontSize }]} value={input} 
              onChangeText={setInput} multiline={false} 
              cursorColor="#00ff00" selectionColor="#00ff00" 
              textAlign="right" editable showSoftInputOnFocus={false} 
              underlineColorAndroid="transparent"
            /> </View> <Animated.Text style={[styles.resultText, { 
          opacity: fadeAnim, transform: [{ translateY: slideAnim }] 
          }]}>
            {result} </Animated.Text> </Pressable> {/* Buttons */} 
        <View style={styles.grid}>
          {BUTTONS.map((row, i) => ( <View key={i} style={styles.row}> 
              {row.map((btn, j) =>
                btn === '' ? ( <View key={`spacer-${j}-${i}`} style={{ 
                  flex: 1, margin: 6 }} />
                ) : ( <Pressable key={`${btn}-${j}-${i}`} onPress={() 
                    => (btn === '=' ? handleEquals() : 
                    handleClick(btn))} style={({ pressed }) => [
                      styles.button, btn === 'C' ? styles.clearButton
                        : btn === '⌫'
                        ? styles.backspaceButton
                        : btn === '='
                        ? styles.equalsButton
                        : styles.normalButton,
                      pressed && styles.buttonPressed, pressed && btn 
                      === '=' ? styles.equalsPressed : null,
                    ]}
                  >
                    {btn === '⌫' ? ( <MaterialCommunityIcons 
                      name="backspace-outline" size={24} color="#fff" 
                      />
                    ) : ( <Text style={btn === '=' ? styles.equalsText 
                      : styles.buttonText}>{btn}</Text>
                    )} </Pressable> ) )} </View> ))} </View> </View> 
      {/* Animated overlay tab bar */} <Animated.View 
      style={[styles.fakeTabBar, { opacity: fadeTabAnim, transform: [{ 
      translateY: slideTabAnim }] }]}>
        <Pressable style={styles.tabButton} onPress={() => 
        navigation.navigate('Calculator')}>
          <MaterialCommunityIcons name="calculator-variant" size={26} 
          color="#00e676" />
        </Pressable> <Pressable style={styles.tabButton} onPress={() 
        => navigation.navigate('Converter')}>
          <MaterialCommunityIcons name="currency-usd" size={26} 
          color="#aaa" />
        </Pressable> </Animated.View> </SafeAreaView> );
};
export default Calculator; const styles = StyleSheet.create({ 
  safeContainer: { flex: 1, backgroundColor: '#000' }, blurHeader: { 
  position: 'absolute', top: 0, left: 0, right: 0, height: 60, zIndex: 
  5 }, container: { flex: 1, justifyContent: 'flex-end' }, display: { 
  minHeight: 180, paddingHorizontal: 10, marginBottom: 20 }, 
  fixedIconRow: {
    flexDirection: 'row', justifyContent: 'space-between', 
    paddingHorizontal: 10, paddingTop: Platform.OS === 'android' ? 
    (StatusBar.currentHeight || 16) : 16, position: 'absolute', top: 
    0, left: 0, right: 0, zIndex: 10,
  },
  inputWrapper: { flexDirection: 'row', justifyContent: 'flex-end', 
  alignItems: 'center', minHeight: 60 }, inputText: { color: '#fff', 
  fontFamily: 'monospace', width: '100%', textAlignVertical: 'center' 
  },
  resultText: { color: '#ff9500', fontSize: 24, textAlign: 'right', 
  marginTop: 6 }, grid: {}, row: { flexDirection: 'row', 
  justifyContent: 'space-between' }, button: {
    flex: 1, aspectRatio: 1, margin: 6, borderRadius: 9999, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: 
    '#1c1c1c', shadowColor: '#000', shadowOffset: { width: 4, height: 
    4 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 8, 
    borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#2e2e2e', 
    borderBottomWidth: 2, borderRightWidth: 2, borderBottomColor: 
    '#000', borderRightColor: '#000',
  },
  normalButton: { backgroundColor: '#1c1c1c' }, clearButton: { 
  backgroundColor: '#d32f2f' }, backspaceButton: { backgroundColor: 
  '#555' }, equalsButton: { backgroundColor: '#ff9500', elevation: 10 
  },
  buttonText: { color: '#fff', fontSize: 24 }, equalsText: { color: 
  '#fff', fontSize: 24, fontWeight: 'bold' },
 buttonPressed: { shadowOffset: { width: -2, height: -2 }, 
    shadowOpacity: 0.5, shadowRadius: 4, elevation: 2
  },
  equalsPressed: { backgroundColor: '#e68900' }, fakeTabBar: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 
    TAB_HEIGHT, backgroundColor: '#121212', flexDirection: 'row', 
    justifyContent: 'space-around', alignItems: 'center', 
    borderTopWidth: 0, zIndex: 10,
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center' 
  },
});
