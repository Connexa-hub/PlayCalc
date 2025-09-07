import React, { useState } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';

export default function CurrencySearchModal({ visible, onSelect, onClose, currencies }) {
  const [query, setQuery] = useState('');
  const filtered = Object.entries(currencies)
    .filter(([code, obj]) => code.toLowerCase().includes(query.toLowerCase()) || (obj.name || '').toLowerCase().includes(query.toLowerCase()));
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modal}>
        <TextInput style={styles.input} placeholder="Search currency..." value={query} onChangeText={setQuery} />
        <FlatList
          data={filtered}
          keyExtractor={([code]) => code}
          renderItem={({ item: [code, obj] }) => (
            <TouchableOpacity onPress={() => { onSelect(code); setQuery(''); }}>
              <Text style={styles.item}>{obj.flag || '💱'} {code} - {obj.name}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={{color: "#191919"}}>Close</Text></TouchableOpacity>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: '#232323ee', padding: 16, justifyContent: "center" },
  input: { backgroundColor: '#fff', color: '#191919', marginBottom: 8, borderRadius: 8, padding: 8 },
  item: { color: '#00e676', padding: 10, borderBottomWidth: 1, borderBottomColor: '#444', fontSize: 18 },
  closeBtn: { marginTop: 12, alignSelf: 'center', backgroundColor: '#00e676', padding: 8, borderRadius: 8 }
});
