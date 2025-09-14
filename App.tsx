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
        options={{ tabBarStyle: { display: 'none', height: 0 } }}
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
      try {
        await SplashScreen.preventAutoHideAsync();
      } catch (err) {
        console.warn('preventAutoHideAsync failed (ignored):', err);
      }

      try {
        const dedicationDone = await AsyncStorage.getItem('dedicationDone');
        const privacyDone = await AsyncStorage.getItem('privacyDone');
        const tutorialDone = await AsyncStorage.getItem('tutorialDone');

        let route = 'Tabs';
        if (!dedicationDone) route = 'Dedication';
        else if (!privacyDone) route = 'PrivacyTerms';
        else if (!tutorialDone) route = 'Tutorial';

        if (mounted) setInitialRoute(route);
      } catch (e) {
        console.warn('Error checking onboarding state:', e);
        if (mounted) setInitialRoute('Dedication');
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn('App loading delay error:', e);
      }

      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Failed to hide native splash:', e);
      }

      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        if (mounted) setReady(true);
      });

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
