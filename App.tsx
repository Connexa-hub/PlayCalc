import React, { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
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
import { CurrencyProvider } from './src/context/CurrencyContext';

SplashScreen.preventAutoHideAsync(); // ⛔️ Don't auto-hide native splash

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ConverterStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
          return <MaterialCommunityIcons name={iconName} color={color} size={26} />;
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

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="ProfessionalCalculator"
        component={ProfessionalCalculator}
        options={{
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

useEffect(() => {
  const prepareApp = async () => {
    try {
      // Load fonts, data, etc.
      await new Promise(resolve => setTimeout(resolve, 4000));
    } catch (e) {
      console.warn('App loading error:', e);
    } finally {
      await SplashScreen.hideAsync();
      setReady(true); // triggers splash fade-out
    }
  };

  prepareApp();
}, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CurrencyProvider>
        <PaperProvider>
          <StatusBar barStyle="light-content" backgroundColor="#121212" />
          {ready ? (
            <NavigationContainer>
              <MainStack />
            </NavigationContainer>
          ) : (
            <CustomSplash onFinish={() => setReady(true)} />
          )}
        </PaperProvider>
      </CurrencyProvider>
    </GestureHandlerRootView>
  );
}
