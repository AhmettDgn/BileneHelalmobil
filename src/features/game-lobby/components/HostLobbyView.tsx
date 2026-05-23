import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useLobbySubscription } from '../hooks/useLobbySubscription';
import { startGameSession } from '@/features/quiz-engine/gameService';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';
import { cn } from '@/lib/cn';

interface Props {
  gameSessionId: string;
  gamePin: string;
}

export function HostLobbyView({ gameSessionId, gamePin }: Props) {
  const { participants, loading } = useLobbySubscription(gameSessionId);
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    if (participants.length === 0) {
      Alert.alert('Uyarı', 'En az 1 oyuncu gerekli.');
      return;
    }
    setStarting(true);
    try {
      await startGameSession(gameSessionId);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
      setStarting(false);
    }
  }

  return (
    <ThemedScreen tone="night">
      <View className="flex-1 px-5 py-4 gap-4">
        <ThemePanel tone="night" variant="hero" className="gap-5 px-5 py-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <TouchableOpacity onPress={() => router.back()} className="self-start">
                <Text className="text-sm font-semibold text-slate-400">← Oturuma dön</Text>
              </TouchableOpacity>
              <ThemeChip tone="night" accent="secondary" className="self-start">
                <ThemeChipText tone="night" accent="secondary">Host Lobisi</ThemeChipText>
              </ThemeChip>
              <Text className="text-3xl font-bold tracking-[4px] text-accent-cyan">
                {gamePin}
              </Text>
              <Text className="text-sm leading-6 text-slate-300">
                Katılımcılar toplanıyor. Hazır olduğunda canlı soru akışını başlatabilirsin.
              </Text>
            </View>

            <ThemeChip tone="night" accent="primary">
              <ThemeChipText tone="night" accent="primary">
                {participants.length} oyuncu
              </ThemeChipText>
            </ThemeChip>
          </View>

          <View className="flex-row gap-2">
            <ThemeChip tone="night" accent="primary" className="flex-1 rounded-[18px] px-3 py-3">
              <ThemeChipText tone="night" accent="primary" className="text-[10px]">
                Durum
              </ThemeChipText>
              <Text className="mt-1 text-sm font-semibold text-white">
                {participants.length > 0 ? 'Hazır bekleme' : 'Oyuncu bekleniyor'}
              </Text>
            </ThemeChip>
            <ThemeChip tone="night" accent="secondary" className="flex-1 rounded-[18px] px-3 py-3">
              <ThemeChipText tone="night" accent="secondary" className="text-[10px]">
                Başlatma
              </ThemeChipText>
              <Text className="mt-1 text-sm font-semibold text-white">Tek aksiyon</Text>
            </ThemeChip>
          </View>
        </ThemePanel>

        <ThemePanel tone="night" variant="soft" className="flex-1 gap-4 px-5 py-5">
          <View className="flex-row items-center justify-between gap-3">
            <View>
              <Text className="text-xl font-semibold text-white">Katılımcılar</Text>
              <Text className="mt-1 text-sm text-slate-400">
                Oyuncular lobiye girdikçe liste gerçek zamanlı güncellenir.
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator color={APP_THEME.night.primary} size="small" />
            ) : (
              <ThemeChip tone="night">
                <ThemeChipText tone="night">{participants.length} kişi</ThemeChipText>
              </ThemeChip>
            )}
          </View>

          <FlatList
            data={participants}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10, paddingBottom: 128 }}
            ListEmptyComponent={
              <View className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-8">
                <Text className="text-center text-sm text-slate-300">
                  Oyuncuların lobiye katılması bekleniyor...
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="flex-1 rounded-[20px] border border-white/10 bg-white/5 px-3 py-3">
                <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                  {item.display_name}
                </Text>
              </View>
            )}
          />
        </ThemePanel>

        <View className="absolute bottom-4 left-5 right-5">
          <ThemePanel tone="night" variant="hero" className="px-4 py-4">
            <TouchableOpacity
              onPress={handleStart}
              disabled={starting}
              className={cn(
                'rounded-[22px] py-4 items-center',
                participants.length > 0 ? 'bg-accent-cyan' : 'bg-white/10'
              )}
            >
              {starting ? (
                <ActivityIndicator color={APP_THEME.night.root} />
              ) : (
                <Text
                  className={cn(
                    'text-base font-semibold',
                    participants.length > 0 ? 'text-surface-night' : 'text-slate-500'
                  )}
                >
                  Oyunu Başlat ({participants.length})
                </Text>
              )}
            </TouchableOpacity>
          </ThemePanel>
        </View>
      </View>
    </ThemedScreen>
  );
}
