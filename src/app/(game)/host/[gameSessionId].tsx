import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useGameSync } from '@/features/quiz-engine/hooks/useGameSync';
import { useLeaderboard } from '@/features/quiz-engine/hooks/useLeaderboard';
import { HostLobbyView } from '@/features/game-lobby/components/HostLobbyView';
import { HostGameView } from '@/features/quiz-engine/components/HostGameView';
import { LeaderboardView } from '@/features/stats/components/LeaderboardView';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

interface SessionMeta {
  gamePin: string;
  hostId: string;
}

function HostContent({ gameSessionId, meta }: { gameSessionId: string; meta: SessionMeta }) {
  const { state, error } = useGameSync(gameSessionId);
  const finalLeaderboard = useLeaderboard(gameSessionId);

  if (error) {
    return (
      <ThemedScreen tone="night" contentClassName="justify-center px-5">
        <ThemePanel tone="night" className="gap-3 px-5 py-6">
          <ThemeChip tone="night" accent="danger" className="self-start">
            <ThemeChipText tone="night" accent="danger">Bağlantı Hatası</ThemeChipText>
          </ThemeChip>
          <Text className="text-lg font-semibold text-white">Host akışı okunamadı.</Text>
          <Text className="text-sm leading-6 text-slate-300">{error}</Text>
        </ThemePanel>
      </ThemedScreen>
    );
  }

  if (!state) {
    return (
      <ThemedScreen tone="night" contentClassName="justify-center px-5">
        <ThemePanel tone="night" className="items-center gap-4 px-5 py-6">
          <ActivityIndicator size="large" color={APP_THEME.night.primary} />
          <Text className="text-sm text-slate-300">Host paneli hazırlanıyor...</Text>
        </ThemePanel>
      </ThemedScreen>
    );
  }

  if (state.gameStatus === 'waiting') {
    return <HostLobbyView gameSessionId={gameSessionId} gamePin={meta.gamePin} />;
  }

  if (state.gameStatus === 'in_progress') {
    return (
      <HostGameView
        gameSessionId={gameSessionId}
        hostId={meta.hostId}
        syncState={state}
      />
    );
  }

  return (
    <ThemedScreen tone="night">
      <View className="flex-1 px-5 py-4 gap-4">
        <ThemePanel tone="night" variant="hero" className="gap-3 px-5 py-5">
          <ThemeChip tone="night" accent="secondary" className="self-start">
            <ThemeChipText tone="night" accent="secondary">Final</ThemeChipText>
          </ThemeChip>
          <Text className="text-2xl font-bold text-white">Oyun Bitti</Text>
          <Text className="text-sm leading-6 text-slate-300">
            Tüm sorular tamamlandı. Final sıralamasını aşağıdan inceleyebilirsin.
          </Text>
        </ThemePanel>

        <LeaderboardView entries={finalLeaderboard} title="Final Sıralaması" />
      </View>
    </ThemedScreen>
  );
}

export default function HostScreen() {
  const { gameSessionId } = useLocalSearchParams<{ gameSessionId: string }>();
  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/(auth)/login');
          return;
        }

        const { data, error } = await supabase
          .from('game_sessions')
          .select('game_pin, host_id')
          .eq('id', gameSessionId)
          .single();

        if (error || !data) {
          setAuthError(true);
          return;
        }

        if (data.host_id !== user.id) {
          setAuthError(true);
          return;
        }

        setMeta({ gamePin: data.game_pin, hostId: user.id });
      } catch {
        setAuthError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [gameSessionId]);

  if (loading) {
    return (
      <ThemedScreen tone="night" contentClassName="justify-center px-5">
        <ThemePanel tone="night" className="items-center gap-4 px-5 py-6">
          <ActivityIndicator size="large" color={APP_THEME.night.primary} />
          <Text className="text-sm text-slate-300">Oturum yetkisi doğrulanıyor...</Text>
        </ThemePanel>
      </ThemedScreen>
    );
  }

  if (authError) {
    return (
      <ThemedScreen tone="night" contentClassName="justify-center px-5">
        <ThemePanel tone="night" className="gap-3 px-5 py-6">
          <ThemeChip tone="night" accent="danger" className="self-start">
            <ThemeChipText tone="night" accent="danger">Yetki Yok</ThemeChipText>
          </ThemeChip>
          <Text className="text-lg font-semibold text-white">Bu host oturumuna erişemezsin.</Text>
          <Text className="text-sm leading-6 text-slate-300">
            Yalnızca bu oyunu başlatan kullanıcı canlı host paneline girebilir.
          </Text>
        </ThemePanel>
      </ThemedScreen>
    );
  }

  if (!meta) return null;

  return <HostContent gameSessionId={gameSessionId} meta={meta} />;
}
