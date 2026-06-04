import { useEffect } from 'react';
import { Text, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    if (!code) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          router.replace('/(dashboard)');
        } else {
          router.replace('/');
        }
      });
      return;
    }

    supabase.auth.exchangeCodeForSession(code)
      .then(({ data, error }) => {
        if (error) {
          Alert.alert('Giriş Hatası', error.message);
          router.replace('/(auth)/login');
        } else if (data.session) {
          router.replace('/(dashboard)');
        } else {
          router.replace('/');
        }
      })
      .catch((err) => {
        Alert.alert('Giriş Hatası', err.message || 'Bilinmeyen hata');
        router.replace('/(auth)/login');
      });
  }, [code]);

  return (
    <ThemedScreen tone="night" contentClassName="justify-center px-5">
      <ThemePanel tone="night" className="items-center gap-4 px-5 py-6">
        <ActivityIndicator size="large" color={APP_THEME.night.primary} />
        <Text className="text-sm text-slate-300">Giriş yapılıyor, lütfen bekleyin...</Text>
      </ThemePanel>
    </ThemedScreen>
  );
}
