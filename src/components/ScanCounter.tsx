import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

interface ScanCounterProps {
  count: number;
  onScan: () => void;
  onReset: () => void;
}

export const ScanCounter: React.FC<ScanCounterProps> = ({ count, onScan, onReset }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Campus Gate Verification Log</Text>
    <View style={styles.counterDisplay}>
      <Text style={styles.label}>Today's Gate Entries:</Text>
      <Text style={styles.value}>{count}</Text>
    </View>
    <View style={styles.btnRow}>
      <Pressable style={styles.btnPrimary} onPress={onScan}>
        <Text style={styles.btnText}>+1 Scan at Gate</Text>
      </Pressable>
      <Pressable style={styles.btnSecondary} onPress={onReset}>
        <Text style={styles.btnSecText}>Reset Scans</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#162631',
  },
  counterDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  label: {
    fontSize: 16,
    marginRight: 8,
  },
  value: {
    fontSize: 30,
    fontWeight: '800',
    color: '#087f96',
    marginLeft: 'auto',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: '#087f96',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  btnSecondary: {
    backgroundColor: '#e8eef5',
    padding: 12,
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
  },
  btnSecText: {
    color: '#344653',
    fontWeight: 'bold',
  },
});