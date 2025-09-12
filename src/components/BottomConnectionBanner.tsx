import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function BottomConnectionBanner({ visible }: { visible: boolean }) {
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : 100,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          width: width - 32,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="wifi-off" size={28} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bannerTitle}>No Internet Connection</Text>
        <Text style={styles.bannerSubtitle}>Please check your network</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 16,
    bottom: 32,
    backgroundColor: '#e53935',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    zIndex: 100,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#b71c1c',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bannerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.88,
  },
});
