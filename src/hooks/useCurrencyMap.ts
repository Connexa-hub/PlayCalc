import { useEffect, useState } from 'react';
import { loadCurrencyMap } from '../utils/loadCurrencyMap';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const LAST_SYNC_KEY = 'currencyMapLastSync';

export const useCurrencyMap = () => {
  const [currencyMap, setCurrencyMap] = useState({});

  useEffect(() => {
    const sync = async () => {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const now = Date.now();

      if (!lastSync || now - parseInt(lastSync) > SYNC_INTERVAL) {
        const data = await loadCurrencyMap();
        setCurrencyMap(data);
        await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());
      } else {
        const cached = await AsyncStorage.getItem('currencyMapCache');
        if (cached) setCurrencyMap(JSON.parse(cached));
      }
    };

    sync();
  }, []);

  return currencyMap;
};
