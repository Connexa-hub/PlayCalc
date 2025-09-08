import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  ImageBackground,
} from 'react-native';
import LottieView from 'lottie-react-native';

const { height, width } = Dimensions.get('window');

const CustomSplash = ({ onFinish }: { onFinish: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Wait for parent to signal readiness
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onFinish(); // transition to app
      });
    }, 0); // no delay here — parent controls timing

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ImageBackground
        source={require('../../assets/PlayCalc.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.waveContainer}>
          <LottieView
            source={require('../../assets/playcalc-wave.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  background: {
    flex: 1,
    width,
    height,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  waveContainer: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  lottie: {
    width: 180,
    height: 80,
  },
});

export default CustomSplash;
