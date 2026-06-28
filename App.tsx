import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation/RootNavigator';
import { PermissionGate } from '@/app/PermissionGate';
import { bootstrap } from '@/app/bootstrap';

export default function App() {
  const [ready, setReady] = useState(false);
  const [permGate, setPermGate] = useState(true);

  useEffect(() => {
    bootstrap().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  if (permGate) {
    return (
      <SafeAreaProvider>
        <PermissionGate
          onGranted={() => setPermGate(false)}
          onSkip={() => setPermGate(false)}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
