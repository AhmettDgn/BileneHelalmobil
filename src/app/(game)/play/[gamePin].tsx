import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { loadPlayerSession } from '@/lib/player-session';
import type { PlayerSession } from '@/lib/player-session';
import { useGameSync } from '@/features/quiz-engine/hooks/useGameSync';
import { useLeaderboard } from '@/features/quiz-engine/hooks/useLeaderboard';
import { PlayerLobbyView } from '@/features/game-lobby/components/PlayerLobbyView';
import { PlayerGameView } from '@/features/quiz-engine/components/PlayerGameView';
import { LeaderboardView } from '@/features/stats/components/LeaderboardView';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

function GameContent({ session, gamePin }: { session: PlayerSession; gamePin: string }) {
  const { state, error } = useGameSync(session.gameSessionId, session.participantId);
  const finalLeaderboard = useLeaderboard(
    session.gameSessionId,
    state?.gameStatus === 'completed' ? session.participantId : undefined
  );

  const handleLeaveGame = () => {
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
              const { supabase } = await import('@/lib/supabase/client');
              const { clearPlayerSession } = await import('@/lib/player-session');
              await supabase.from('participants').delete().eq('id', session.participantId);
              await clearPlayerSession(gamePin);
              router.replace('/');
            } catch {
              const { clearPlayerSession } = await import('@/lib/player-session');
              await clearPlayerSession(gamePin);
              router.replace('/');
            }
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <ThemedScreen tone="night" contentClassName="justify-center px-5">
        <ThemePanel tone="night" className="gap-3 px-5 py-6">
          <ThemeChip tone="night" accent="danger" className="self-start">
            <ThemeChipText tone="night" accent="danger">Bağlantı Hatası</ThemeChipText>
          </ThemeChip>
          <Text className="text-lg font-semibold text-white">Oyun akışı okunamadı.</Text>
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
          <Text className="text-sm text-slate-300">Oyun durumu hazırlanıyor...</Text>
        </ThemePanel>
      </ThemedScreen>
    );
  }

  if (state.gameStatus === 'waiting') {
    return (
      <PlayerLobbyView
        gameSessionId={session.gameSessionId}
        gamePin={gamePin}
        participantId={session.participantId}
        displayName={session.displayName}
      />
    );
  }

  if (state.gameStatus === 'in_progress') {
    return (
      <PlayerGameView
        gameSessionId={session.gameSessionId}
        participantId={session.participantId}
        syncState={state}
        gamePin={gamePin}
        onLeave={handleLeaveGame}
      />
    );
  }

  return (
    <ThemedScreen tone="night">
      <View className="flex-1 px-5 py-4 gap-4">
        <ThemePanel tone="night" variant="hero" className="gap-3 px-5 py-5">
          <View className="flex-row items-center justify-between">
            <ThemeChip tone="night" accent="secondary" className="self-start">
              <ThemeChipText tone="night" accent="secondary">Final</ThemeChipText>
            </ThemeChip>
            <TouchableOpacity onPress={handleLeaveGame}>
              <Text className="text-sm font-semibold text-state-danger">Yarışmadan Ayrıl</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-white">Oyun Bitti</Text>
          <Text className="text-sm leading-6 text-slate-300">
            Final sıralaması hazır. Bu oturum için son puanlar aşağıda listeleniyor.
          </Text>
        </ThemePanel>

        <LeaderboardView
          entries={finalLeaderboard}
          myParticipantId={session.participantId}
          title="Final Sıralaması"
        />
      </View>
    </ThemedScreen>
  );
}

export default function PlayScreen() {
  const { gamePin } = useLocalSearchParams<{ gamePin: string }>();
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayerSession(gamePin).then((s) => {
      if (!s) {
        router.replace('/');
        return;
      }
      setSession(s);
      setLoading(false);
    });
  }, [gamePin]);

  if (loading) {
    return (
      <ThemedScreen tone="night" contentClassName="justify-center px-5">
        <ThemePanel tone="night" className="items-center gap-4 px-5 py-6">
          <ActivityIndicator size="large" color={APP_THEME.night.primary} />
          <Text className="text-sm text-slate-300">Katılım oturumu doğrulanıyor...</Text>
        </ThemePanel>
      </ThemedScreen>
    );
  }

  if (!session) return null;

  return <GameContent session={session} gamePin={gamePin} />;
}
