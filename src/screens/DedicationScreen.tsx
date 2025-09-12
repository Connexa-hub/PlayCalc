import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import * as NavigationBar from 'expo-navigation-bar';

const DedicationScreen: React.FC = () => {
  const navigation = useNavigation();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Hide the navigation bar on supported platforms
    if (Platform.OS === "android" && NavigationBar) {
      NavigationBar.setVisibilityAsync("hidden").catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
    }
  }, []);

  const handleContinue = async () => {
    await AsyncStorage.setItem('dedicationDone', 'true');
    navigation.replace('PrivacyTerms'); // go to next screen
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#fff"
        barStyle="dark-content"
        translucent
        hidden={false}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 44 },
        ]}
      >
        <Text style={styles.title}>Dedication</Text>

        <Text style={styles.sectionTitle}>🙏 To God</Text>
        <Text style={styles.text}>
          This work is dedicated to God Almighty, the source of wisdom and
          inspiration. Without His grace, this product would not exist.
        </Text>

        <Text style={styles.sectionTitle}>🌍 To the Public</Text>
        <Text style={styles.text}>
          We dedicate this app to everyone who believes in accessible tools,
          open knowledge, and the continuous effort to make life easier for
          daily activities and financial needs.
        </Text>

        <Text style={styles.sectionTitle}>💳 To Daily Transaction Users</Text>
        <Text style={styles.text}>
          This app is specially dedicated to all daily transaction users who
          often struggle with saving transactions, naming models, and handling
          different tools. This app was built to simplify, organize, and support
          you with smarter calculations and conversions.
        </Text>

        <Text style={styles.text}>
          To every user of this app, this product is for you. May it serve you
          well in your daily life and work.
        </Text>
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Connexa</Text>
        <Text style={styles.footerText}>© {currentYear}</Text>
      </View>
    </View>
  );
};

export default DedicationScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  footer: { alignItems: "center", marginBottom: 12 },
  footerTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  footerText: { fontSize: 14, color: "#666" },
});
