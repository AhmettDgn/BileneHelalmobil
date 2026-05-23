import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import type { GameSyncState } from '../hooks/useGameSync';
import { useQuestionTimer } from '../hooks/useQuestionTimer';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useQuestionResults } from '../hooks/useQuestionResults';
import { useIntermissionStage } from '../hooks/useIntermissionStage';
import {
  getPlayableGameState,
  endCurrentQuestion,
  startNextQuestion,
  finishGame,
  type PlayableGameState,
} from '../gameService';
import { TimerBar } from './TimerBar';
import { QuestionResultsView } from './QuestionResultsView';
import { LeaderboardView } from '@/features/stats/components/LeaderboardView';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';
import { cn } from '@/lib/cn';

const OPTION_STYLES = [
  { label: 'A', border: 'border-accent-cyan/25', bg: 'bg-accent-cyan/10', text: 'text-accent-cyan' },
  { label: 'B', border: 'border-accent-fuchsia/25', bg: 'bg-accent-fuchsia/10', text: 'text-accent-fuchsia' },
  { label: 'C', border: 'border-white/[0.12]', bg: 'bg-white/5', text: 'text-slate-200' },
  { label: 'D', border: 'border-blue-300/20', bg: 'bg-blue-400/10', text: 'text-blue-200' },
];

interface Props {
  gameSessionId: string;
  hostId: string;
  syncState: GameSyncState;
}

