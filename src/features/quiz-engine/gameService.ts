import { supabase } from '@/lib/supabase/client';

export interface PlayableQuestion {
  id: string;
  order: number;
  text: string;
  options: string[];
  time_limit_seconds: number;
  points: number;
}

export interface ParticipantAnswer {
  question_id: string;
  selected_option_index: number;
  selected_option_index_2?: number | null;
  is_correct: boolean;
  points_earned: number;
}

export interface PlayableGameState {
  quiz_title: string;
  fun_mode?: boolean;
  active_question_id: string | null;
  questions: PlayableQuestion[];
  participant_answers: ParticipantAnswer[];
}

export interface SubmitResult {
  accepted: boolean;
  already_answered: boolean;
  locked_option_index: number | null;
  points_earned: number;
}

export interface LeaderboardEntry {
  participant_id: string;
  display_name: string;
  total_score: number;
  correct_answers: number;
}

export interface CorrectAnswerer {
  participant_id: string;
  display_name: string;
  response_time_ms: number;
  points_earned: number;
}

export interface QuestionResults {
  question_id: string;
  correct_option_index: number;
  total_answers: number;
  correct_count: number;
  correct_answerers: CorrectAnswerer[];
}

export async function getPlayableGameState(
  gameSessionId: string,
  participantId?: string
): Promise<PlayableGameState> {
  const { data, error } = await supabase.rpc('get_playable_game_state', {
    p_game_session_id: gameSessionId,
    p_participant_id: participantId,
  });
  if (error) throw error;
  return data as unknown as PlayableGameState;
}

export async function submitAnswer(
  gameSessionId: string,
  participantId: string,
  questionId: string,
  selectedOptionIndex: number,
  responseTimeMs: number,
  selectedOptionIndex2: number | null = null
): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc('submit_player_answer', {
    p_game_session_id: gameSessionId,
    p_participant_id: participantId,
    p_question_id: questionId,
    p_selected_option_index: selectedOptionIndex,
    p_response_time_ms: Math.max(0, Math.round(responseTimeMs)),
    p_selected_option_index_2: selectedOptionIndex2,
  });
  if (error) throw error;
  // submit_player_answer RETURNS TABLE → supabase-js dizi döndürür
  return (data as unknown as SubmitResult[])?.[0];
}

export async function getQuestionResults(
  gameSessionId: string,
  questionId: string
): Promise<QuestionResults> {
  const { data, error } = await supabase.rpc('get_question_results', {
    p_game_session_id: gameSessionId,
    p_question_id: questionId,
  });
  if (error) throw error;
  // get_question_results RETURNS jsonb → tek obje
  return data as unknown as QuestionResults;
}

export async function getLeaderboard(
  gameSessionId: string,
  participantId?: string,
  limit = 10
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard_entries', {
    p_game_session_id: gameSessionId,
    p_participant_id: participantId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as unknown as LeaderboardEntry[];
}

// Host kontrol fonksiyonları
// Not: Web projesinde bunlar RPC değil, doğrudan game_sessions UPDATE'i ile yapılır.
// Burada host'un auth'lu oturumuyla aynı alan güncellemeleri birebir uygulanır.

async function getOrderedQuestions(quizId: string) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, time_limit_seconds')
    .eq('quiz_id', quizId)
    .order('order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function phaseEndsAtIso(timeLimitSeconds: number): string {
  return new Date(Date.now() + timeLimitSeconds * 1000).toISOString();
}

export async function startGameSession(gameSessionId: string): Promise<void> {
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('quiz_id')
    .eq('id', gameSessionId)
    .single();
  if (sessionError) throw sessionError;

  const questions = await getOrderedQuestions(session.quiz_id);
  const firstQuestion = questions[0];
  if (!firstQuestion) throw new Error('Quizde soru bulunamadı');

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('game_sessions')
    .update({
      status: 'in_progress',
      current_phase: 'question',
      active_question_id: firstQuestion.id,
      started_at: nowIso,
      phase_started_at: nowIso,
      phase_ends_at: phaseEndsAtIso(firstQuestion.time_limit_seconds),
      current_question_index: 0,
      ended_at: null,
    })
    .eq('id', gameSessionId);
  if (error) throw error;
}

export async function endCurrentQuestion(gameSessionId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('game_sessions')
    .update({
      current_phase: 'intermission',
      phase_started_at: nowIso,
      phase_ends_at: null,
    })
    .eq('id', gameSessionId);
  if (error) throw error;
}

export async function startNextQuestion(gameSessionId: string): Promise<void> {
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select('quiz_id, current_question_index')
    .eq('id', gameSessionId)
    .single();
  if (sessionError) throw sessionError;

  const questions = await getOrderedQuestions(session.quiz_id);
  const nextIndex = session.current_question_index + 1;
  const nextQuestion = questions[nextIndex];

  if (!nextQuestion) {
    await finishGame(gameSessionId);
    return;
  }

  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('game_sessions')
    .update({
      current_question_index: nextIndex,
      current_phase: 'question',
      active_question_id: nextQuestion.id,
      status: 'in_progress',
      phase_started_at: nowIso,
      phase_ends_at: phaseEndsAtIso(nextQuestion.time_limit_seconds),
      ended_at: null,
    })
    .eq('id', gameSessionId);
  if (error) throw error;
}

export async function finishGame(gameSessionId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from('game_sessions')
    .update({
      status: 'completed',
      current_phase: 'intermission',
      phase_started_at: nowIso,
      phase_ends_at: null,
      ended_at: nowIso,
    })
    .eq('id', gameSessionId);
  if (error) throw error;
}
