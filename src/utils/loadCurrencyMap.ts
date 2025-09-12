import AsyncStorage from '@react-native-async-storage/async-storage';
import localData from '../data/currencies.json';
import Constants from 'expo-constants';

const STORAGE_KEY = 'currencyMapCache';

export const loadCurrencyMap = async (force = false): Promise<{ [key: string]: { name: string; flag: string } }> => {
  const API_KEY = (Constants.expoConfig && (Constants.expoConfig as any).extra?.API_KEY) || (Constants?.manifest?.extra?.API_KEY);
  const BASE_CURRENCY = 'USD';

  // ... your full flagMap here ... (unchanged from current)

  try {
    if (!API_KEY) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
      return localData;
    }

    if (!force) {
      // Try cache first if not forcing refresh
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${BASE_CURRENCY}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.result !== 'success' && !data.conversion_rates) {
      throw new Error(data?.error_type || 'API error');
    }

    const merged: { [key: string]: { name: string; flag: string } } = { ...localData };
    const codes = Object.keys(data.conversion_rates || {});

    codes.forEach((code) => {
      const existing = merged[code] || {};
      merged[code] = {
        name: existing.name || code,
        flag: existing.flag || '💱',
      };
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return localData;
  }
};
