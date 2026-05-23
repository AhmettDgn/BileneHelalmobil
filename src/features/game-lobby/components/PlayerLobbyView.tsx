import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
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

  return (
    <ThemedScreen tone="night">
      <View className="flex-1 px-5 py-4 gap-4">
        <ThemePanel tone="night" variant="hero" className="gap-5 px-5 py-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <ThemeChip tone="night" accent="primary" className="self-start">
                <ThemeChipText tone="night" accent="primary">
                  Bekleme Ekranı
                </ThemeChipText>
              </ThemeChip>
              <Text className="text-3xl font-bold tracking-[4px] text-accent-cyan">
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

        <ThemePanel tone="night" variant="soft" className="flex-1 gap-4 px-5 py-5">
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

          <FlatList
            data={participants}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
            ListEmptyComponent={
              <View className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-8">
                <Text className="text-center text-sm text-slate-300">
                  Henüz başka katılımcı yok.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View
                className={cn(
                  'flex-1 rounded-[20px] border px-3 py-3',
                  item.id === participantId
                    ? 'border-accent-cyan/25 bg-accent-cyan/10'
                    : 'border-white/10 bg-white/5'
                )}
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
            )}
          />
        </ThemePanel>
      </View>
    </ThemedScreen>
  );
}
