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
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-root-toast';
import { useCurrencyMap } from '../hooks/useCurrencyMap';
import { useCurrencyTargets } from '../context/CurrencyContext';
import CurrencyLoader from '../components/CurrencyLoader';

const API_KEY = 'f9bd7653dd13a8e88a4fa2f8';

const MainConverterScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currencyMap = useCurrencyMap();
  const { targets, setTargets } = useCurrencyTargets();

  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<{ [key: string]: number }>({});
  const [lastUpdated, setLastUpdated] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('NGN');
  const [loading, setLoading] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [supportedSymbols, setSupportedSymbols] = useState<string[]>([]);
  const [showError, setShowError] = useState<string | null>(null);

  useEffect(() => {
    if (currencyMap && Object.keys(currencyMap).length > 0) {
      setSupportedSymbols(Object.keys(currencyMap));
    }
  }, [currencyMap]);

  // Track selected currency for each card.
  const [cardCurrencies, setCardCurrencies] = useState<string[]>([baseCurrency, ...targets.filter((c) => c !== baseCurrency)]);

  useEffect(() => {
    setCardCurrencies([baseCurrency, ...targets.filter((c) => c !== baseCurrency)]);
  }, [baseCurrency, targets]);

  useEffect(() => {
    if (route.params && route.params.selectedCurrency !== undefined && route.params.index !== undefined) {
      const { selectedCurrency, index } = route.params as any;
      if (selectedCurrency && typeof index === 'number') {
        if (index === 0) {
          setBaseCurrency(selectedCurrency);
        } else {
          setCardCurrencies((prev) => {
            const updated = [...prev];
            updated[index] = selectedCurrency;
            return updated;
          });
        }
        navigation.setParams({ selectedCurrency: undefined, index: undefined });
      }
    }
  }, [route.params, navigation]);

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
    if (loading || supportedSymbols.length === 0) return;
    setLoading(true);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();

    try {
      const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.result === 'success' && data.conversion_rates) {
        setRates(data.conversion_rates);
        setLastUpdated(data.time_last_update_utc || "");
        saveRatesToCache(data.conversion_rates, data.time_last_update_utc || "");
        setShowError(null);
        Toast.show('Exchange rates updated', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
        });
      } else {
        setShowError(data?.error_type || "Exchange rates could not be loaded.");
        loadRatesFromCache();
      }
    } catch (err) {
      setShowError("Failed to fetch exchange rates.");
      loadRatesFromCache();
    } finally {
      setLoading(false);
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  };

  useEffect(() => {
    if (supportedSymbols.length > 0) {
      fetchRates();
    }
  }, [baseCurrency, supportedSymbols]);

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

  if (showError) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <Text style={{ color: 'red', padding: 20 }}>{showError}</Text>
      </SafeAreaView>
    );
  }

  if (!currencyMap || Object.keys(currencyMap).length === 0 || supportedSymbols.length === 0) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.loaderContainer}>
          <CurrencyLoader />
        </View>
      </SafeAreaView>
    );
  }

  const displayCardCurrencies = cardCurrencies.filter(code => supportedSymbols.includes(code));

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
        {displayCardCurrencies.map((code, index) => {
          const currency = currencyMap[code];
          if (!currency) return null;
          const rate = code === baseCurrency ? 1 : rates[code];
          return (
            <TouchableOpacity key={index} onPress={() => handleCardPress(code)}>
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.flag}>{currency.flag || '💱'}</Text>
                  <Text style={styles.code}>{code}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CurrencySelection', {
                        index,
                        currentCurrency: code,
                      })
                    }
                  >
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#aaa" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.value}>
                  {rate ? convert(rate) : "--"} {code}
                </Text>
                <Text style={styles.ratePreview}>
                  1 {baseCurrency} = {rate ? rate.toFixed(6) : "--"} {code}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
