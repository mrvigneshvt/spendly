import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { requestSmsPermissions } from '@/sms/permissions';

interface Props {
  onGranted: () => void;
  onSkip: () => void;
}

export function PermissionGate({ onGranted, onSkip }: Props) {
  const handleGrant = async () => {
    const ok = await requestSmsPermissions();
    if (ok) onGranted();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Your data stays on your phone</Text>
      <Text style={styles.body}>
        Spendly reads SMS messages from your inbox to automatically detect transactions.
        All processing happens on-device — nothing is sent over the network.
      </Text>
      <TouchableOpacity style={styles.grantBtn} onPress={handleGrant}>
        <Text style={styles.grantText}>Grant SMS Access</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
        <Text style={styles.skipText}>Not now — manual only</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 15, textAlign: 'center', color: '#666', lineHeight: 22, marginBottom: 32 },
  grantBtn: { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: '#007AFF', borderRadius: 12, width: '100%', alignItems: 'center' },
  grantText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipBtn: { padding: 14, marginTop: 12 },
  skipText: { color: '#999', fontSize: 15 },
});
