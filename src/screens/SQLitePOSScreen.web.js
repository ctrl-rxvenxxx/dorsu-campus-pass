import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, FlatList, TextInput,
  TouchableOpacity, Modal, StyleSheet, Alert
} from 'react-native';
import { db, initDatabase } from '../services/db';

export default function SQLitePOSScreen() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const loadData = async (query = '') => {
    const database = await db;

    if (query.trim() === '') {
      const allRows = await database.getAllAsync('SELECT * FROM products ORDER BY id DESC;');
      setProducts(allRows);
    } else {
      const filtered = await database.getAllAsync(
        'SELECT * FROM products WHERE name LIKE ? ORDER BY name ASC;',
        [`%${query}%`]
      );
      setProducts(filtered);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await initDatabase();
      if (isMounted) await loadData();
    };

    initialize().catch((error) => {
      console.error('Failed to initialize the inventory database.', error);
      Alert.alert('Database Error', 'Could not load the inventory database.');
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddProduct = async () => {
    if (!name.trim() || !category.trim() || !price || !stock) {
      Alert.alert('Validation Error', 'Please fill in all product fields.');
      return;
    }

    try {
      const database = await db;
      await database.runAsync(
        'INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?);',
        [name.trim(), category.trim(), parseFloat(price), parseInt(stock, 10)]
      );
      setName(''); setCategory(''); setPrice(''); setStock('');
      setModalVisible(false);
      await loadData(search);
    } catch (error) {
      console.error('Failed to add the product.', error);
      Alert.alert('Database Error', 'Could not save the product.');
    }
  };

  const handleDelete = (id, prodName) => {
    if (!globalThis.confirm(`Remove ${prodName}?`)) return;

    const deleteProduct = async () => {
      try {
        const database = await db;
        await database.runAsync('DELETE FROM products WHERE id = ?;', [id]);
        await loadData(search);
      } catch (error) {
        console.error('Failed to delete the product.', error);
        Alert.alert('Database Error', 'Could not delete the product.');
      }
    };

    deleteProduct();
  };

  const adjustStock = async (id, adjustment) => {
    try {
      const database = await db;
      await database.runAsync(
        'UPDATE products SET stock = stock + ? WHERE id = ? AND stock + ? >= 0;',
        [adjustment, id, adjustment]
      );
      await loadData(search);
    } catch (error) {
      console.error('Failed to update product stock.', error);
      Alert.alert('Database Error', 'Could not update product stock.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Inventory Database (SQLite)</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="🔍 Search items by name (SQL LIKE)..."
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          loadData(text).catch((error) => {
            console.error('Failed to search the inventory.', error);
            Alert.alert('Database Error', 'Could not search the inventory.');
          });
        }}
      />

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>Cat: {item.category} • Stock: {item.stock} units</Text>
              <View style={styles.stockControls}>
                <TouchableOpacity
                  accessibilityLabel={`Decrease ${item.name} stock`}
                  disabled={item.stock <= 0}
                  onPress={() => adjustStock(item.id, -1)}
                  style={[styles.stockBtn, item.stock <= 0 && styles.stockBtnDisabled]}
                >
                  <Text style={styles.stockBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityLabel={`Increase ${item.name} stock`}
                  onPress={() => adjustStock(item.id, 1)}
                  style={styles.stockBtn}
                >
                  <Text style={styles.stockBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.itemPrice}>₱{item.price.toFixed(2)}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.delBtn}>
              <Text style={styles.delBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No products found in SQLite database.</Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Product Entry</Text>
            <TextInput style={styles.input} placeholder="Product Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Category" value={category} onChangeText={setCategory} />
            <TextInput style={styles.input} placeholder="Price (PHP)" keyboardType="numeric" value={price} onChangeText={setPrice} />
            <TextInput style={styles.input} placeholder="Initial Stock" keyboardType="numeric" value={stock} onChangeText={setStock} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddProduct}>
                <Text style={[styles.btnText, { color: '#FFF' }]}>Save to SQLite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0E2A35' },
  addBtn: { backgroundColor: '#00758F', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  addBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  searchBar: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, marginBottom: 12 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  itemMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  stockControls: { flexDirection: 'row', gap: 6, marginTop: 6 },
  stockBtn: { backgroundColor: '#E0F2FE', minWidth: 28, alignItems: 'center', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  stockBtnDisabled: { opacity: 0.45 },
  stockBtnText: { color: '#00758F', fontWeight: 'bold', fontSize: 16 },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#00758F', marginRight: 12 },
  delBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 4 },
  delBtnText: { color: '#DC2626', fontWeight: 'bold', fontSize: 13 },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0E2A35', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, padding: 10, marginBottom: 10 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10 },
  saveBtn: { backgroundColor: '#00758F', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6 },
  btnText: { fontWeight: 'bold', color: '#64748B' }
});
