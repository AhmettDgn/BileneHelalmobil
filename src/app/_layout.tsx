import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { APP_THEME } from '@/theme/app-theme';

void SystemUI.setBackgroundColorAsync(APP_THEME.warm.root);

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(dashboard)" />
        <Stack.Screen name="(game)" />
      </Stack>
    </AuthProvider>
  );
}
