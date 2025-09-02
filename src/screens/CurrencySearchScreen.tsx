import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Location from 'expo-location';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useCurrencyMap } from '../hooks/useCurrencyMap';
import { useCurrencyTargets } from '../context/CurrencyContext';

const STORAGE_RECENT = 'recentCurrencySearches';
const STORAGE_FAVORITES = 'favoriteCurrencies';

const CurrencySearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { index } = route.params;
  const currencyMap = useCurrencyMap();
  const { targets, setTargets } = useCurrencyTargets();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [regionCodes, setRegionCodes] = useState<string[]>(['NGN', 'XAF', 'XOF', 'GHS', 'ZAR', 'USD']);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_RECENT).then((data) => {
      if (data) setRecentSearches(JSON.parse(data));
    });
    AsyncStorage.getItem(STORAGE_FAVORITES).then((data) => {
      if (data) setFavorites(JSON.parse(data));
    });

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const geo = await Location.reverseGeocodeAsync(location.coords);
        const country = geo[0]?.isoCountryCode;
        if (country === 'NG') setRegionCodes(['NGN', 'XAF', 'XOF', 'GHS', 'ZAR', 'USD']);
        else if (country === 'US') setRegionCodes(['USD', 'CAD', 'MXN']);
        else if (country === 'GB') setRegionCodes(['GBP', 'EUR', 'USD']);
      }
    })();
  }, []);

  const saveSearch = async (code: string) => {
    const updated = [code, ...recentSearches.filter((c) => c !== code)].slice(0, 5);
    setRecentSearches(updated);
    await AsyncStorage.setItem(STORAGE_RECENT, JSON.stringify(updated));
  };

  const toggleFavorite = async (code: string) => {
    const updated = favorites.includes(code)
      ? favorites.filter((c) => c !== code)
      : [code, ...favorites];
    setFavorites(updated);
    await AsyncStorage.setItem(STORAGE_FAVORITES, JSON.stringify(updated));
  };

  const fuzzyMatch = (text: string, query: string) => {
    return text.toLowerCase().includes(query.toLowerCase());
  };

  const filtered = useMemo(() => {
    if (!query) {
      const region = regionCodes.filter((code) => currencyMap[code]);
      return [...new Set([...favorites, ...recentSearches, ...region])];
    }

    return Object.keys(currencyMap).filter(
      (code) =>
        fuzzyMatch(code, query) || fuzzyMatch(currencyMap[code].name, query)
    );
  }, [query, currencyMap, recentSearches, favorites, regionCodes]);

  const handleSelect = useCallback(
    async (code: string) => {
      const updated = [...targets];
      updated[index] = code;
      setTargets(updated);
      await saveSearch(code);
      navigation.goBack();
    },
    [targets, setTargets, index, navigation, saveSearch]
  );

  const highlightMatch = (text: string, query: string) => {
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return <Text style={styles.name}>{text}</Text>;

    return (
      <Text style={styles.name}>
        {text.slice(0, i)}
        <Text style={styles.highlight}>{text.slice(i, i + query.length)}</Text>
        {text.slice(i + query.length)}
      </Text>
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      const currency = currencyMap[item];
      if (!currency) return null;

      const content = (
        <View style={styles.itemRow}>
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
            <Text style={styles.flag}>{currency.flag || '❓'}</Text>
            <Text style={styles.code}>{item}</Text>
            {highlightMatch(currency.name, query)}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleFavorite(item)}>
            <MaterialCommunityIcons
              name={favorites.includes(item) ? 'star' : 'star-outline'}
              size={24}
              color={favorites.includes(item) ? '#ffd700' : '#aaa'}
            />
          </TouchableOpacity>
        </View>
      );

      return favorites.includes(item) ? (
        <Swipeable
          renderRightActions={() => (
            <TouchableOpacity
              style={styles.deleteBox}
              onPress={() => toggleFavorite(item)}
            >
              <Text style={styles.deleteText}>Remove</Text>
            </TouchableOpacity>
          )}
        >
          {content}
        </Swipeable>
      ) : (
        content
      );
    },
    [currencyMap, handleSelect, query, favorites]
  );

  const listRef = useRef<FlashList<string>>(null);

  const handleVoiceSearch = () => {
    Speech.speak('Say the currency you want to search', {
      language: 'en',
      onDone: () => setQuery('Naira'),
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.searchRow}>
          <TextInput
            style={styles.search}
            placeholder="Search currency"
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleVoiceSearch}>
            <MaterialCommunityIcons name="microphone" size={24} color="#00e676" />
          </TouchableOpacity>
        </View>

        {query.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setQuery('')}>
            <MaterialCommunityIcons name="close-circle" size={24} color="#aaa" />
          </TouchableOpacity>
        )}

        {filtered.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noText}>No results found.</Text>
          </View>
        ) : (
          <FlashList
            ref={listRef}
            data={filtered}
            renderItem={renderItem}
            estimatedItemSize={60}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  search: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    color: '#fff',
    fontSize: 18,
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  clearButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  code: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    color: '#aaa',
  },
  highlight: {
    color: '#00e676',
    fontWeight: '700',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  noText: {
    fontSize: 18,
    color: '#aaa',
  },
  deleteBox: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
  },
});
export default CurrencySearchScreen;
