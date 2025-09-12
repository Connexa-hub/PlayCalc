import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
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

SplashScreen.preventAutoHideAsync();

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
        contentStyle: { backgroundColor: '#121212' }, // removes white flash
        cardStyle: { backgroundColor: '#121212' },
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
        cardStyle: { backgroundColor: '#121212' },
      }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="ProfessionalCalculator"
        component={ProfessionalCalculator}
        options={{ presentation: 'modal' }}
      />
      {/* Onboarding screens */}
      <Stack.Screen name="Dedication" component={DedicationScreen} />
      <Stack.Screen name="PrivacyTerms" component={PrivacyTermsScreen} />
      <Stack.Screen name="Tutorial" component={TutorialScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const dedicationDone = await AsyncStorage.getItem('dedicationDone');
        const privacyDone = await AsyncStorage.getItem('privacyDone');
        const tutorialDone = await AsyncStorage.getItem('tutorialDone');

        if (!dedicationDone) {
          setInitialRoute('Dedication');
        } else if (!privacyDone) {
          setInitialRoute('PrivacyTerms');
        } else if (!tutorialDone) {
          setInitialRoute('Tutorial');
        } else {
          setInitialRoute('Tabs');
        }
      } catch (e) {
        console.warn('Error checking onboarding state:', e);
        setInitialRoute('Dedication');
      }
    };

    const prepareApp = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 4000));
      } catch (e) {
        console.warn('App loading error:', e);
      } finally {
        await SplashScreen.hideAsync();
        setReady(true);
      }
    };

    checkProgress();
    prepareApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#121212' }}>
      <CurrencyProvider>
        <PaperProvider>
          <StatusBar barStyle="light-content" backgroundColor="#121212" />
          {ready ? (
            <NavigationContainer theme={MyDarkTheme}>
              {initialRoute && <MainStack initialRoute={initialRoute} />}
            </NavigationContainer>
          ) : (
            <CustomSplash onFinish={() => setReady(true)} />
          )}
        </PaperProvider>
      </CurrencyProvider>
    </GestureHandlerRootView>
  );
}
