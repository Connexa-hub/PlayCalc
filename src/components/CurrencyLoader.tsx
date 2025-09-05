import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// List of currency symbols to animate
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'NGN', 'BTC', 'ETH', 'AUD', 'CAD', 'CNY'];

export default function CurrencyLoader() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // For metrics/currencies spinning around the logo
  const radius = 44;
  return (
    <View style={styles.container}>
      <View style={styles.centerLogo}>
        {/* You can swap 💱 for a PNG, SVG, or custom logo */}
        <Text style={styles.logoText}>💱</Text>
        <Text style={styles.logoLabel}>Currency Rates</Text>
      </View>
      <Animated.View
        style={[
          styles.spinRing,
          {
            transform: [
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        {currencies.map((cur, idx) => {
          const angle = (2 * Math.PI * idx) / currencies.length;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          return (
            <View
              key={cur}
              style={[
                styles.currencyItem,
                {
                  left: 55 + x,
                  top: 55 + y,
                },
              ]}
            >
              <Text style={styles.currencyText}>{cur}</Text>
            </View>
          );
        })}
        {/* Outer ring */}
        <MaterialCommunityIcons name="circle-outline" size={130} color="#F3BA2F" style={styles.ring} />
      </Animated.View>
      <Text style={styles.loadingText}>Loading currencies...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLogo: {
    position: 'absolute',
    left: 65,
    top: 65,
    zIndex: 2,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 44,
  },
  logoLabel: {
    color: '#F3BA2F',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    marginTop: -10,
  },
  spinRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    left: 25,
    top: 25,
    zIndex: 1,
    opacity: 0.5,
  },
  currencyItem: {
    position: 'absolute',
    zIndex: 3,
    width: 36,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
  },
  currencyText: {
    fontSize: 13,
    color: '#F3BA2F',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 160,
    color: '#F3BA2F',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
