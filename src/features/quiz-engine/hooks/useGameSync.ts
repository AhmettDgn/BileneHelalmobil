import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface GameSyncState {
  currentQuestionIndex: number;
  gameStatus: 'waiting' | 'in_progress' | 'completed';
  currentPhase: 'question' | 'intermission' | null;
  activeQuestionId: string | null;
  phaseStartedAt: string | null;
  phaseEndsAt: string | null;
  totalQuestions: number;
  hasNextQuestion: boolean;
}

interface GameSyncRow {
  current_question_index: number | null;
  game_status: 'waiting' | 'in_progress' | 'completed' | null;
  current_phase: 'question' | 'intermission' | null;
  active_question_id: string | null;
  phase_started_at: string | null;
  phase_ends_at: string | null;
  total_questions: number | null;
  has_next_question: boolean | null;
}

const POLL_INTERVAL_MS = 1000;

export function useGameSync(gameSessionId: string, participantId?: string) {
  const [state, setState] = useState<GameSyncState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sync = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_game_session_sync', {
        p_game_session_id: gameSessionId,
        p_participant_id: participantId ?? null,
      });
      if (rpcError) throw rpcError;

      // get_game_session_sync RETURNS TABLE → supabase-js dizi döndürür
      const row = (data as unknown as GameSyncRow[] | null)?.[0];
      if (!row) return; // satır yoksa önceki state korunur ("Oyun Bitti!" göstermez)

      setState({
        currentQuestionIndex: row.current_question_index ?? 0,
        gameStatus: row.game_status ?? 'waiting',
        currentPhase: row.current_phase ?? 'question',
        activeQuestionId: row.active_question_id ?? null,
        phaseStartedAt: row.phase_started_at ?? null,
        phaseEndsAt: row.phase_ends_at ?? null,
        totalQuestions: row.total_questions ?? 0,
        hasNextQuestion: row.has_next_question ?? false,
      });
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Senkronizasyon hatası');
    }
  }, [gameSessionId, participantId]);

  useEffect(() => {
    sync();
    intervalRef.current = setInterval(sync, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sync]);

  return { state, error, refresh: sync };
}
