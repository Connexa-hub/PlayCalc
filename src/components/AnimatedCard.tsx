// src/components/AnimatedCard.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

interface AnimatedCardProps {
  visible: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  direction?: 'top' | 'bottom';
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ visible, children, style, direction = 'bottom' }) => {
  const startValue = direction === 'bottom' ? 100 : -100;
  const slideAnim = useRef(new Animated.Value(startValue)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: startValue,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, direction]);

  const positionStyle = direction === 'bottom' ? { bottom: 0 } : { top: 0 };

  return (
    <Animated.View
      style={[
        styles.card,
        style,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
          position: 'absolute',
          left: 0,
          right: 0,
          ...positionStyle,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
});

export default AnimatedCard;
