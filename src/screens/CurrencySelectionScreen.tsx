import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  GestureHandlerRootView,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { useCurrencyMap } from '../hooks/useCurrencyMap';
import { useCurrencyTargets } from '../context/CurrencyContext';

type CurrencyItem = {
  type: 'header' | 'item';
  title?: string;
  code?: string;
  name?: string;
  flag?: string;
};

const CurrencySelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { targets, setTargets } = useCurrencyTargets();
  const { index } = route.params;
  const currencyMap = useCurrencyMap();
  const [recent, setRecent] = useState<string[]>([]);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [overlayLetter, setOverlayLetter] = useState<string | null>(null);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlashList<CurrencyItem>>(null);

  const grouped = useMemo(() => {
    const acc: { [key: string]: CurrencyItem[] } = {};
    Object.keys(currencyMap).forEach((code) => {
      const letter = code[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push({
        type: 'item',
        code,
        name: currencyMap[code].name,
        flag: currencyMap[code].flag,
      });
    });
    return acc;
  }, [currencyMap]);

  const flatData: CurrencyItem[] = useMemo(() => {
    const data: CurrencyItem[] = [];

    if (recent.length > 0) {
      data.push({ type: 'header', title: 'Recently Used' });
      recent.forEach((code) => {
        if (currencyMap[code]) {
          data.push({
            type: 'item',
            code,
            name: currencyMap[code].name,
            flag: currencyMap[code].flag,
          });
        }
      });
    }

    Object.keys(grouped)
      .sort()
      .forEach((letter) => {
        data.push({ type: 'header', title: letter });
        data.push(...grouped[letter]);
      });

    return data;
  }, [grouped, recent, currencyMap]);

  const handleSelect = useCallback((code: string) => {
    if (!currencyMap[code]) {
      Alert.alert('Error', 'This currency is not supported.');
      return;
    }

    setTargets((prev: string[]) => {
      const updated = [...prev];
      updated[index] = code;
      return updated;
    });

    setRecent((prev) => {
      const updated = [code, ...prev.filter((c) => c !== code)];
      return updated.slice(0, 5);
    });

    navigation.goBack();
  }, [currencyMap, index, navigation, setTargets]);

  const renderItem = useCallback(({ item }: { item: CurrencyItem }) => {
    if (item.type === 'header') {
      return <Text style={styles.section}>{item.title}</Text>;
    }

    return (
      <TouchableOpacity style={styles.item} onPress={() => handleSelect(item.code!)}>
        <Text style={styles.flag}>{item.flag || '❓'}</Text>
        <Text style={styles.code}>{item.code}</Text>
        <Text style={styles.name}>{item.name || 'Unknown Currency'}</Text>
      </TouchableOpacity>
    );
  }, [handleSelect]);

  const scrollToLetter = useCallback((letter: string) => {
    const index = flatData.findIndex(
      (item) => item.type === 'header' && item.title === letter
    );
    if (index !== -1) {
      setActiveLetter(letter);
      listRef.current?.scrollToIndex({ index, animated: true });
    }
  }, [flatData]);

  const handleLongPress = (letter: string) => {
    setOverlayLetter(letter);
    Animated.timing(overlayAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    scrollToLetter(letter);
  };

  const handleRelease = () => {
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setOverlayLetter(null));
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    const firstHeader = viewableItems.find((v) => v.item.type === 'header');
    if (firstHeader?.item?.title && firstHeader.item.title !== activeLetter) {
      setActiveLetter(firstHeader.item.title);
    }
  }, [activeLetter]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Change Currency</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CurrencySearch', { index })}>
            <MaterialCommunityIcons name="magnify" size={24} color="#00e676" />
          </TouchableOpacity>
        </View>

        <FlashList
          ref={listRef}
          data={flatData}
          renderItem={renderItem}
          estimatedItemSize={60}
          keyExtractor={(item, i) => item.code ?? `header-${item.title}-${i}`}
          onScrollBeginDrag={() => setActiveLetter(null)}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        />

        <View style={styles.index}>
          {Object.keys(grouped)
            .sort()
            .map((letter) => (
              <LongPressGestureHandler
                key={letter}
                onHandlerStateChange={({ nativeEvent }) => {
                  if (nativeEvent.state === State.ACTIVE) handleLongPress(letter);
                  if (nativeEvent.state === State.END) handleRelease();
                }}
              >
                <TouchableOpacity onPress={() => scrollToLetter(letter)}>
                  <Text
                    style={[
                      styles.indexLetter,
                      activeLetter === letter && styles.activeLetter,
                    ]}
                  >
                    {letter}
                  </Text>
                </TouchableOpacity>
              </LongPressGestureHandler>
            ))}
        </View>

        {overlayLetter && (
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
            <Text style={styles.overlayText}>{overlayLetter}</Text>
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    paddingTop:20,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop:30,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1e1e1e',
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
  section: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 16,
    color: '#00e676',
    backgroundColor: '#1e1e1e',
  },
  index: {
    position: 'absolute',
    right: 4,
    top: 80,
    alignItems: 'center',
    paddingRight: 4,
    zIndex: 10,
  },
  indexLetter: {
    fontSize: 12,
    color: '#aaa',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  activeLetter: {
    backgroundColor: '#00e676',
    color: '#121212',
    fontWeight: '700',
  },
  overlay: {
    position: 'absolute',
    right: 40,
    top: '40%',
    backgroundColor: '#333',
    borderRadius: 40,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  overlayText: {
    fontSize: 32,
    color: '#00e676',
    fontWeight: '700',
  },
});
export default CurrencySelectionScreen;
