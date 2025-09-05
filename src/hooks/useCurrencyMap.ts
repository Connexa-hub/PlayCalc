import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'f9bd7653dd13a8e88a4fa2f8';
const CODE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/codes`;
const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const LAST_SYNC_KEY = 'currencyMapLastSync';

export const useCurrencyMap = () => {
  const [currencyMap, setCurrencyMap] = useState({});

  useEffect(() => {
    const sync = async () => {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const now = Date.now();

      if (!lastSync || now - parseInt(lastSync) > SYNC_INTERVAL) {
        try {
          const res = await fetch(CODE_URL);
          const data = await res.json();
          if (data?.result === 'success' && data.supported_codes) {
            const codes = data.supported_codes;
            // codes is an array of [code, name]
            const map: Record<string, { name: string }> = {};
            codes.forEach(([code, name]) => {
              map[code] = { name };
            });
            setCurrencyMap(map);
            await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());
            await AsyncStorage.setItem('currencyMapCache', JSON.stringify(map));
          }
        } catch {
          // fallback to cache
          const cached = await AsyncStorage.getItem('currencyMapCache');
          if (cached) setCurrencyMap(JSON.parse(cached));
        }
      } else {
        const cached = await AsyncStorage.getItem('currencyMapCache');
        if (cached) setCurrencyMap(JSON.parse(cached));
      }
    };
    sync();
  }, []);

  return currencyMap;
};
