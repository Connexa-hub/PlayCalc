import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadCurrencyMap } from '../utils/loadCurrencyMap';

const SYNC_INTERVAL = 24 * 60 * 60 * 1000;
const LAST_SYNC_KEY = 'currencyMapLastSync';

export const useCurrencyMap = () => {
  const [currencyMap, setCurrencyMap] = useState<{ [key: string]: { name: string; flag: string } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accept a force param to always fetch from API/cold source
  const sync = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const now = Date.now();

      if (force || !lastSync || now - parseInt(lastSync, 10) > SYNC_INTERVAL) {
        const map = await loadCurrencyMap(true); // force mode for cache bust
        setCurrencyMap(map);
        await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());
        await AsyncStorage.setItem('currencyMapCache', JSON.stringify(map));
      } else {
        const cached = await AsyncStorage.getItem('currencyMapCache');
        if (cached) setCurrencyMap(JSON.parse(cached));
      }
      setError(null);
    } catch (err) {
      setError('No Internet Connection');
      const cached = await AsyncStorage.getItem('currencyMapCache');
      if (cached) setCurrencyMap(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  // refetch: sync(force: boolean)
  return { currencyMap, loading, error, refetch: sync };
};
