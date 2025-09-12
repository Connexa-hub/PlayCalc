import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as NavigationBar from 'expo-navigation-bar';

const TutorialScreen: React.FC = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const tabFadeAnim = useRef(new Animated.Value(0)).current;
  const tabSlideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Hide the navigation bar on supported platforms
    if (Platform.OS === "android" && NavigationBar) {
      NavigationBar.setVisibilityAsync("hidden").catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
    }
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(tabFadeAnim, {
        toValue: step === 1 ? 1 : 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(tabSlideAnim, {
        toValue: step === 1 ? 0 : 50,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    } else {
      await AsyncStorage.setItem("tutorialDone", "true");
      navigation.reset({
        index: 0,
        routes: [{ name: "Tabs" as never }],
      });
    }
  };

  const handleDoubleTap = () => {
    Animated.parallel([
      Animated.timing(tabFadeAnim, {
        toValue: step === 1 ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(tabSlideAnim, {
        toValue: step === 1 ? 0 : 50,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#fff"
        barStyle="dark-content"
        translucent
        hidden={false}
      />
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <MaterialCommunityIcons
          name="gesture-double-tap"
          size={60}
          color="#007bff"
          style={styles.icon}
        />
        <Text style={styles.title}>
          {step === 1 ? "Show the Tab Bar" : "Hide the Tab Bar"}
        </Text>
        <Text style={styles.text}>
          {step === 1
            ? "Double-tap the calculator display to reveal the tab bar. This lets you switch between the Calculator and Converter."
            : "Double-tap the display again to hide the tab bar for a cleaner calculator experience."}
        </Text>
        <Pressable style={styles.mockDisplay} onPress={handleDoubleTap}>
          <View style={styles.mockInputWrapper}>
            <Text style={styles.mockInputText}>3 + 5</Text>
          </View>
          <Text style={styles.mockResultText}>8</Text>
        </Pressable>
      </Animated.View>
      <Animated.View
        style={[
          styles.mockTabBar,
          { opacity: tabFadeAnim, transform: [{ translateY: tabSlideAnim }] },
        ]}
      >
        <View style={styles.tabButton}>
          <MaterialCommunityIcons
            name="calculator-variant"
            size={26}
            color="#00e676"
          />
        </View>
        <View style={styles.tabButton}>
          <MaterialCommunityIcons name="currency-usd" size={26} color="#aaa" />
        </View>
      </Animated.View>
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>{step === 2 ? "Finish" : "Next"}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TutorialScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" },
  content: { alignItems: "center", padding: 20, width: "100%", paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 44 },
  icon: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 12, textAlign: "center" },
  text: { fontSize: 16, lineHeight: 22, color: "#333", textAlign: "center", marginBottom: 20, paddingHorizontal: 20 },
  mockDisplay: { width: "90%", minHeight: 120, backgroundColor: "#000", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 20, marginTop: 20, borderWidth: 1, borderColor: "#333" },
  mockInputWrapper: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", minHeight: 60 },
  mockInputText: { color: "#fff", fontSize: 32, fontFamily: "monospace", textAlign: "right" },
  mockResultText: { color: "#ff9500", fontSize: 20, textAlign: "right", marginTop: 6 },
  mockTabBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 50, backgroundColor: "#121212", flexDirection: "row", justifyContent: "space-around", alignItems: "center", elevation: 8 },
  tabButton: { flex: 1, alignItems: "center", justifyContent: "center" },
  button: { backgroundColor: "#007bff", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10, marginBottom: 20 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
