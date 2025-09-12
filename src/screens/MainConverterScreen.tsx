import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useCurrencyMap } from '../hooks/useCurrencyMap';
import { useCurrencyTargets } from '../context/CurrencyContext';
import CurrencyLoader from '../components/CurrencyLoader';
import CurrencySearchModal from '../components/CurrencySearchModal';
import NewsFeed from '../components/NewsFeed';
import AnimatedCard from '../components/AnimatedCard';
import CurrencyFlag from '../components/CurrencyFlag';

const API_KEY = Constants.expoConfig?.extra?.API_KEY;
const HISTORY_KEY = 'currency_history';
const FAV_KEY = 'currency_favorites';
const DEFAULT_BASE = 'NGN';

const cream = '#fffacd';

const THEME_LIGHT = {
  background: '#fafafa',
  text: '#191919',
  accent: '#00e676',
  card: cream,
  input: '#eaeaea',
};

const THEME_DARK = {
  background: '#121212',
  text: cream,
  accent: '#00e676',
  card: '#1e1e1e',
  input: '#232323',
};

export default function MainConverterScreen() {
  const [themeDark, setThemeDark] = useState(true);
  const theme = themeDark ? THEME_DARK : THEME_LIGHT;
  const navigation = useNavigation();

  const { currencyMap, loading: currencyLoading, error: currencyError, refetch: refreshCurrencyMap } = useCurrencyMap();
  const { targets } = useCurrencyTargets();

  const [baseCurrency, setBaseCurrency] = useState(DEFAULT_BASE);
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState<{ [key: string]: number }>({});
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [precision, setPrecision] = useState(2);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState<number | null>(null);

  const [cardCurrencies, setCardCurrencies] = useState<string[]>([DEFAULT_BASE, ...targets.filter((c) => c !== DEFAULT_BASE)]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [wasDisconnected, setWasDisconnected] = useState<boolean>(false);

  const contentFade = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const [ready, setReady] = useState(false); // New: loader control

  // --- NetInfo global listener for connection state ---
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected;
      if (!connected && isConnected) setWasDisconnected(true);
      if (connected && wasDisconnected) {
        setNotification('Internet connection restored! 🎉');
        setTimeout(() => setNotification(null), 3000);
        setWasDisconnected(false);
      }
      setIsConnected(connected);
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [isConnected, wasDisconnected]);

  useEffect(() => {
    setCardCurrencies([baseCurrency, ...targets.filter((c) => c !== baseCurrency)]);
  }, [baseCurrency, targets]);

  // Loader: show immediately, do NOT block on async work
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Show loader while we fetch history, favorites, etc.
      setReady(false);

      // Fetch favorites and history from AsyncStorage in parallel
      const [favData, histData] = await Promise.all([
        AsyncStorage.getItem(FAV_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
      ]);
      if (favData && !cancelled) setFavorites(JSON.parse(favData));
      if (histData && !cancelled) setHistory(JSON.parse(histData));
      // Optionally: a short delay for even smoother UI
      // await new Promise(res => setTimeout(res, 100));
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    contentFade.setValue(0);
    Animated.timing(contentFade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [baseCurrency, contentFade]);

  // ----------- Core: Load rates (API or cache) -------------
  const loadRates = async (force = false) => {
    setLoading(true);
    setApiError(null);
    const storageKey = `rates_${baseCurrency}`;
    let usedCache = false;
    if (!force) {
      const cachedStr = await AsyncStorage.getItem(storageKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        setRates(cached.rates);
        setLastUpdated((cached.lastUpdated || '') + ' (cached)');
        usedCache = true;
      }
    }
    try {
      if (isConnected) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        if (data && data.result === 'success') {
          setRates(data.conversion_rates || {});
          setLastUpdated(data.time_last_update_utc || '');
          await AsyncStorage.setItem(storageKey, JSON.stringify({ rates: data.conversion_rates, lastUpdated: data.time_last_update_utc }));
          setApiError(null);
          return;
        }
        throw new Error('API error');
      } else if (!usedCache) {
        throw new Error('No internet and no cached data available.');
      }
    } catch (err: any) {
      setApiError(
        !isConnected
          ? 'No Internet Connection'
          : (err.message && err.message.includes('abort')) ? 'Unable to fetch rates (timeout)' : 'Unable to fetch rates'
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load rates
  useEffect(() => {
    if (!baseCurrency) return;
    loadRates();
    // eslint-disable-next-line
  }, [baseCurrency]);

  const convert = (rate: number) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : (num * rate).toFixed(precision);
  };

  const evalCalc = () => {
    try {
      // eslint-disable-next-line no-eval
      const res = eval(calcExpr.replace(/[^-()\d/*+.]/g, ''));
      setCalcResult(res);
    } catch {
      setCalcResult(null);
    }
  };

  const handleCardPress = (code: string) => {
    setBaseCurrency(code);
    setAmount('');
  };

  const handleSwap = () => {
    if (cardCurrencies.length >= 2) {
      setBaseCurrency(cardCurrencies[1]);
      setCardCurrencies((prev) => [cardCurrencies[1], ...prev.slice(1)]);
      setAmount('');
    }
  };

  const addToHistory = (entry: any) => {
    const newHist = [entry, ...history].slice(0, 50);
    setHistory(newHist);
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHist));
  };

  const addToFavorites = (code: string) => {
    if (!favorites.includes(code)) {
      const newFav = [...favorites, code];
      setFavorites(newFav);
      AsyncStorage.setItem(FAV_KEY, JSON.stringify(newFav));
    }
  };

  const removeFavorite = (code: string) => {
    const newFav = favorites.filter((c) => c !== code);
    setFavorites(newFav);
    AsyncStorage.setItem(FAV_KEY, JSON.stringify(newFav));
  };

  // ----------- Pull to refresh: API fetch for both currencyMap and rates -----------
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshCurrencyMap(true); // force API
    await loadRates(true); // force API
    setRefreshing(false);
  };

  // --- Loader: show IMMEDIATELY until all initial async work is done ---
  if (!ready || (currencyLoading && !refreshing) || (!currencyMap || Object.keys(currencyMap).length === 0)) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={themeDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <View style={styles.loaderContainer}>
          <CurrencyLoader />
        </View>
        {/* Modern: Notification at top, error banner at bottom */}
        {notification && (
          <AnimatedCard visible={!!notification} direction="top" style={{ backgroundColor: theme.accent, marginTop: StatusBar.currentHeight || 0 }}>
            <Text style={{ color: theme.background, textAlign: 'center' }}>{notification}</Text>
          </AnimatedCard>
        )}
        {(!isConnected && (
          <AnimatedCard visible direction="bottom" style={{ backgroundColor: "#d32f2f", marginBottom: 10 }}>
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
              No Internet Connection
            </Text>
          </AnimatedCard>
        ))}
      </SafeAreaView>
    );
  }

  // ---------- "No network" card: show only if offline and no rates ----------
  if ((apiError && Object.keys(rates).length === 0) || (!isConnected && Object.keys(rates).length === 0)) {
    return (
      <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={themeDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <AnimatedCard visible direction="bottom">
          <View style={{ alignItems: 'center' }}>
            <MaterialCommunityIcons name="wifi-off" size={100} color="red" />
            <Text style={[styles.errorTitle, { color: theme.text }]}>
              {apiError && apiError.startsWith('Unable') ? 'Unable to fetch rates' : 'No Internet Connection'}
            </Text>
            <Text style={[styles.errorSubtitle, { color: theme.text }]}>
              {apiError ? apiError : 'Please check your network and try again.'}
            </Text>
            <TouchableOpacity onPress={() => loadRates(true)} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </AnimatedCard>
        {/* Modern: Error banner at bottom */}
        {(!isConnected && (
          <AnimatedCard visible direction="bottom" style={{ backgroundColor: "#d32f2f", marginBottom: 10 }}>
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
              No Internet Connection
            </Text>
          </AnimatedCard>
        ))}
      </SafeAreaView>
    );
  }

  const displayCardCurrencies = cardCurrencies.filter((code) => rates[code] || code === baseCurrency);

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Currency Converter</Text>
        <Switch value={themeDark} onValueChange={setThemeDark} />
      </View>

      <TextInput
        style={[styles.input, { backgroundColor: theme.input, color: theme.accent }]}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder={`Enter amount in ${baseCurrency}`}
        placeholderTextColor={theme.text}
        returnKeyType="done"
      />

      <Animated.View style={{ flex: 1, opacity: contentFade }}>
        <ScrollView
          contentContainerStyle={styles.cardContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {displayCardCurrencies.map((code, index) => {
            const currency = currencyMap[code];
            const flag = currency?.flag || '💱';
            if (!currency) return null;
            const rate = code === baseCurrency ? 1 : rates[code];
            const isFav = favorites.includes(code);
            return (
              <TouchableOpacity key={index} onPress={() => handleCardPress(code)} activeOpacity={0.7}>
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                  <View style={styles.cardTop}>
                    <CurrencyFlag flag={flag} />
                    <Text style={[styles.code, { color: theme.text }]}>{code}</Text>
                    <TouchableOpacity
                      style={styles.chevronTouch}
                      activeOpacity={0.6}
                      onPress={() =>
                        navigation.navigate('CurrencySelection', {
                          index,
                          currentCurrency: code,
                        })
                      }
                    >
                      <MaterialCommunityIcons name="chevron-down" size={26} color={theme.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.favTouch}
                      activeOpacity={0.7}
                      onPress={() => {
                        isFav ? removeFavorite(code) : addToFavorites(code);
                      }}
                    >
                      <MaterialCommunityIcons
                        name={isFav ? "star" : "star-outline"}
                        size={24}
                        color={isFav ? "#ffd700" : (theme.text)}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.value, { color: theme.accent }]}>{rate ? convert(rate) : '--'} {code}</Text>
                  <Text style={styles.ratePreview}>1 {baseCurrency} = {rate ? rate.toFixed(6) : '--'} {code}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
            <Text style={{ color: theme.text, marginRight: 10 }}>Precision</Text>
            <TouchableOpacity
              onPress={() => setPrecision(2)}
              style={[
                styles.precisionBtn,
                { backgroundColor: precision === 2 ? theme.accent : theme.card, borderColor: theme.accent },
              ]}
            >
              <Text style={{ color: precision === 2 ? theme.background : theme.text }}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPrecision(4)}
              style={[
                styles.precisionBtn,
                { backgroundColor: precision === 4 ? theme.accent : theme.card, borderColor: theme.accent },
              ]}
            >
              <Text style={{ color: precision === 4 ? theme.background : theme.text }}>4</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 }}>
            <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
              <MaterialCommunityIcons name="swap-horizontal" size={28} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchButton} onPress={() => { setShowSearch(true); }}>
              <MaterialCommunityIcons name="magnify" size={28} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {favorites.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, marginBottom: 2 }}>Favorites</Text>
              <ScrollView horizontal>
                {favorites.map(code => (
                  <TouchableOpacity
                    key={code}
                    style={{ backgroundColor: theme.card, borderRadius: 12, padding: 10, marginRight: 7, marginBottom: 5 }}
                    onPress={() => setBaseCurrency(code)}
                  >
                    <Text style={{ color: theme.accent, fontWeight: 'bold', fontSize: 18 }}>
                      <CurrencyFlag flag={currencyMap[code]?.flag} /> {code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {history.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: 'bold', color: theme.text, marginBottom: 2 }}>History</Text>
              <ScrollView style={{ maxHeight: 80 }}>
                {history.map((h, idx) => (
                  <Text key={idx} style={{ color: theme.text, fontSize: 14, marginBottom: 4 }}>
                    {h.amount} {h.baseCurrency} → {h.target}: {h.result} ({h.date?.slice(0, 16)})
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}

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

          <Text style={styles.footer}> © XCurrency Last update: {lastUpdated || '—'} </Text>

          <View style={{ marginTop: 18 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: theme.accent, marginBottom: 8 }}>Arithmetic Calculator</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ fontSize: 18, backgroundColor: theme.input, color: theme.text, flex: 1, borderRadius: 8, padding: 8 }}
                value={calcExpr}
                onChangeText={setCalcExpr}
                placeholder="e.g. 23 * 7 + 5"
                keyboardType="default"
                placeholderTextColor={themeDark ? "#aaa" : "#888"}
              />
              <TouchableOpacity
                style={{ backgroundColor: theme.accent, borderRadius: 8, padding: 10, marginLeft: 8 }}
                onPress={evalCalc}>
                <Text style={{ color: theme.background, fontWeight: 'bold', fontSize: 18 }}>=</Text>
              </TouchableOpacity>
            </View>
            {calcResult !== null && <Text style={{ marginTop: 8, fontSize: 18, color: theme.text }}>Result: {calcResult}</Text>}
          </View>

          <NewsFeed currency={baseCurrency} />
        </ScrollView>
      </Animated.View>

      <CurrencySearchModal
        visible={showSearch}
        onSelect={code => { setBaseCurrency(code); setShowSearch(false); }}
        onClose={() => setShowSearch(false)}
        currencies={currencyMap}
        refetch={refreshCurrencyMap}
      />

      {notification && (
        <AnimatedCard visible={!!notification} direction="top" style={{ backgroundColor: theme.accent, marginTop: StatusBar.currentHeight || 0 }}>
          <Text style={{ color: theme.background, textAlign: 'center' }}>{notification}</Text>
        </AnimatedCard>
      )}
      {(!isConnected && (
        <AnimatedCard visible direction="bottom" style={{ backgroundColor: "#d32f2f", marginBottom: 10 }}>
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
            No Internet Connection
          </Text>
        </AnimatedCard>
      ))}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  errorSubtitle: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#00e676',
    padding: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
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
  chevronTouch: {
    padding: 10,
    marginLeft: 8,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favTouch: {
    marginLeft: 8,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    backgroundColor: 'transparent'
  },
  precisionBtn: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 4,
    borderWidth: 1.5,
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
