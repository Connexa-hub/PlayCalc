import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-root-toast';
import { useCurrencyMap } from '../hooks/useCurrencyMap';
import { useCurrencyTargets } from '../context/CurrencyContext';

const MainConverterScreen: React.FC = () => {
  const navigation = useNavigation();
  const currencyMap = useCurrencyMap();
  const { targets, setTargets } = useCurrencyTargets();

  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<{ [key: string]: number }>({});
  const [lastUpdated, setLastUpdated] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('NGN');
  const [loading, setLoading] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;

  const saveRatesToCache = async (rates: any, date: string) => {
    try {
      await AsyncStorage.setItem('cachedRates', JSON.stringify({ rates, date }));
    } catch (err) {
      console.warn('Failed to cache rates:', err);
    }
  };

  const loadRatesFromCache = async () => {
    try {
      const data = await AsyncStorage.getItem('cachedRates');
      if (data) {
        const { rates, date } = JSON.parse(data);
        setRates(rates);
        setLastUpdated(date);
      }
    } catch (err) {
      console.warn('Failed to load cached rates:', err);
    }
  };

  const fetchRates = async () => {
    if (loading) return;
    setLoading(true);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();

    try {
      const symbols = Object.keys(currencyMap).join(',');
      const res = await fetch(
        `https://api.exchangerate.host/latest?base=${baseCurrency}&symbols=${symbols}`
      );
      const data = await res.json();
      if (data?.rates) {
        setRates(data.rates);
        setLastUpdated(data.date);
        saveRatesToCache(data.rates, data.date);
        Toast.show('Exchange rates updated', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
        });
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err);
      Toast.show('Failed to update rates', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      loadRatesFromCache();
    } finally {
      setLoading(false);
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  };

  useEffect(() => {
    if (Object.keys(currencyMap).length > 0) {
      fetchRates();
    }
  }, [baseCurrency]);

  const convert = (rate: number) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : (num * rate).toFixed(2);
  };

  const handleCardPress = (code: string) => {
    setBaseCurrency(code);
    setAmount('');
    Keyboard.dismiss();
  };

  const handleAmountSubmit = () => {
    Keyboard.dismiss();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!currencyMap || Object.keys(currencyMap).length === 0) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <Text style={{ color: '#fff', padding: 20 }}>Loading currencies...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <Text style={styles.title}>Currency Converter</Text>
      </View>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder={`Enter amount in ${baseCurrency}`}
        placeholderTextColor="#aaa"
        onSubmitEditing={handleAmountSubmit}
        returnKeyType="done"
      />

      <ScrollView contentContainerStyle={styles.cardContainer}>
        {[baseCurrency, ...targets.filter((c) => c !== baseCurrency)].map((code, index) => {
          const currency = currencyMap[code];
          if (!currency) return null;

          return (
            <TouchableOpacity key={index} onPress={() => handleCardPress(code)}>
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.flag}>{currency.flag || '❓'}</Text>
                  <Text style={styles.code}>{code}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CurrencySelection', {
                        index,
                      })
                    }
                  >
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#aaa" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.value}>
                  {amount === '' ? '0.00' : convert(rates[code] || 0)} {code}
                </Text>
                <Text style={styles.ratePreview}>
                  1 {baseCurrency} = {(rates[code] || 0).toFixed(6)} {code}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.footer}>
          © XCurrency Last update: {lastUpdated || '—'}
        </Text>
      </ScrollView>

      <TouchableOpacity
        onPress={fetchRates}
        disabled={loading}
        style={styles.refreshButton}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialCommunityIcons name="refresh" size={28} color="#00e676" />
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#00e676',
    fontSize: 24,
    fontWeight: '600',
    padding: 10,
    borderRadius: 10,
    textAlign: 'center',
    marginBottom: 12,
  },
  cardContainer: {
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flag: {
    fontSize: 20,
  },
  code: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    color: '#00e676',
    fontWeight: '500',
    marginTop: 6,
  },
  ratePreview: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  footer: {
    marginTop: 16,
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    zIndex: 10,
  },
});
export default MainConverterScreen;
