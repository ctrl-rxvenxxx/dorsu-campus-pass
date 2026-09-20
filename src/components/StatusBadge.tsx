import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBadgeProps } from '../types/student';

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive }) => (
  <View style={[styles.badge, isActive ? styles.active : styles.inactive]}>
    <View style={[styles.dot, isActive ? styles.activeDot : styles.inactiveDot]} />
    <Text style={[styles.text, isActive ? styles.activeText : styles.inactiveText]}>
      {isActive ? 'STATUS: VERIFIED ACTIVE PASS' : 'INACTIVE'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    alignSelf: 'stretch' as const,
    marginVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: '#16a34a',
  },
  inactiveDot: {
    backgroundColor: '#dc2626',
  },
  active: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  inactive: {
    backgroundColor: '#f8d7da',
    borderColor: '#f0a5a5',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  activeText: {
    color: '#207545',
  },
  inactiveText: {
    color: '#9b3030',
  },
});