export function HostGameView({ gameSessionId, syncState }: Props) {
  const [gameState, setGameState] = useState<PlayableGameState | null>(null);
  const [acting, setActing] = useState(false);

  const leaderboard = useLeaderboard(gameSessionId);

  const activeQuestion =
    gameState?.questions.find((q) => q.id === syncState.activeQuestionId) ?? null;

  const { progress, remainingMs } = useQuestionTimer(
    syncState.currentPhase === 'question' ? syncState.phaseEndsAt : null,
    activeQuestion?.time_limit_seconds ?? 20
  );

  const intermissionStage = useIntermissionStage(syncState.phaseStartedAt);
  const { results: questionResults } = useQuestionResults(
    gameSessionId,
    syncState.activeQuestionId,
    syncState.currentPhase === 'intermission'
  );

  useEffect(() => {
    getPlayableGameState(gameSessionId)
      .then(setGameState)
      .catch(() => {});
  }, [gameSessionId, syncState.activeQuestionId]);

  async function handleAction() {
    setActing(true);
    try {
      if (syncState.currentPhase === 'question') {
        await endCurrentQuestion(gameSessionId);
      } else if (syncState.hasNextQuestion) {
        await startNextQuestion(gameSessionId);
      } else {
        Alert.alert('Oyunu Bitir', 'Tüm sorular tamamlandı. Oyunu bitirmek istediğine emin misin?', [
          { text: 'İptal', style: 'cancel', onPress: () => setActing(false) },
          {
            text: 'Bitir',
            style: 'destructive',
            onPress: async () => {
              try {
                await finishGame(gameSessionId);
              } catch (e: any) {
                Alert.alert('Hata', e.message);
              } finally {
                setActing(false);
              }
            },
          },
        ]);
        return;
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    } finally {
      if (syncState.currentPhase !== 'intermission' || syncState.hasNextQuestion) {
        setActing(false);
      }
    }
  }

  function actionLabel() {
    if (syncState.currentPhase === 'question') return 'Soruyu Bitir';
    if (syncState.hasNextQuestion) return 'Sonraki Soru';
    return 'Oyunu Bitir';
  }

  function actionClassName() {
    if (syncState.currentPhase === 'question') return 'bg-accent-cyan';
    if (syncState.hasNextQuestion) return 'bg-accent-cyan';
    return 'bg-state-danger';
  }

  function actionTextClassName() {
    if (syncState.currentPhase === 'question' || syncState.hasNextQuestion) {
      return 'text-surface-night';
    }
    return 'text-white';
  }

  return (
    <ThemedScreen tone="night">
      <View className="flex-1 px-5 py-4">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 140, gap: 14 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <ThemePanel tone="night" variant="hero" className="gap-4 px-5 py-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-slate-400">
                  Host Kontrolü
                </Text>
                <Text className="mt-2 text-2xl font-bold text-white">
                  Soru {syncState.currentQuestionIndex + 1} / {syncState.totalQuestions}
                </Text>
              </View>
              <ThemeChip tone="night" accent={syncState.currentPhase === 'question' ? 'primary' : 'secondary'}>
                <ThemeChipText tone="night" accent={syncState.currentPhase === 'question' ? 'primary' : 'secondary'}>
                  {syncState.currentPhase === 'question' ? 'Canlı tur' : 'Ara ekran'}
                </ThemeChipText>
              </ThemeChip>
            </View>

            {syncState.currentPhase === 'question' ? (
              <TimerBar progress={progress} remainingMs={remainingMs} />
            ) : null}
          </ThemePanel>

          {syncState.currentPhase === 'question' ? (
            activeQuestion ? (
              <ThemePanel tone="night" className="gap-4 px-5 py-5">
                <ThemeChip tone="night" accent="secondary" className="self-start">
                  <ThemeChipText tone="night" accent="secondary">
                    Aktif Soru
                  </ThemeChipText>
                </ThemeChip>

                <Text className="text-2xl font-bold leading-8 text-white">{activeQuestion.text}</Text>

                <View className="gap-3">
                  {activeQuestion.options.map((opt, i) => {
                    const option = OPTION_STYLES[i % OPTION_STYLES.length];
                    return (
                      <View
                        key={i}
                        className={cn(
                          'rounded-[22px] border px-4 py-4 flex-row items-center gap-4',
                          option.border,
                          option.bg
                        )}
                      >
                        <View className="h-10 w-10 rounded-full bg-white/5 items-center justify-center">
                          <Text className={cn('text-sm font-bold', option.text)}>{option.label}</Text>
                        </View>
                        <Text className="flex-1 text-base font-semibold text-white" numberOfLines={3}>
                          {opt}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ThemePanel>
            ) : (
              <ThemePanel tone="night" className="items-center gap-4 px-5 py-6">
                <ActivityIndicator color={APP_THEME.night.primary} />
                <Text className="text-sm text-slate-300">Soru bilgisi hazırlanıyor...</Text>
              </ThemePanel>
            )
          ) : intermissionStage === 'reveal' ? (
            <QuestionResultsView
              question={
                activeQuestion
                  ? { text: activeQuestion.text, options: activeQuestion.options }
                  : null
              }
              results={questionResults}
            />
          ) : (
            <>
              <ThemePanel tone="night" variant="hero" className="gap-3 px-5 py-5">
                <ThemeChip tone="night" accent="secondary" className="self-start">
                  <ThemeChipText tone="night" accent="secondary">
                    Geçiş Ekranı
                  </ThemeChipText>
                </ThemeChip>
                <Text className="text-2xl font-bold text-white">
                  {syncState.currentQuestionIndex + 1}. soru tamamlandı
                </Text>
                <Text className="text-sm leading-6 text-slate-300">
                  Skor tablosu oyunculara gösterildi. Hazır olduğunda sonraki soruya geçebilirsin.
                </Text>
              </ThemePanel>

              <LeaderboardView
                entries={leaderboard}
                title={`Soru ${syncState.currentQuestionIndex + 1} sonrası`}
              />
            </>
          )}
        </ScrollView>

        <View className="absolute bottom-4 left-5 right-5">
          <ThemePanel tone="night" variant="hero" className="px-4 py-4">
            <TouchableOpacity
              onPress={handleAction}
              disabled={acting}
              className={cn('rounded-[22px] py-4 items-center', actionClassName())}
            >
              {acting ? (
                <ActivityIndicator color={APP_THEME.night.root} />
              ) : (
                <Text className={cn('text-base font-semibold', actionTextClassName())}>
                  {actionLabel()}
                </Text>
              )}
            </TouchableOpacity>
          </ThemePanel>
        </View>
      </View>
    </ThemedScreen>
  );
}
