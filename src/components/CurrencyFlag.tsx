import React from 'react';
import { Text } from 'react-native';

export default function CurrencyFlag({ flag, size = 24 }: { flag?: string, size?: number }) {
  return (
    <Text style={{ fontSize: size, marginRight: 8 }}>
      {flag || '💱'}
    </Text>
  );
}
