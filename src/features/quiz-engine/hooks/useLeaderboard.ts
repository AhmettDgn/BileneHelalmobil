import { useCallback, useEffect, useRef, useState } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '../gameService';

const POLL_INTERVAL_MS = 1500;

export function useLeaderboard(gameSessionId: string, participantId?: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await getLeaderboard(gameSessionId, participantId, 10);
      setEntries(data);
    } catch {
      // sessizce geç — polling devam eder
    }
  }, [gameSessionId, participantId]);

  useEffect(() => {
    fetch();
    intervalRef.current = setInterval(fetch, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch]);

  return entries;
}
