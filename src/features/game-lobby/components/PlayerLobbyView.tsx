import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLobbySubscription } from '../hooks/useLobbySubscription';
import { updateDisplayName } from '../lobbyService';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase/client';
import { clearPlayerSession } from '@/lib/player-session';
import { router } from 'expo-router';

interface Props {
  gameSessionId: string;
  gamePin: string;
  participantId: string;
  displayName: string;
}

export function PlayerLobbyView({
  gameSessionId,
  gamePin,
  participantId,
  displayName: initialName,
}: Props) {
  const { participants, loading, refresh } = useLobbySubscription(gameSessionId);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await updateDisplayName(participantId, trimmed);
      setEditing(false);
      await refresh(); // listeyi anlık güncelle (polling beklemeden)
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLeaveGame() {
    Alert.alert(
      'Yarışmadan Ayrıl',
      'Bu yarışmadan ayrılmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayrıl',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('participants').delete().eq('id', participantId);
              await clearPlayerSession(gamePin);
              router.replace('/');
            } catch {
              await clearPlayerSession(gamePin);
              router.replace('/');
            }
          },
        },
      ]
    );
  }

  return (
    <ThemedScreen tone="night">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <ThemePanel tone="night" variant="hero" className="gap-5 px-5 py-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <View className="flex-row items-center justify-between">
                <ThemeChip tone="night" accent="primary" className="self-start">
                  <ThemeChipText tone="night" accent="primary">
                    Bekleme Ekranı
                  </ThemeChipText>
                </ThemeChip>

                <TouchableOpacity onPress={handleLeaveGame} activeOpacity={0.7} className="px-2 py-1">
                  <Text className="text-xs font-bold text-state-danger uppercase tracking-[1px]">Ayrıl</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-3xl font-bold tracking-[4px] text-accent-cyan mt-1">
                {gamePin}
              </Text>
              <Text className="text-sm leading-6 text-slate-300">
                Host oyunu başlatana kadar lobi canlı olarak güncelleniyor.
              </Text>
            </View>

            <ThemeChip tone="night" accent="secondary">
              <ThemeChipText tone="night" accent="secondary">Live</ThemeChipText>
            </ThemeChip>
          </View>

          {editing ? (
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 rounded-[20px] border border-white/[0.12] bg-white/5 px-4 py-3 text-base text-white"
                placeholder="Takma adın"
                placeholderTextColor={APP_THEME.night.muted}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                maxLength={24}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <TouchableOpacity
                onPress={handleSaveName}
                disabled={saving}
                className="rounded-[20px] bg-accent-cyan px-4 py-3"
              >
                {saving ? (
                  <ActivityIndicator color={APP_THEME.night.root} size="small" />
                ) : (
                  <Text className="text-sm font-semibold text-surface-night">Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setEditing(true)}
              className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4"
            >
              <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-slate-400">
                Oyuncu adı
              </Text>
              <Text className="mt-2 text-base font-semibold text-white">{nameInput}</Text>
            </TouchableOpacity>
          )}
        </ThemePanel>

        <ThemePanel tone="night" variant="soft" className="gap-4 px-5 py-5">
          <View className="flex-row items-center justify-between gap-3">
            <View>
              <Text className="text-xl font-semibold text-white">Katılımcılar</Text>
              <Text className="mt-1 text-sm text-slate-400">
                Yeni oyuncular lobiye anlık olarak eklenir.
              </Text>
            </View>
            <ThemeChip tone="night" accent="primary">
              <ThemeChipText tone="night" accent="primary">
                {loading ? '...' : `${participants.length} hazır`}
              </ThemeChipText>
            </ThemeChip>
          </View>

          <View className="flex-row flex-wrap justify-between gap-y-3">
            {participants.map((item) => (
              <View
                key={item.id}
                className={cn(
                  'rounded-[20px] border px-3 py-3',
                  item.id === participantId
                    ? 'border-accent-cyan/25 bg-accent-cyan/10'
                    : 'border-white/10 bg-white/5'
                )}
                style={{ width: '48%' }}
              >
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    item.id === participantId ? 'text-accent-cyan' : 'text-white'
                  )}
                  numberOfLines={1}
                >
                  {item.display_name}
                  {item.id === participantId ? ' (sen)' : ''}
                </Text>
              </View>
            ))}
            {participants.length === 0 && (
              <View className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-8">
                <Text className="text-center text-sm text-slate-300">
                  Henüz başka katılımcı yok.
                </Text>
              </View>
            )}
          </View>
        </ThemePanel>
      </ScrollView>
    </ThemedScreen>
  );
}
