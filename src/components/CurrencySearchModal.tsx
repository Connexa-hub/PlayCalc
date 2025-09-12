import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import CurrencyLoader from './CurrencyLoader';
import CurrencyFlag from './CurrencyFlag';

const CurrencySearchModal = ({ visible, onSelect, onClose, currencies }) => {
  const [search, setSearch] = useState('');

  const filtered = Object.keys(currencies || {})
    .filter(code =>
      code.toLowerCase().includes(search.toLowerCase()) ||
      currencies[code].name.toLowerCase().includes(search.toLowerCase())
    );

  if (!currencies || Object.keys(currencies).length === 0) return <CurrencyLoader />;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          <TextInput
            style={styles.input}
            placeholder="Search currency..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          <FlatList
            data={filtered}
            keyExtractor={code => code}
            renderItem={({ item: code }) => (
              <TouchableOpacity style={styles.item} onPress={() => { onSelect(code); setSearch(''); }}>
                <CurrencyFlag flag={currencies[code]?.flag} size={22} />
                <Text style={styles.code}>{code}</Text>
                <Text style={styles.name}>{currencies[code]?.name || ''}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    backgroundColor: '#232323',
    borderRadius: 16,
    padding: 16,
    maxHeight: '85%',
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#444',
    borderBottomWidth: 1,
  },
  code: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    color: '#aaa',
    flex: 1,
    flexWrap: 'wrap',
  },
  close: {
    backgroundColor: '#00e676',
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
    padding: 10,
  },
  closeText: {
    fontWeight: 'bold',
    color: '#121212',
    fontSize: 16,
  },
});

export default CurrencySearchModal;
