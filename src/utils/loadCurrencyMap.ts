import AsyncStorage from '@react-native-async-storage/async-storage';
import localData from '../data/currencies.json';

const STORAGE_KEY = 'currencyMapCache';

export const loadCurrencyMap = async (): Promise<{ [key: string]: { name: string; flag: string } }> => {
  try {
    const res = await fetch('https://openexchangerates.org/api/currencies.json');
    const onlineData = await res.json();

    const merged: { [key: string]: { name: string; flag: string } } = {};

    for (const code in onlineData) {
      const name = onlineData[code];
      const flag = getFlagEmoji(code) || localData[code]?.flag || '❓';
      merged[code] = { name, flag };
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.warn('Using cached or offline currency data:', err);

    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) return JSON.parse(cached);

    return localData;
  }
};

const getFlagEmoji = (code: string): string | null => {
  const countryCode = code.slice(0, 2).toUpperCase();
  if (countryCode.length !== 2) return null;

  const A = 127462;
  return String.fromCodePoint(...countryCode.split('').map((c) => A + c.charCodeAt(0) - 65));
};
