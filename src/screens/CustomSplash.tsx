import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Text,
  Platform,
  StatusBar,
  Animated,
  AppState,
  PanResponder,
} from 'react-native';
import LottieView from 'lottie-react-native';
import * as NavigationBar from 'expo-navigation-bar';

const { width, height } = Dimensions.get('window');

const CustomSplash = ({ onFinish, delayMs = 600, loop = false }) => {
  const currentYear = new Date().getFullYear();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const lottieFade = useRef(new Animated.Value(0)).current;
  const parallaxY = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.timing(lottieFade, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();

    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, [fadeAnim, slideAnim, lottieFade]);

  // Re-apply immersive and transparent nav when this screen mounts
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'android' && NavigationBar) {
          await NavigationBar.setBackgroundColorAsync('#00000000'); // transparent
          await NavigationBar.setVisibilityAsync('immersive');
        }
      } catch (e) {
        console.warn('NavigationBar change failed', e);
      }
      StatusBar.setHidden(true, 'fade');
      StatusBar.setTranslucent?.(true);
    })();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        (async () => {
          try {
            if (Platform.OS === 'android' && NavigationBar) {
              await NavigationBar.setBackgroundColorAsync('#00000000');
              await NavigationBar.setVisibilityAsync('immersive');
            }
          } catch {}
        })();
      }
    });

    return () => subscription.remove();
  }, []);

  const handleAnimationFinish = useCallback(() => {
    if (onFinish) setTimeout(onFinish, delayMs);
  }, [onFinish, delayMs]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => parallaxY.setValue(gs.dy * 0.2),
      onPanResponderRelease: () => {
        Animated.spring(parallaxY, { toValue: 0, useNativeDriver: true, bounciness: 5 }).start();
      },
    })
  ).current;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} {...panResponder.panHandlers}>
      <ImageBackground
        source={require('../../assets/PlayCalc.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.bottomContainer}>
          <Animated.View
            style={{
              transform: [{ translateY: Animated.add(slideAnim, parallaxY) }],
              opacity: lottieFade,
            }}
          >
            <LottieView
              ref={lottieRef}
              source={require('../../assets/playcalc-wave.json')}
              autoPlay={false} // explicitly controlled
              loop={loop}
              onAnimationFinish={handleAnimationFinish}
              style={styles.lottie}
            />
          </Animated.View>
          <Text style={styles.footer}>Connexa {currentYear}</Text>
        </View>
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  background: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  lottie: {
    width: width * 0.35,
    height: height * 0.1,
    marginBottom: 10,
  },
  footer: {
    fontSize: 14,
    color: '#F5F5DC',
    fontWeight: '600',
  },
});

export default CustomSplash;s
