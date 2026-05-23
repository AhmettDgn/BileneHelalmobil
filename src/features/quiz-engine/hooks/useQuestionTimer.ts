import { useEffect, useState } from 'react';

interface TimerState {
  remainingMs: number;
  progress: number; // 0..1, 1 = tam dolu, 0 = bitti
  isExpired: boolean;
}

export function useQuestionTimer(phaseEndsAt: string | null, timeLimitSeconds: number): TimerState {
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!phaseEndsAt) {
      setRemainingMs(0);
      return;
    }

    const tick = () => {
      const ms = new Date(phaseEndsAt).getTime() - Date.now();
      setRemainingMs(Math.max(0, ms));
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phaseEndsAt]);

  const totalMs = timeLimitSeconds * 1000;
  const progress = totalMs > 0 ? Math.min(1, remainingMs / totalMs) : 0;

  return {
    remainingMs,
    progress,
    isExpired: remainingMs <= 0,
  };
}
