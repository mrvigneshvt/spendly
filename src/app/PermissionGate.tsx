import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { requestSmsPermissionsDetailed } from '@/sms/permissions';
import { backfill } from '@/sms/inbox';
import { markBackfilled } from '@/app/bootstrap';
import { useTheme } from '@/theme/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

interface Props {
  onGranted: () => void;
  onSkip: () => void;
}

function useStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background },
    icon: { fontSize: 48, marginBottom: 16 },
    title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: colors.text },
    body: { fontSize: 15, textAlign: 'center', color: colors.textSecondary, lineHeight: 22, marginBottom: 32 },
    grantBtn: { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: 12, width: '100%', alignItems: 'center' },
    grantText: { color: colors.chipSelectedText, fontSize: 16, fontWeight: '600' },
    skipBtn: { padding: 14, marginTop: 12 },
    skipText: { color: colors.textTertiary, fontSize: 15 },
  });
}

export function PermissionGate({ onGranted, onSkip }: Props) {
  const { colors } = useTheme();
  const s = useStyles(colors);
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
      <View style={s.container}>
        <Text style={s.icon}>⚠️</Text>
        <Text style={s.title}>Permission permanently denied</Text>
        <Text style={s.body}>
          SMS permission was denied with 'Never ask again'. You can enable it in your device's Settings app, or use Spendly in manual-only mode.
        </Text>
        <TouchableOpacity style={s.grantBtn} onPress={() => Linking.openSettings()}>
          <Text style={s.grantText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.skipBtn} onPress={onSkip}>
          <Text style={s.skipText}>Manual only</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.icon}>🔒</Text>
      <Text style={s.title}>Your data stays on your phone</Text>
      <Text style={s.body}>
        Spendly reads SMS messages from your inbox to automatically detect transactions.
        All processing happens on-device — nothing is sent over the network.
      </Text>
      <TouchableOpacity style={s.grantBtn} onPress={handleGrant} disabled={busy}>
        <Text style={s.grantText}>{busy ? 'Granting...' : 'Grant SMS Access'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.skipBtn} onPress={onSkip}>
        <Text style={s.skipText}>Not now — manual only</Text>
      </TouchableOpacity>
    </View>
  );
}
