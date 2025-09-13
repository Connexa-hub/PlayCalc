import React, { useState, useEffect, useRef } from 'react';
import {
  StatusBar,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import Calculator from './src/screens/Calculator';
import ProfessionalCalculator from './src/screens/ProfessionalCalculator';
import MainConverterScreen from './src/screens/MainConverterScreen';
import CurrencySelectionScreen from './src/screens/CurrencySelectionScreen';
import CurrencySearchScreen from './src/screens/CurrencySearchScreen';
import CustomSplash from './src/screens/CustomSplash';
import DedicationScreen from './src/screens/DedicationScreen';
import PrivacyTermsScreen from './src/screens/PrivacyTermsScreen';
import TutorialScreen from './src/screens/TutorialScreen';
import { CurrencyProvider } from './src/context/CurrencyContext';

/**
 * NOTE: moved preventAutoHideAsync into bootstrapAsync inside useEffect and await it.
 * This avoids possible unhandled promise behavior at module load time and gives
 * us better control/fallbacks for hiding the native splash.
 */

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212',
    card: '#121212',
    border: '#232323',
    text: '#fafafa',
    primary: '#00e676',
  },
};

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dedication" component={DedicationScreen} />
      <Stack.Screen name="PrivacyTerms" component={PrivacyTermsScreen} />
      <Stack.Screen name="Tutorial" component={TutorialScreen} />
    </Stack.Navigator>
  );
}

function ConverterStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#121212' },
      }}
    >
      <Stack.Screen name="MainConverter" component={MainConverterScreen} />
      <Stack.Screen name="CurrencySelection" component={CurrencySelectionScreen} />
      <Stack.Screen name="CurrencySearch" component={CurrencySearchScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 0,
          height: 50,
        },
        tabBarActiveTintColor: '#00e676',
        tabBarInactiveTintColor: '#aaa',
        tabBarIcon: ({ color }) => {
          let iconName = 'calculator';
          if (route.name === 'Calculator') iconName = 'calculator-variant';
          if (route.name === 'Converter') iconName = 'currency-usd';
          return <MaterialCommunityIcons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Calculator" component={Calculator} />
      <Tab.Screen
        name="Converter"
        component={ConverterStack}
        options={{
          tabBarStyle: { display: 'none', height: 0 },
        }}
      />
    </Tab.Navigator>
  );
}

function MainStack({ initialRoute }: { initialRoute: string }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#121212' },
      }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="ProfessionalCalculator"
        component={ProfessionalCalculator}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Dedication" component={DedicationScreen} />
      <Stack.Screen name="PrivacyTerms" component={PrivacyTermsScreen} />
      <Stack.Screen name="Tutorial" component={TutorialScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    const bootstrapAsync = async () => {
      // 1) prevent auto hide for the native splash (await and catch)
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (err) {
        // non-fatal; log so we can see issues in development
        console.warn('preventAutoHideAsync failed (ignored):', err);
      }

      // 2) determine initial route from AsyncStorage synchronously in this flow
      try {
        const dedicationDone = await AsyncStorage.getItem('dedicationDone');
        const privacyDone = await AsyncStorage.getItem('privacyDone');
        const tutorialDone = await AsyncStorage.getItem('tutorialDone');

        // decide route locally then set state once
        let route = 'Tabs';
        if (!dedicationDone) route = 'Dedication';
        else if (!privacyDone) route = 'PrivacyTerms';
        else if (!tutorialDone) route = 'Tutorial';

        if (mounted) setInitialRoute(route);
      } catch (e) {
        console.warn('Error checking onboarding state:', e);
        if (mounted) setInitialRoute('Dedication');
      }

      // 3) short delay to let the custom splash animation be visible
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn('App loading delay error:', e);
      }

      // 4) hide the native expo splash (we prevented auto hide earlier)
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // ignore - hideAsync may fail if already hidden; log for debugging
        console.warn('Failed to hide native splash:', e);
      }

      // 5) animate the main UI in. Use native driver = false to avoid
      // potential platform issues that could prevent the callback from firing.
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        if (mounted) setReady(true);
      });

      // safety fallback: if animation callback doesn't fire for any reason,
      // ensure the app becomes ready after a max timeout.
      setTimeout(() => {
        if (mounted) setReady(true);
      }, 1500);
    };

    bootstrapAsync();

    return () => {
      mounted = false;
    };
  }, [slideAnim]);

  const { width } = Dimensions.get('window');
  const slideTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [width, 0],
  });

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#121212' }}>
      <CurrencyProvider>
        <PaperProvider>
          <StatusBar barStyle="light-content" backgroundColor="#121212" />
          {ready ? (
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                { transform: [{ translateX: slideTranslate }] },
              ]}
            >
              <NavigationContainer theme={MyDarkTheme}>
                {/* initialRoute will be set before we mark ready (or fallback to Tabs) */}
                {initialRoute && <MainStack initialRoute={initialRoute} />}
              </NavigationContainer>
            </Animated.View>
          ) : (
            <CustomSplash />
          )}
        </PaperProvider>
      </CurrencyProvider>
    </GestureHandlerRootView>
  );
}
