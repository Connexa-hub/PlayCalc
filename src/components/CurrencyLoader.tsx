import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function CurrencyLoader() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00e676" />
      <Text style={styles.text}>PLAYCALC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', flex: 1, backgroundColor: '#111' },
  text: { color: '#00e676', fontWeight: 'bold', fontSize: 22, marginTop: 20, letterSpacing: 5 }
});
