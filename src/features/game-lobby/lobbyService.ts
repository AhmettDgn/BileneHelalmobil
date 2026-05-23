import { supabase } from '@/lib/supabase/client';
import { savePlayerSession } from '@/lib/player-session';
import type { Database } from '@/lib/supabase/database.types';

type Participant = Database['public']['Tables']['participants']['Row'];
type GameSession = Database['public']['Tables']['game_sessions']['Row'];

export interface JoinResult {
  participantId: string;
  gameSessionId: string;
  displayName: string;
}

export async function joinGame(gamePin: string, displayName?: string): Promise<JoinResult> {
  const { data, error } = await supabase.rpc('join_game_session', {
    p_game_pin: gamePin,
    p_display_name: displayName ?? null,
  });
  if (error) throw error;

  const result = data as unknown as {
    participant: Participant;
    game_session: GameSession;
  } | null;

  if (!result?.participant || !result?.game_session) {
    throw new Error('Oyuna katılma başarısız: beklenmeyen yanıt');
  }

  const session = {
    participantId: result.participant.id,
    gameSessionId: result.game_session.id,
    displayName: result.participant.display_name,
    isAuthenticated: !!result.participant.user_id,
  };

  await savePlayerSession(gamePin, session);

  return {
    participantId: result.participant.id,
    gameSessionId: result.game_session.id,
    displayName: result.participant.display_name,
  };
}

export async function getLobbyParticipants(gameSessionId: string): Promise<Participant[]> {
  const { data, error } = await supabase.rpc('get_lobby_participants', {
    p_game_session_id: gameSessionId,
  });
  if (error) throw error;
  return (data ?? []) as Participant[];
}

export async function updateDisplayName(
  participantId: string,
  displayName: string
): Promise<void> {
  const { error } = await supabase.rpc('update_participant_name', {
    p_participant_id: participantId,
    p_display_name: displayName,
  });
  if (error) throw error;
}
