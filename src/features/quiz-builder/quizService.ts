import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type Quiz = Database['public']['Tables']['quizzes']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

export interface QuizWithQuestions extends Quiz {
  questions: Question[];
}

export interface QuestionDraft {
  text: string;
  options: string[];
  correct_option_index: number;
  time_limit_seconds: number;
  points: number;
}

export async function listQuizzes(): Promise<Quiz[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Önce kullanıcının kendi quiz sayısını kontrol et
  const { count, error: countError } = await supabase
    .from('quizzes')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id);
  if (countError) throw countError;

  // Eğer hiç quiz'i yoksa hazır şablonları ekle
  if (count === 0) {
    const { error: seedError } = await supabase.rpc('seed_default_quizzes_for_user', {
      p_user_id: user.id,
    });
    if (seedError) {
      console.error('Default quiz seeding hatası:', seedError.message);
    }
  }

  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getQuizWithQuestions(quizId: string): Promise<QuizWithQuestions> {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();
  if (quizError) throw quizError;

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order', { ascending: true });
  if (qError) throw qError;

  return { ...quiz, questions: questions ?? [] };
}

export async function createQuiz(
  title: string,
  description: string,
  questions: QuestionDraft[],
  funMode = false
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapılmamış.');

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({ owner_id: user.id, title, description, is_published: false, fun_mode: funMode })
    .select('id')
    .single();
  if (quizError) throw quizError;

  if (questions.length > 0) {
    const { error: qError } = await supabase.from('questions').insert(
      questions.map((q, i) => ({ ...q, quiz_id: quiz.id, order: i + 1 }))
    );
    if (qError) throw qError;
  }

  return quiz.id;
}

export async function updateQuiz(
  quizId: string,
  title: string,
  description: string,
  questions: QuestionDraft[],
  funMode = false
): Promise<void> {
  const { error: quizError } = await supabase
    .from('quizzes')
    .update({ title, description, fun_mode: funMode })
    .eq('id', quizId);
  if (quizError) throw quizError;

  await supabase.from('questions').delete().eq('quiz_id', quizId);

  if (questions.length > 0) {
    const { error: qError } = await supabase.from('questions').insert(
      questions.map((q, i) => ({ ...q, quiz_id: quizId, order: i + 1 }))
    );
    if (qError) throw qError;
  }
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (error) throw error;
}

export async function createGameSession(quizId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Giriş yapılmamış.');

  // Önce soru sayısını kontrol et
  const { count, error: countError } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('quiz_id', quizId);
  if (countError) throw countError;
  if (!count || count === 0) throw new Error('Quiz en az 1 soru içermelidir.');

  const pin = Math.floor(100000 + Math.random() * 900000).toString();

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      quiz_id: quizId,
      host_id: user.id,
      game_pin: pin,
      status: 'waiting',
      current_question_index: 0,
      total_questions: count,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}
