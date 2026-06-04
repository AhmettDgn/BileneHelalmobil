import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { signInWithEmail, signInWithGoogle } from '@/features/auth/authService';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleEmailLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(dashboard)');
    } catch (e: any) {
      Alert.alert('Giriş Hatası', e.message ?? 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) router.replace('/(dashboard)');
    } catch (e: any) {
      Alert.alert('Google Giriş Hatası', e.message ?? 'Bir hata oluştu.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <ThemedScreen tone="warm">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 justify-center px-5 py-6">
          <ThemePanel tone="warm" variant="hero" className="gap-6 px-5 py-6">
            <View className="gap-3">
              <ThemeChip tone="warm" accent="primary" className="self-start">
                <ThemeChipText tone="warm" accent="primary">
                  Host Paneli
                </ThemeChipText>
              </ThemeChip>

              <View className="gap-2">
                <Text className="text-3xl font-bold tracking-tight text-ink-strong">
                  Giriş Yap
                </Text>
                <Text className="text-base leading-6 text-ink-muted">
                  Host paneline ve quiz yönetimine erişmek için hesabınla devam et.
                </Text>
              </View>
            </View>

            <View className="gap-3">
              <TextInput
                className="w-full rounded-[22px] border border-accent-rose/[0.15] bg-white px-4 py-3.5 text-base text-ink-strong"
                placeholder="ornek@email.com"
                placeholderTextColor={APP_THEME.warm.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <TextInput
                className="w-full rounded-[22px] border border-accent-rose/[0.15] bg-white px-4 py-3.5 text-base text-ink-strong"
                placeholder="Şifre"
                placeholderTextColor={APP_THEME.warm.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <View className="gap-3">
              <TouchableOpacity
                onPress={handleEmailLogin}
                disabled={loading}
                className="w-full rounded-[22px] bg-accent-rose py-4 items-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-semibold text-white">Giriş Yap</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row items-center gap-3">
                <View className="flex-1 h-px bg-line-warm" />
                <Text className="text-sm text-ink-soft">veya</Text>
                <View className="flex-1 h-px bg-line-warm" />
              </View>

              <TouchableOpacity
                onPress={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full rounded-[22px] border border-accent-orange/20 bg-surface-warm-soft py-4 items-center"
              >
                {googleLoading ? (
                  <ActivityIndicator color={APP_THEME.warm.secondary} />
                ) : (
                  <Text className="text-base font-semibold text-accent-orange">
                    Google ile Giriş Yap
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View className="flex-row justify-center gap-1">
                <Text className="text-sm text-ink-muted">Hesabın yok mu?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Text className="text-sm font-semibold text-accent-rose">Kayıt Ol</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.back()} className="items-center">
                <Text className="text-sm text-ink-soft">← Ana akışa dön</Text>
              </TouchableOpacity>
            </View>
          </ThemePanel>
        </View>
      </KeyboardAvoidingView>
    </ThemedScreen>
  );
}
