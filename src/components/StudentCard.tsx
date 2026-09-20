import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { StudentProfile } from '../types/student';
import { StatusBadge } from './StatusBadge';

interface StudentCardProps {
  student: StudentProfile;
  isActive: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, isActive }) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Image source={{ uri: student.avatarUrl }} style={styles.avatar} />
        <View style={styles.details}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.idNumber}>{student.idNumber}</Text>
          <Text style={styles.program}>{student.program}</Text>
          <Text style={styles.yearLevel}>{student.yearLevel}</Text>
        </View>
      </View>
      <StatusBadge isActive={isActive} />
      <Text style={styles.campus}>Campus: {student.campus}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#1d3640',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#07849a',
  },
  details: {
    justifyContent: 'center',
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#162631',
  },
  idNumber: {
    fontSize: 14,
    color: '#087f96',
    fontWeight: '700',
    marginTop: 2,
  },
  program: {
    fontSize: 14,
    color: '#344653',
    marginTop: 2,
  },
  yearLevel: {
    fontSize: 12,
    color: '#74828c',
    marginTop: 2,
  },
  campus: {
    fontSize: 13,
    color: '#7b8790',
    fontWeight: '500',
    textAlign: 'center',
  },
});