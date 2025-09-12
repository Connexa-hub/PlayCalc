import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  StatusBar,
  Platform,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as NavigationBar from 'expo-navigation-bar';

const PrivacyTermsScreen: React.FC = () => {
  const navigation = useNavigation();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (Platform.OS === "android" && NavigationBar) {
      NavigationBar.setVisibilityAsync("hidden").catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Disable back button
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  const handleAgree = async () => {
    await AsyncStorage.setItem("privacyDone", "true");
    navigation.replace("Tutorial" as never);
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
        <Text style={styles.sectionTitle}>📡 Internet Usage</Text>
        <Text style={styles.text}>
          This app connects to the internet for currency conversion and other
          related features. Data charges may apply based on your provider.
        </Text>

        <Text style={styles.sectionTitle}>📢 Advertisements</Text>
        <Text style={styles.text}>
          The main converter contains ads. By using this app, you agree that
          advertisements will be displayed within the app experience.
        </Text>

        <Text style={styles.sectionTitle}>📜 Terms & Conditions</Text>
        <Text style={styles.text}>
          By continuing, you agree to use this app responsibly. The app is
          provided “as is,” without warranties. We are not liable for any
          financial or personal losses incurred through the use of this app.
        </Text>

        <Text style={styles.sectionTitle}>🔒 Privacy Policy</Text>
        <Text style={styles.text}>
          We respect your privacy. No personal data is collected beyond what is
          required to enable the app’s features. Your data is not shared with
          third parties.
        </Text>

        <Text style={styles.text}>
          You can always revisit this policy in the History screen under the
          three-dot menu.
        </Text>
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleAgree}>
        <Text style={styles.buttonText}>I Agree</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Connexa</Text>
        <Text style={styles.footerText}>© {currentYear}</Text>
      </View>
    </View>
  );
};

export default PrivacyTermsScreen;

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
    backgroundColor: "#28a745",
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
