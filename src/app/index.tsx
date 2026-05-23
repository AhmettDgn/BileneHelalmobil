import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  type TextInput as TextInputType,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { joinGame } from '@/features/game-lobby/lobbyService';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

type Step = 'pin' | 'name';

export default function HomeScreen() {
  const { session } = useAuth();
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<TextInputType>(null);

  function handlePinNext() {
    const trimmed = pin.trim();
    if (trimmed.length < 4) {
      Alert.alert('Hata', 'Geçerli bir PIN gir.');
      return;
    }

    if (session) {
      handleJoin(trimmed, undefined);
    } else {
      setStep('name');
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }

  async function handleJoin(gamePin: string, name: string | undefined) {
    const trimmedName = name?.trim();
    if (!session && !trimmedName) {
      Alert.alert('Hata', 'Görünen ad gerekli.');
      return;
    }

    setLoading(true);
    try {
      await joinGame(gamePin, trimmedName);
      router.push(`/(game)/play/${gamePin}`);
    } catch (e: any) {
      Alert.alert('Katılım Hatası', e.message ?? 'Bir hata oluştu.');
      setStep('pin');
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
        <View className="flex-1 px-5 py-4">
          <ThemePanel tone="warm" variant="hero" className="gap-5 px-5 py-6">
            <View className="gap-3">
              <ThemeChip tone="warm" accent="primary" className="self-start">
                <ThemeChipText tone="warm" accent="primary">
                  Realtime Multiplayer Quiz
                </ThemeChipText>
              </ThemeChip>

              <View className="gap-2">
                <Text className="text-4xl font-bold tracking-tight text-ink-strong">
                  BileneHalal
                </Text>
                <Text className="text-base leading-6 text-ink-muted">
                  Yumuşak yüzeyler, hızlı PIN katılımı ve canlı lobi akışıyla modern
                  bilgi yarışması deneyimi.
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              <ThemeChip tone="warm" className="flex-1 rounded-[18px] px-3 py-3">
                <ThemeChipText tone="warm" className="text-[10px]">
                  Giriş
                </ThemeChipText>
                <Text className="mt-1 text-sm font-semibold text-ink-strong">Hızlı PIN</Text>
              </ThemeChip>
              <ThemeChip tone="warm" accent="secondary" className="flex-1 rounded-[18px] px-3 py-3">
                <ThemeChipText tone="warm" accent="secondary" className="text-[10px]">
                  Akış
                </ThemeChipText>
                <Text className="mt-1 text-sm font-semibold text-ink-strong">Canlı lobi</Text>
              </ThemeChip>
              <ThemeChip tone="warm" accent="primary" className="flex-1 rounded-[18px] px-3 py-3">
                <ThemeChipText tone="warm" accent="primary" className="text-[10px]">
                  Tempo
                </ThemeChipText>
                <Text className="mt-1 text-sm font-semibold text-ink-strong">Anlık geçiş</Text>
              </ThemeChip>
            </View>
          </ThemePanel>

          <View className="flex-1 justify-center">
            <ThemePanel tone="warm" className="gap-5 px-5 py-5">
              <View className="gap-2">
                <ThemeChip tone="warm" accent={step === 'pin' ? 'primary' : 'secondary'} className="self-start">
                  <ThemeChipText tone="warm" accent={step === 'pin' ? 'primary' : 'secondary'}>
                    {step === 'pin' ? 'Adım 1 / PIN' : 'Adım 2 / Oyuncu Adı'}
                  </ThemeChipText>
                </ThemeChip>
                <Text className="text-2xl font-bold text-ink-strong">
                  {step === 'pin' ? 'Oyun PIN’ini gir' : 'Lobide görünecek adını yaz'}
                </Text>
                <Text className="text-sm leading-6 text-ink-muted">
                  {session
                    ? 'Hesabın tanındı. PIN doğrulanınca doğrudan oyuna bağlanacaksın.'
                    : 'PIN doğrulandıktan sonra oyuncu adı ile canlı lobiye geçeceksin.'}
                </Text>
              </View>

              {step === 'pin' ? (
                <View className="gap-3">
                  <TextInput
                    className="w-full rounded-[22px] border border-accent-rose/[0.15] bg-white px-5 py-4 text-center text-3xl font-bold tracking-[6px] text-ink-strong"
                    placeholder="123456"
                    placeholderTextColor={APP_THEME.warm.muted}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    maxLength={8}
                    returnKeyType="go"
                    onSubmitEditing={handlePinNext}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={handlePinNext}
                    disabled={loading}
                    className="w-full rounded-[22px] bg-accent-rose px-5 py-4 items-center"
                  >
                    <Text className="text-base font-semibold text-white">Devam Et</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="gap-3">
                  <TouchableOpacity onPress={() => setStep('pin')} className="self-start">
                    <Text className="text-sm font-medium text-accent-rose">← PIN: {pin}</Text>
                  </TouchableOpacity>
                  <TextInput
                    ref={nameRef}
                    className="w-full rounded-[22px] border border-accent-rose/[0.15] bg-white px-5 py-4 text-center text-xl font-semibold text-ink-strong"
                    placeholder="Görünen adın"
                    placeholderTextColor={APP_THEME.warm.muted}
                    value={displayName}
                    onChangeText={setDisplayName}
                    maxLength={24}
                    returnKeyType="go"
                    onSubmitEditing={() => handleJoin(pin, displayName)}
                    autoCapitalize="words"
                  />
                  <TouchableOpacity
                    onPress={() => handleJoin(pin, displayName)}
                    disabled={loading}
                    className="w-full rounded-[22px] bg-accent-orange px-5 py-4 items-center"
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-base font-semibold text-white">Lobiye Katıl</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ThemePanel>
          </View>

          <View className="items-center gap-3 pb-2">
            <Text className="text-center text-sm text-ink-soft">
              Host paneli ve quiz yönetimi için giriş ekranına geçebilirsin.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              className="rounded-full border border-accent-rose/20 bg-white px-5 py-3"
            >
              <Text className="text-sm font-semibold text-accent-rose">Host olarak giriş yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedScreen>
  );
}
