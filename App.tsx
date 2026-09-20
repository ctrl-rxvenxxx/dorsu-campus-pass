import React, { useState } from 'react';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  View,
  TextInput,
  Modal,
} from 'react-native';
import { StudentCard } from './src/components/StudentCard';
import { ScanCounter } from './src/components/ScanCounter';
import { StudentProfile } from './src/types/student';

const initialStudent: StudentProfile = {
  name: 'Juan Dela Cruz',
  idNumber: '2023-1286',
  program: 'BS Information Technology',
  yearLevel: '3rd Year - Section F',
  avatarUrl: 'https://via.placeholder.com/150',
  campus: 'Main Campus (Guang-guang, Mati City)',
};

export default function App() {
  const [student, setStudent] = useState<StudentProfile>(initialStudent);
  const [draftStudent, setDraftStudent] = useState<StudentProfile>(initialStudent);
  const [isActive, setIsActive] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [isPeerDemoVisible, setIsPeerDemoVisible] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const openEditor = () => {
    setDraftStudent(student);
    setIsEditorVisible(true);
  };

  const saveStudent = () => {
    setStudent(draftStudent);
    setIsEditorVisible(false);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    setHasScanned(false);
    setIsScannerVisible(true);
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (hasScanned) {
      return;
    }

    setHasScanned(true);
    setLastScan(data);
    setScanCount((current) => current + 1);
  };

  const chooseAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setDraftStudent((current) => ({ ...current, avatarUrl: result.assets[0].uri }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.university}>DAVAO ORIENTAL STATE UNIVERSITY</Text>
          <Text style={styles.faculty}>FACULTY OF COMPUTING, ENGINEERING, AND TECHNOLOGY</Text>
          <Text style={styles.passLabel}>OFFICIAL STUDENT DIGITAL PASS • AY 2026–2027</Text>
          <Pressable style={styles.settingsBtn} onPress={openEditor} accessibilityLabel="Edit profile">
            <Text style={styles.settingsText}>⚙</Text>
          </Pressable>
        </View>
        <StudentCard student={student} isActive={isActive} />
        <ScanCounter
          count={scanCount}
          onScan={() => setScanCount((current) => current + 1)}
          onReset={() => setScanCount(0)}
        />
        {lastScan && <Text style={styles.lastScan}>Last QR read: {lastScan}</Text>}
        <Pressable style={styles.toggleBtn} onPress={() => setIsActive((current) => !current)}>
          <Text style={styles.toggleText}>
            {isActive ? '⚠ Simulate Pass Suspension' : '✓ Restore Verified Pass'}
          </Text>
        </Pressable>
        <Pressable
          style={styles.peerBtn}
          onPress={() => setIsPeerDemoVisible((current) => !current)}
        >
          <Text style={styles.peerText}>
            {isPeerDemoVisible ? 'Hide Peer Component Demo' : 'Show Peer Component Demo'}
          </Text>
        </Pressable>
      </ScrollView>
      <Modal
        visible={isScannerVisible}
        animationType="slide"
        onRequestClose={() => setIsScannerVisible(false)}
      >
        <SafeAreaView style={styles.scannerScreen}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan Campus QR</Text>
            <Pressable onPress={() => setIsScannerVisible(false)} accessibilityLabel="Close scanner">
              <Text style={styles.closeScanner}>Close</Text>
            </Pressable>
          </View>
          {!permission?.granted ? (
            <View style={styles.permissionPanel}>
              <Text style={styles.permissionTitle}>Camera access is needed</Text>
              <Text style={styles.permissionText}>
                Allow camera access in your device settings, then try scanning again.
              </Text>
              <Pressable style={styles.saveBtn} onPress={requestPermission}>
                <Text style={styles.saveText}>Allow Camera</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.cameraFrame}>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
              />
              <View style={styles.scanGuide} />
              {hasScanned && (
                <View style={styles.scanSuccess}>
                  <Text style={styles.scanSuccessText}>QR scanned successfully</Text>
                  <Pressable style={styles.saveBtn} onPress={() => setIsScannerVisible(false)}>
                    <Text style={styles.saveText}>Done</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </Modal>
      <Modal visible={isEditorVisible} animationType="slide" transparent onRequestClose={() => setIsEditorVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.editorCard}>
            <Text style={styles.editorTitle}>Edit Student Details</Text>
            <TextInput
              style={styles.input}
              value={draftStudent.name}
              placeholder="Full name"
              onChangeText={(name) => setDraftStudent((current) => ({ ...current, name }))}
            />
            <TextInput
              style={styles.input}
              value={draftStudent.idNumber}
              placeholder="Student ID"
              onChangeText={(idNumber) => setDraftStudent((current) => ({ ...current, idNumber }))}
            />
            <TextInput
              style={styles.input}
              value={draftStudent.program}
              placeholder="Program"
              onChangeText={(program) => setDraftStudent((current) => ({ ...current, program }))}
            />
            <TextInput
              style={styles.input}
              value={draftStudent.yearLevel}
              placeholder="Year level"
              onChangeText={(yearLevel) => setDraftStudent((current) => ({ ...current, yearLevel }))}
            />
            <TextInput
              style={styles.input}
              value={draftStudent.campus}
              placeholder="Campus"
              onChangeText={(campus) => setDraftStudent((current) => ({ ...current, campus }))}
            />
            <Pressable style={styles.avatarPickerBtn} onPress={chooseAvatar}>
              <Text style={styles.avatarPickerText}>Choose Photo from Gallery</Text>
            </Pressable>
            <View style={styles.editorActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setIsEditorVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveStudent}>
                <Text style={styles.saveText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContent: {
    padding: 20,
  },
  hero: {
    position: 'relative',
    backgroundColor: '#087f96',
    borderBottomWidth: 5,
    borderBottomColor: '#f2a900',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 12,
  },
  university: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#ffffff',
  },
  faculty: {
    fontSize: 11,
    textAlign: 'center',
    color: '#e4f7fa',
    marginTop: 8,
  },
  passLabel: {
    fontSize: 11,
    color: '#d5f3f5',
    backgroundColor: '#076b7d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 14,
  },
  settingsBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    color: '#ffffff',
    fontSize: 27,
  },
  toggleBtn: {
    backgroundColor: '#ffe2e2',
    borderColor: '#f3a1a1',
    borderWidth: 1,
    padding: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 8,
  },
  toggleText: {
    color: '#9b3030',
    fontWeight: '600',
  },
  peerBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5df',
    borderWidth: 1,
    padding: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  peerText: {
    color: '#087f96',
    fontWeight: '700',
  },
  lastScan: {
    color: '#207545',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  scannerScreen: {
    flex: 1,
    backgroundColor: '#081f27',
  },
  scannerHeader: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scannerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  closeScanner: {
    color: '#9ee7ed',
    fontWeight: '700',
  },
  permissionPanel: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  permissionTitle: {
    color: '#162631',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  permissionText: {
    color: '#344653',
    lineHeight: 21,
    marginBottom: 16,
  },
  cameraFrame: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  scanGuide: {
    position: 'absolute',
    top: '30%',
    left: '12%',
    right: '12%',
    height: 220,
    borderWidth: 3,
    borderColor: '#f2a900',
    borderRadius: 16,
  },
  scanSuccess: {
    position: 'absolute',
    bottom: 28,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  scanSuccessText: {
    color: '#207545',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(8, 31, 39, 0.55)',
  },
  editorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
  },
  editorTitle: {
    color: '#162631',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  input: {
    borderColor: '#cbd5df',
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#162631',
  },
  avatarPickerBtn: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#e6f7fa',
    borderColor: '#087f96',
    borderWidth: 1,
    marginBottom: 10,
  },
  avatarPickerText: {
    color: '#087f96',
    fontWeight: '700',
  },
  editorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#e8eef5',
  },
  cancelText: {
    color: '#344653',
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#087f96',
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});