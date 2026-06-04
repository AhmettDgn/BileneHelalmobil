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
import { signUpWithEmail, signInWithGoogle } from '@/features/auth/authService';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleRegister() {
    setGoogleLoading(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) router.replace('/(dashboard)');
    } catch (e: any) {
      Alert.alert('Google Kayıt Hatası', e.message ?? 'Bir hata oluştu.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleRegister() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı.');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      Alert.alert(
        'Başarılı',
        'Kayıt tamamlandı. E-posta adresini doğruladıktan sonra giriş yapabilirsin.',
        [{ text: 'Tamam', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (e: any) {
      Alert.alert('Kayıt Hatası', e.message ?? 'Bir hata oluştu.');
    } finally {
      setLoading(false);
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
              <ThemeChip tone="warm" accent="secondary" className="self-start">
                <ThemeChipText tone="warm" accent="secondary">
                  Yeni Host Hesabı
                </ThemeChipText>
              </ThemeChip>

              <View className="gap-2">
                <Text className="text-3xl font-bold tracking-tight text-ink-strong">
                  Kayıt Ol
                </Text>
                <Text className="text-base leading-6 text-ink-muted">
                  Quiz üretimi ve canlı oyun yönetimi için yeni bir host hesabı oluştur.
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
              />
              <TextInput
                className="w-full rounded-[22px] border border-accent-rose/[0.15] bg-white px-4 py-3.5 text-base text-ink-strong"
                placeholder="Şifre tekrar"
                placeholderTextColor={APP_THEME.warm.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading || googleLoading}
              className="w-full rounded-[22px] bg-accent-orange py-4 items-center"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Hesap Oluştur</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-px bg-line-warm" />
              <Text className="text-sm text-ink-soft">veya</Text>
              <View className="flex-1 h-px bg-line-warm" />
            </View>

            <TouchableOpacity
              onPress={handleGoogleRegister}
              disabled={loading || googleLoading}
              className="w-full rounded-[22px] border border-accent-rose/20 bg-surface-warm-soft py-4 items-center"
            >
              {googleLoading ? (
                <ActivityIndicator color={APP_THEME.warm.primary} />
              ) : (
                <Text className="text-base font-semibold text-accent-rose">
                  Google ile Kayıt Ol
                </Text>
              )}
            </TouchableOpacity>

            <View className="gap-4">
              <View className="flex-row justify-center gap-1">
                <Text className="text-sm text-ink-muted">Zaten hesabın var mı?</Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                  <Text className="text-sm font-semibold text-accent-rose">Giriş Yap</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.back()} className="items-center">
                <Text className="text-sm text-ink-soft">← Geri dön</Text>
              </TouchableOpacity>
            </View>
          </ThemePanel>
        </View>
      </KeyboardAvoidingView>
    </ThemedScreen>
  );
}
