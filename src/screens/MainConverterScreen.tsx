// src/screens/MainConverterScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Switch,
  Modal,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCurrencyMap } from '../hooks/useCurrencyMap';
import { useCurrencyTargets } from '../context/CurrencyContext';
import CurrencyLoader from '../components/CurrencyLoader';
import CurrencySearchModal from '../components/CurrencySearchModal';
import NewsFeed from '../components/NewsFeed';

const API_KEY = 'f9bd7653dd13a8e88a4fa2f8';
const HISTORY_KEY = 'currency_history';
const FAV_KEY = 'currency_favorites';

const DEFAULT_BASE = 'NGN';

const THEME_LIGHT = {
  background: '#fafafa',
  text: '#191919',
  accent: '#00e676',
  card: '#fff',
  input: '#eaeaea',
};
const THEME_DARK = {
  background: '#121212',
  text: '#fff',
  accent: '#00e676',
  card: '#1e1e1e',
  input: '#232323',
};

export default function MainConverterScreen() {
  // UI States
  const [themeDark, setThemeDark] = useState(true);
  const theme = themeDark ? THEME_DARK : THEME_LIGHT;
  const navigation = useNavigation();

  // Converter States
  const currencyMap = useCurrencyMap();
  const { targets, setTargets } = useCurrencyTargets();
  const [baseCurrency, setBaseCurrency] = useState(DEFAULT_BASE);
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<{ [key: string]: number }>({});
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feature States
  const [showSearch, setShowSearch] = useState(false);
  const [searchType, setSearchType] = useState<'base' | 'target'>('base');
  const [precision, setPrecision] = useState(2);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState<number | null>(null);

  // Card Currencies
  const [cardCurrencies, setCardCurrencies] = useState<string[]>([baseCurrency, ...targets.filter((c) => c !== baseCurrency)]);

  useEffect(() => {
    setCardCurrencies([baseCurrency, ...targets.filter((c) => c !== baseCurrency)]);
  }, [baseCurrency, targets]);

  // Load favorites/history
  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then(d => { if (d) setHistory(JSON.parse(d)); });
    AsyncStorage.getItem(FAV_KEY).then(d => { if (d) setFavorites(JSON.parse(d)); });
  }, []);

  // Save history/favorites
  const addToHistory = (entry) => {
    const newHist = [entry, ...history].slice(0, 50);
    setHistory(newHist);
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHist));
  };
  const addToFavorites = (code) => {
    if (!favorites.includes(code)) {
      const newFav = [...favorites, code];
      setFavorites(newFav);
      AsyncStorage.setItem(FAV_KEY, JSON.stringify(newFav));
    }
  };
  const removeFavorite = (code) => {
    const newFav = favorites.filter(c => c !== code);
    setFavorites(newFav);
    AsyncStorage.setItem(FAV_KEY, JSON.stringify(newFav));
  };

  // --- Exchange Rates ---
  useEffect(() => {
    if (!baseCurrency) return;
    setLoading(true);
    setError(null);
    fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`)
      .then(res => res.json())
      .then(data => {
        if (data.result === 'success') {
          setRates(data.conversion_rates);
          setLastUpdated(data.time_last_update_utc || '');
        } else {
          setError(data?.error_type || 'Exchange rates could not be loaded.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error.');
        setLoading(false);
      });
  }, [baseCurrency]);

  // Conversion
  const convert = (rate: number) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : (num * rate).toFixed(precision);
  };

  // Calculator logic
  const evalCalc = () => {
    try {
      // Safe eval for simple math
      // eslint-disable-next-line no-eval
      const res = eval(calcExpr.replace(/[^-()\d/*+.]/g, ''));
      setCalcResult(res);
    } catch {
      setCalcResult(null);
    }
  };

  // Handle card press
  const handleCardPress = (code: string) => {
    setBaseCurrency(code);
    setAmount('');
  };

  // Handle currency swap
  const handleSwap = () => {
    if (cardCurrencies.length >= 2) {
      setBaseCurrency(cardCurrencies[1]);
      setCardCurrencies(prev => [cardCurrencies[1], ...prev.slice(1)]);
      setAmount('');
    }
  };

  // Show error screen
  if (error) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={themeDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <Text style={{ color: 'red', padding: 20 }}>{error}</Text>
      </SafeAreaView>
    );
  }

  // Loader screen
  if (!currencyMap || Object.keys(currencyMap).length === 0) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={themeDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <View style={styles.loaderContainer}>
          <CurrencyLoader />
        </View>
      </SafeAreaView>
    );
  }

  // Only show currencies supported by rates
  const displayCardCurrencies = cardCurrencies.filter(code => rates[code] || code === baseCurrency);

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Currency Converter</Text>
        <Switch value={themeDark} onValueChange={setThemeDark} />
      </View>

      {/* Amount input */}
      <TextInput
        style={[styles.input, { backgroundColor: theme.input, color: theme.accent }]}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder={`Enter amount in ${baseCurrency}`}
        placeholderTextColor={theme.text}
        returnKeyType="done"
      />

      {/* Main ScrollView */}
      <ScrollView contentContainerStyle={styles.cardContainer}>
        {displayCardCurrencies.map((code, index) => {
          const currency = currencyMap[code];
          if (!currency) return null;
          const rate = code === baseCurrency ? 1 : rates[code];
          return (
            <TouchableOpacity key={index} onPress={() => handleCardPress(code)}>
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardTop}>
                  <Text style={styles.flag}>{currency.flag || '💱'}</Text>
                  <Text style={[styles.code, { color: theme.text }]}>{code}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('CurrencySelection', {
                        index,
                        currentCurrency: code,
                      })
                    }
                  >
                    <MaterialCommunityIcons name="chevron-down" size={20} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => { favorites.includes(code) ? removeFavorite(code) : addToFavorites(code); }}>
                    <Text style={{ fontSize: 18 }}>{favorites.includes(code) ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.value, { color: theme.accent }]}>
                  {rate ? convert(rate) : "--"} {code}
                </Text>
                <Text style={styles.ratePreview}>
                  1 {baseCurrency} = {rate ? rate.toFixed(6) : "--"} {code}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          <Text style={{ color: theme.text, marginRight: 10 }}>Precision</Text>
          <TouchableOpacity onPress={() => setPrecision(2)} style={{ backgroundColor: precision===2?theme.accent:theme.card, borderRadius: 6, padding: 6, marginRight: 4 }}>
            <Text style={{ color: theme.text }}>2</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPrecision(4)} style={{ backgroundColor: precision===4?theme.accent:theme.card, borderRadius: 6, padding: 6 }}>
            <Text style={{ color: theme.text }}>4</Text>
          </TouchableOpacity>
        </View>

        {/* Swap and Search */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
          <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
            <MaterialCommunityIcons name="swap-horizontal" size={28} color={theme.accent} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton} onPress={() => { setSearchType('base'); setShowSearch(true); }}>
            <MaterialCommunityIcons name="magnify" size={28} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* Favorites */}
        {favorites.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: 'bold', color: theme.text, marginBottom: 2 }}>Favorites</Text>
            <ScrollView horizontal>
              {favorites.map(code =>
                <TouchableOpacity key={code} style={{ backgroundColor: theme.card, borderRadius: 12, padding: 10, marginRight: 7, marginBottom: 5 }}
                  onPress={() => setBaseCurrency(code)}>
                  <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 18 }}>{currencyMap[code]?.flag || '💱'} {code}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* History */}
        {history.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: 'bold', color: theme.text, marginBottom: 2 }}>History</Text>
            <ScrollView style={{ maxHeight: 80 }}>
              {history.map((h, idx) => (
                <Text key={idx} style={{ color: theme.text, fontSize: 14, marginBottom: 4 }}>
                  {h.amount} {h.baseCurrency} → {h.target}: {h.result} ({h.date?.slice(0,16)})
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Save Conversion */}
        <TouchableOpacity
          style={{ backgroundColor: theme.accent, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 }}
          onPress={() => {
            const entry = {
              baseCurrency,
              target: cardCurrencies[1] || cardCurrencies[0],
              amount,
              result: convert(rates[cardCurrencies[1]] || 1),
              date: new Date().toISOString(),
            };
            addToHistory(entry);
            Alert.alert('Saved to history!');
          }}
        >
          <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: 18 }}>Save Conversion</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>
          © XCurrency Last update: {lastUpdated || '—'}
        </Text>

        {/* Calculator */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, color: theme.accent, marginBottom: 8 }}>Arithmetic Calculator</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={{ fontSize: 18, backgroundColor: theme.input, color: theme.text, flex: 1, borderRadius: 8, padding: 8 }}
              value={calcExpr}
              onChangeText={setCalcExpr}
              placeholder="e.g. 23*7 + 5"
              keyboardType="default"
              placeholderTextColor={themeDark ? "#aaa" : "#888"}
            />
            <TouchableOpacity style={{ backgroundColor: theme.accent, borderRadius: 8, padding: 10, marginLeft: 8 }}
              onPress={evalCalc}>
              <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: 18 }}>=</Text>
            </TouchableOpacity>
          </View>
          {calcResult !== null &&
            <Text style={{ marginTop: 8, fontSize: 18, color: theme.text }}>
              Result: {calcResult}
            </Text>
          }
        </View>

        {/* News Feed */}
        <NewsFeed currency={baseCurrency} />

      </ScrollView>

      {/* Currency Search Modal */}
      <CurrencySearchModal
        visible={showSearch}
        onSelect={code => { setBaseCurrency(code); setShowSearch(false); }}
        onClose={() => setShowSearch(false)}
        currencies={currencyMap}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
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
    paddingTop: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    fontSize: 22,
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
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
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
  swapButton: {
    backgroundColor: '#232323',
    borderRadius: 24,
    padding: 8,
    marginHorizontal: 6,
  },
  searchButton: {
    backgroundColor: '#232323',
    borderRadius: 24,
    padding: 8,
    marginHorizontal: 6,
  },
});
