import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getLobbyParticipants } from '../lobbyService';
import type { Database } from '@/lib/supabase/database.types';

type Participant = Database['public']['Tables']['participants']['Row'];

const POLL_INTERVAL_MS = 2000;

export function useLobbySubscription(gameSessionId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const activeRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getLobbyParticipants(gameSessionId);
      if (activeRef.current) setParticipants(data);
    } catch {
      // sessizce geç
    }
  }, [gameSessionId]);

  useEffect(() => {
    activeRef.current = true;
    setLoading(true);

    // İlk yükleme
    getLobbyParticipants(gameSessionId)
      .then((data) => {
        if (activeRef.current) {
          setParticipants(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (activeRef.current) setLoading(false);
      });

    // Realtime subscription — açıksa anlık güncelleme sağlar
    const channel = supabase
      .channel(`lobby:${gameSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `game_session_id=eq.${gameSessionId}`,
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    // Polling fallback — realtime publication kapalı olsa bile lobi canlı kalır
    const interval = setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      activeRef.current = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [gameSessionId, refresh]);

  return { participants, loading, refresh };
}
