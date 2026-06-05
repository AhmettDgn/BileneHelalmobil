import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { updateProfile } from '@/features/auth/authService';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

export default function ProfileScreen() {
  const { user } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const meta = user.user_metadata;
      const name = 
        (typeof meta?.display_name === 'string' && meta.display_name) ||
        (typeof meta?.full_name === 'string' && meta.full_name) ||
        (typeof meta?.name === 'string' && meta.name) ||
        user.email?.split('@')[0] ||
        '';
      setDisplayName(name);
      setEmail(user.email ?? '');
      setOriginalEmail(user.email ?? '');
    }
  }, [user]);

  async function handleSave() {
    if (!displayName.trim()) {
      Alert.alert('Hata', 'Görünen ad boş bırakılamaz.');
      return;
    }

    setSaving(true);
    try {
      const updates: { displayName: string; email?: string; password?: string } = {
        displayName: displayName.trim(),
      };

      if (email.trim() && email.trim() !== originalEmail) {
        updates.email = email.trim();
      }

      if (password) {
        if (password.length < 6) {
          Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
          setSaving(false);
          return;
        }
        updates.password = password;
      }

      await updateProfile(updates);

      let msg = 'Profil bilgileriniz başarıyla güncellendi.';
      if (updates.email) {
        msg += '\n\nE-posta değişikliğini onaylamak için lütfen eski ve yeni e-posta adreslerinize gönderilen onay bağlantılarını tıklayın.';
        setOriginalEmail(updates.email);
      }

      Alert.alert('Başarılı', msg, [
        { text: 'Tamam', onPress: () => router.back() }
      ]);
      setPassword('');
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedScreen tone="warm">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
          <ThemePanel tone="warm" variant="hero" className="gap-6 px-5 py-6">
            <View className="flex-row items-center justify-between">
              <View className="gap-2 flex-1">
                <ThemeChip tone="warm" accent="primary" className="self-start">
                  <ThemeChipText tone="warm" accent="primary">Hesap Ayarları</ThemeChipText>
                </ThemeChip>
                <Text className="text-3xl font-bold tracking-tight text-ink-strong">
                  Profil Düzenle
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => router.back()}
                className="rounded-full border border-accent-rose/20 bg-white px-4 py-2.5"
              >
                <Text className="text-sm font-semibold text-accent-rose">Vazgeç</Text>
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-ink-muted px-1">Görünen Ad</Text>
                <TextInput
                  className="w-full rounded-[22px] border border-accent-rose/[0.15] bg-white px-4 py-3.5 text-base text-ink-strong"
                  placeholder="Görünen Adınız"
                  placeholderTextColor={APP_THEME.warm.muted}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  editable={!saving}
                />
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-ink-muted px-1">E-posta Adresi</Text>
                <TextInput
                  className="w-full rounded-[22px] border border-accent-rose/[0.15] bg-white px-4 py-3.5 text-base text-ink-strong"
                  placeholder="ornek@email.com"
                  placeholderTextColor={APP_THEME.warm.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!saving}
                />
                {email !== originalEmail && (
                  <Text className="text-xs text-accent-rose px-1">
                    ⚠️ E-posta değişimi onaylama bağlantısı gerektirir.
                  </Text>
                )}
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-ink-muted px-1">Yeni Şifre (İsteğe Bağlı)</Text>
                <TextInput
                  className="w-full rounded-[22px] border border-accent-rose/[0.15] bg-white px-4 py-3.5 text-base text-ink-strong"
                  placeholder="••••••••"
                  placeholderTextColor={APP_THEME.warm.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!saving}
                />
                <Text className="text-xs text-ink-soft px-1">
                  Şifreyi değiştirmek istemiyorsanız boş bırakın.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="w-full rounded-[22px] bg-accent-rose py-4 items-center mt-2"
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">Değişiklikleri Kaydet</Text>
              )}
            </TouchableOpacity>
          </ThemePanel>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedScreen>
  );
}
