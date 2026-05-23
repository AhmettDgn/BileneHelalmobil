import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import type { GameSyncState } from '../hooks/useGameSync';
import { useQuestionTimer } from '../hooks/useQuestionTimer';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useQuestionResults } from '../hooks/useQuestionResults';
import { useIntermissionStage } from '../hooks/useIntermissionStage';
import {
  getPlayableGameState,
  submitAnswer,
  type PlayableGameState,
  type ParticipantAnswer,
} from '../gameService';
import { TimerBar } from './TimerBar';
import { AnswerOptions } from './AnswerOptions';
import { QuestionResultsView } from './QuestionResultsView';
import { LeaderboardView } from '@/features/stats/components/LeaderboardView';
import { ThemedScreen } from '@/components/ui/ThemedScreen';
import { ThemeChip, ThemeChipText, ThemePanel } from '@/components/ui/ThemePanel';
import { APP_THEME } from '@/theme/app-theme';

interface Props {
  gameSessionId: string;
  participantId: string;
  syncState: GameSyncState;
}

export function PlayerGameView({ gameSessionId, participantId, syncState }: Props) {
  const [gameState, setGameState] = useState<PlayableGameState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const lastQuestionId = useRef<string | null>(null);

  const leaderboard = useLeaderboard(
    gameSessionId,
    syncState.currentPhase === 'intermission' ? participantId : undefined
  );

  const activeQuestion =
    gameState?.questions.find((q) => q.id === syncState.activeQuestionId) ?? null;

  const { progress, remainingMs, isExpired } = useQuestionTimer(
    syncState.currentPhase === 'question' ? syncState.phaseEndsAt : null,
    activeQuestion?.time_limit_seconds ?? 20
  );

  const intermissionStage = useIntermissionStage(syncState.phaseStartedAt);
  const { results: questionResults } = useQuestionResults(
    gameSessionId,
    syncState.activeQuestionId,
    syncState.currentPhase === 'intermission'
  );

  const loadGameState = useCallback(async () => {
    try {
      const data = await getPlayableGameState(gameSessionId, participantId);
      setGameState(data);
    } catch {
      // Sessizce geç.
    }
  }, [gameSessionId, participantId]);

  useEffect(() => {
    if (syncState.activeQuestionId && syncState.activeQuestionId !== lastQuestionId.current) {
      lastQuestionId.current = syncState.activeQuestionId;
      setLockedIndex(null);
      loadGameState();
    }
  }, [syncState.activeQuestionId, loadGameState]);

  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  useEffect(() => {
    if (!gameState || !syncState.activeQuestionId) return;
    const existing: ParticipantAnswer | undefined = gameState.participant_answers.find(
      (a) => a.question_id === syncState.activeQuestionId
    );
    if (existing) {
      setLockedIndex(existing.selected_option_index);
    }
  }, [gameState, syncState.activeQuestionId]);

  async function handleSelect(optionIndex: number) {
    if (!syncState.activeQuestionId || lockedIndex !== null) return;
    setSubmitting(true);
    setLockedIndex(optionIndex);
    try {
      const responseTimeMs = syncState.phaseEndsAt && activeQuestion
        ? Math.max(
            0,
            activeQuestion.time_limit_seconds * 1000 -
              Math.max(0, new Date(syncState.phaseEndsAt).getTime() - Date.now())
          )
        : 0;
      await submitAnswer(
        gameSessionId,
        participantId,
        syncState.activeQuestionId,
        optionIndex,
        responseTimeMs
      );
    } catch {
      setLockedIndex(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (syncState.currentPhase === 'intermission') {
    return (
      <ThemedScreen tone="night">
        <View className="flex-1 px-5 py-4 gap-4">
          {intermissionStage === 'reveal' ? (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 12 }}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <QuestionResultsView
                question={
                  activeQuestion
                    ? { text: activeQuestion.text, options: activeQuestion.options }
                    : null
                }
                results={questionResults}
                myAnswerIndex={lockedIndex}
              />
            </ScrollView>
          ) : (
            <>
              <ThemePanel tone="night" variant="hero" className="gap-3 px-5 py-5">
                <ThemeChip tone="night" accent="secondary" className="self-start">
                  <ThemeChipText tone="night" accent="secondary">
                    Soru Arası
                  </ThemeChipText>
                </ThemeChip>
                <Text className="text-2xl font-bold text-white">
                  Soru {syncState.currentQuestionIndex + 1} / {syncState.totalQuestions} tamamlandı
                </Text>
                <Text className="text-sm leading-6 text-slate-300">
                  Sıralama güncellendi. Host sonraki soruya geçtiğinde yeni tur otomatik açılacak.
                </Text>
              </ThemePanel>

              <LeaderboardView
                entries={leaderboard}
                myParticipantId={participantId}
                title="Ara Sıralama"
              />
            </>
          )}
        </View>
      </ThemedScreen>
    );
  }

  if (!gameState || !activeQuestion) {
    return (
      <ThemedScreen tone="night" contentClassName="justify-center px-5">
        <ThemePanel tone="night" className="items-center gap-4 px-5 py-6">
          <ActivityIndicator size="large" color={APP_THEME.night.primary} />
          <Text className="text-sm text-slate-300">Soru verisi yükleniyor...</Text>
        </ThemePanel>
      </ThemedScreen>
    );
  }

  return (
    <ThemedScreen tone="night">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, gap: 14 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ThemePanel tone="night" variant="hero" className="gap-4 px-5 py-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-slate-400">
                Canlı Soru
              </Text>
              <Text className="mt-2 text-2xl font-bold text-white">{gameState.quiz_title}</Text>
            </View>
            <ThemeChip tone="night" accent="primary">
              <ThemeChipText tone="night" accent="primary">
                {syncState.currentQuestionIndex + 1} / {syncState.totalQuestions}
              </ThemeChipText>
            </ThemeChip>
          </View>

          <TimerBar progress={progress} remainingMs={remainingMs} />
        </ThemePanel>

        <ThemePanel tone="night" className="gap-4 px-5 py-5">
          <ThemeChip tone="night" accent="secondary" className="self-start">
            <ThemeChipText tone="night" accent="secondary">
              Soru Metni
            </ThemeChipText>
          </ThemeChip>
          <Text className="text-2xl font-bold leading-8 text-white">{activeQuestion.text}</Text>
          <AnswerOptions
            options={activeQuestion.options}
            lockedIndex={lockedIndex}
            submitting={submitting}
            isExpired={isExpired}
            onSelect={handleSelect}
          />
        </ThemePanel>

        {lockedIndex !== null && !submitting ? (
          <ThemePanel tone="night" variant="soft" className="px-5 py-4">
            <Text className="text-sm font-semibold text-accent-cyan">Cevabın kilitlendi.</Text>
            <Text className="mt-1 text-sm leading-6 text-slate-300">
              Sonuçlar paylaşılana kadar bu seçim korunacak.
            </Text>
          </ThemePanel>
        ) : null}

        {isExpired && lockedIndex === null ? (
          <ThemePanel tone="night" variant="soft" className="px-5 py-4">
            <Text className="text-sm font-semibold text-state-danger">Süre doldu.</Text>
            <Text className="mt-1 text-sm leading-6 text-slate-300">
              Host sıradaki aşamaya geçtiğinde güncel ekran otomatik açılacak.
            </Text>
          </ThemePanel>
        ) : null}
      </ScrollView>
    </ThemedScreen>
  );
}
