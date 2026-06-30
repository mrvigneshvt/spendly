import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { requestSmsPermissionsDetailed } from '@/sms/permissions';
import { backfill } from '@/sms/inbox';
import { markBackfilled } from '@/app/bootstrap';

interface Props {
  onGranted: () => void;
  onSkip: () => void;
}

export function PermissionGate({ onGranted, onSkip }: Props) {
  const [status, setStatus] = useState<'prompt' | 'never_ask_again'>('prompt');
  const [busy, setBusy] = useState(false);
  const mounted = React.useRef(true);
  React.useEffect(() => { return () => { mounted.current = false; }; }, []);

  const handleGrant = async () => {
    setBusy(true);
    const result = await requestSmsPermissionsDetailed();
    if (!mounted.current) return;
    if (result === 'granted') {
      try {
        await backfill();
        markBackfilled();
      } catch {
        // backfill error is non-fatal; bootstrap will retry on next launch
      }
      if (mounted.current) onGranted();
      return;
    }
    if (result === 'never_ask_again') {
      if (mounted.current) setStatus('never_ask_again');
    }
    if (mounted.current) setBusy(false);
  };

  if (status === 'never_ask_again') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Permission permanently denied</Text>
        <Text style={styles.body}>
          SMS permission was denied with 'Never ask again'. You can enable it in your device's Settings app, or use Spendly in manual-only mode.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.grantText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Manual only</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Your data stays on your phone</Text>
      <Text style={styles.body}>
        Spendly reads SMS messages from your inbox to automatically detect transactions.
        All processing happens on-device — nothing is sent over the network.
      </Text>
      <TouchableOpacity style={styles.grantBtn} onPress={handleGrant} disabled={busy}>
        <Text style={styles.grantText}>{busy ? 'Granting...' : 'Grant SMS Access'}</Text>
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
