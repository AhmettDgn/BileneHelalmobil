import { useEffect, useState } from 'react';

export type IntermissionStage = 'reveal' | 'leaderboard';

export const REVEAL_MS = 5000;

/**
 * Intermission içinde reveal → leaderboard geçişini phase_started_at çapasıyla yönetir.
 * Tüm cihazlar aynı phase_started_at'i okuduğu için senkron kalır; geç katılan
 * (elapsed ≥ REVEAL_MS) doğrudan leaderboard görür.
 */
export function useIntermissionStage(
  phaseStartedAt: string | null,
  revealMs: number = REVEAL_MS
): IntermissionStage {
  const computeStage = (): IntermissionStage => {
    if (!phaseStartedAt) return 'reveal';
    const elapsed = Date.now() - new Date(phaseStartedAt).getTime();
    return elapsed < revealMs ? 'reveal' : 'leaderboard';
  };

  const [stage, setStage] = useState<IntermissionStage>(computeStage);

  useEffect(() => {
    const initial = computeStage();
    setStage(initial);
    if (initial === 'leaderboard' || !phaseStartedAt) return;

    const elapsed = Date.now() - new Date(phaseStartedAt).getTime();
    const remaining = Math.max(0, revealMs - elapsed);
    const timer = setTimeout(() => setStage('leaderboard'), remaining);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseStartedAt, revealMs]);

  return stage;
}
