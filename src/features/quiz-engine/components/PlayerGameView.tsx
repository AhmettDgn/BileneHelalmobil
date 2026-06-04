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
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';

const JOKERS = [
  {
    name: 'Melek Kanadı 👼',
    type: 'good',
    desc: 'Doğru bilirsen iki kat puan, bilmezsen kanatların kırılır!',
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-500',
  },
  {
    name: 'Ters Yazı 🔄',
    type: 'bad',
    desc: 'Sorunun harfleri tersine döndü! Tersten okuyup anlayabilecek misin?',
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'text-rose-500',
  },
  {
    name: 'Çifte Şans 🎭',
    type: 'good',
    desc: 'İki seçeneğe birden basabilirsin! Çift dikiş, sağlam iş.',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-500',
  },
  {
    name: 'Çamur At 💩',
    type: 'bad',
    desc: 'Ekranına çamur sıçradı, seçenekler hâlâ okunuyor ama dikkat et!',
    bg: 'bg-amber-800/10 border-amber-800/20',
    text: 'text-amber-600',
  },
  {
    name: 'Zaman Kilidi ⏰',
    type: 'special',
    desc: 'Rakiplerinin zamanını dondurdun! 5 saniye boyunca sadece sen cevap verebilirsin!',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    text: 'text-cyan-500',
  },
];

interface Props {
  gameSessionId: string;
  participantId: string;
  syncState: GameSyncState;
  gamePin: string;
  onLeave: () => void;
}

export function PlayerGameView({ gameSessionId, participantId, syncState, gamePin, onLeave }: Props) {
  const [gameState, setGameState] = useState<PlayableGameState | null>(null);
  const [funMode, setFunMode] = useState(false);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const [lockedIndex2, setLockedIndex2] = useState<number | null>(null);
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
      setFunMode(data.fun_mode ?? false);

      // Fetch other participant IDs for Zaman Kilidi
      const { data: participantsData, error } = await supabase.rpc('get_lobby_participants', {
        p_game_session_id: gameSessionId,
      });
      if (participantsData && !error) {
        setParticipantIds((participantsData as any[]).map((p) => p.id));
      }
    } catch {
      // Sessizce geç.
    }
  }, [gameSessionId, participantId]);

  useEffect(() => {
    if (syncState.activeQuestionId && syncState.activeQuestionId !== lastQuestionId.current) {
      lastQuestionId.current = syncState.activeQuestionId;
      setLockedIndex(null);
      setLockedIndex2(null);
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
      setLockedIndex2(existing.selected_option_index_2 ?? null);
    }
  }, [gameState, syncState.activeQuestionId]);

  // Hashing and Joker Selection logic
  const myJokerIndex = funMode && activeQuestion
    ? (() => {
        const str = (participantId + activeQuestion.id).toLowerCase();
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash * 33) + str.charCodeAt(i)) >>> 0;
        }
        return hash % 5;
      })()
    : -1;

  const anyoneHasTimeLock = funMode && activeQuestion
    ? participantIds.some((id) => {
        const str = (id + activeQuestion.id).toLowerCase();
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash * 33) + str.charCodeAt(i)) >>> 0;
        }
        return (hash % 5) === 4;
      })
    : false;

  const iHaveTimeLock = myJokerIndex === 4;

  const [timeLockRemaining, setTimeLockRemaining] = useState(0);

  useEffect(() => {
    if (syncState.currentPhase !== 'question' || !anyoneHasTimeLock || iHaveTimeLock || !syncState.phaseStartedAt) {
      setTimeLockRemaining(0);
      return;
    }

    const calculateRemaining = () => {
      const elapsed = Date.now() - new Date(syncState.phaseStartedAt!).getTime();
      const remaining = Math.max(0, 5000 - elapsed);
      return Math.ceil(remaining / 1000);
    };

    const initialRemaining = calculateRemaining();
    setTimeLockRemaining(initialRemaining);

    if (initialRemaining <= 0) return;

    const interval = setInterval(() => {
      const rem = calculateRemaining();
      setTimeLockRemaining(rem);
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [syncState.phaseStartedAt, anyoneHasTimeLock, iHaveTimeLock, syncState.currentPhase]);

  async function handleSelect(optionIndex: number, optionIndex2: number | null = null) {
    if (!syncState.activeQuestionId || lockedIndex !== null || timeLockRemaining > 0) return;
    setSubmitting(true);
    setLockedIndex(optionIndex);
    setLockedIndex2(optionIndex2);
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
        responseTimeMs,
        optionIndex2
      );
    } catch {
      setLockedIndex(null);
      setLockedIndex2(null);
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

        {funMode && activeQuestion && JOKERS[myJokerIndex] ? (
          <ThemePanel tone="night" variant="soft" className={cn("gap-2 px-5 py-4 border", JOKERS[myJokerIndex].bg)}>
            <View className="flex-row items-center justify-between">
              <Text className={cn("font-bold text-base", JOKERS[myJokerIndex].text)}>
                Joker: {JOKERS[myJokerIndex].name}
              </Text>
              <ThemeChip tone="night" accent={JOKERS[myJokerIndex].type === 'good' ? 'primary' : 'secondary'}>
                <ThemeChipText tone="night" accent={JOKERS[myJokerIndex].type === 'good' ? 'primary' : 'secondary'}>
                  {JOKERS[myJokerIndex].type === 'good' ? 'Avantaj' : JOKERS[myJokerIndex].type === 'bad' ? 'Dezavantaj' : 'Özel'}
                </ThemeChipText>
              </ThemeChip>
            </View>
            <Text className="text-sm leading-5 text-slate-300">{JOKERS[myJokerIndex].desc}</Text>
          </ThemePanel>
        ) : null}

        <ThemePanel tone="night" className="gap-4 px-5 py-5 relative" style={{ overflow: 'hidden' }}>
          {timeLockRemaining > 0 ? (
            <View className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 rounded-[24px] p-5">
              <Text className="text-5xl mb-2">❄️</Text>
              <Text className="text-lg font-bold text-accent-cyan tracking-wide uppercase">Zaman Donduruldu!</Text>
              <Text className="text-xs text-center text-slate-400 mt-1">
                Rakiplerinden biri Zaman Kilidi jokerini kullandı! Butonların {timeLockRemaining} saniye boyunca kilitli kalacak.
              </Text>
            </View>
          ) : null}

          <ThemeChip tone="night" accent="secondary" className="self-start">
            <ThemeChipText tone="night" accent="secondary">
              Soru Metni
            </ThemeChipText>
          </ThemeChip>
          <Text className="text-2xl font-bold leading-8 text-white">
            {myJokerIndex === 1 ? activeQuestion.text.split('').reverse().join('') : activeQuestion.text}
          </Text>
          <AnswerOptions
            options={activeQuestion.options}
            lockedIndex={lockedIndex}
            lockedIndex2={lockedIndex2}
            submitting={submitting}
            isExpired={isExpired}
            onSelect={handleSelect}
            isDoubleChance={myJokerIndex === 2}
            isMudAt={myJokerIndex === 3}
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
