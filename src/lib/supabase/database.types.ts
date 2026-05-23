export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          is_published: boolean;
          duration_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          is_published?: boolean;
          duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          is_published?: boolean;
          duration_seconds?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          order: number;
          text: string;
          options: string[];
          correct_option_index: number;
          time_limit_seconds: number;
          points: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          order: number;
          text: string;
          options: string[];
          correct_option_index: number;
          time_limit_seconds?: number;
          points?: number;
        };
        Update: {
          order?: number;
          text?: string;
          options?: string[];
          correct_option_index?: number;
          time_limit_seconds?: number;
          points?: number;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          id: string;
          quiz_id: string;
          host_id: string;
          game_pin: string;
          status: 'waiting' | 'in_progress' | 'completed';
          current_question_index: number;
          current_phase: 'question' | 'intermission' | null;
          active_question_id: string | null;
          started_at: string | null;
          phase_started_at: string | null;
          phase_ends_at: string | null;
          ended_at: string | null;
          total_questions: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          host_id: string;
          game_pin: string;
          status?: 'waiting' | 'in_progress' | 'completed';
          current_question_index?: number;
          total_questions: number;
        };
        Update: {
          status?: 'waiting' | 'in_progress' | 'completed';
          current_question_index?: number;
          current_phase?: 'question' | 'intermission' | null;
          active_question_id?: string | null;
          started_at?: string | null;
          phase_started_at?: string | null;
          phase_ends_at?: string | null;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      participants: {
        Row: {
          id: string;
          game_session_id: string;
          user_id: string | null;
          display_name: string;
          is_online: boolean;
          last_seen: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          game_session_id: string;
          user_id?: string | null;
          display_name: string;
          is_online?: boolean;
          last_seen?: string;
          joined_at?: string;
        };
        Update: {
          display_name?: string;
          is_online?: boolean;
          last_seen?: string;
        };
        Relationships: [];
      };
      answers: {
        Row: {
          id: string;
          game_session_id: string;
          participant_id: string;
          question_id: string;
          selected_option_index: number;
          is_correct: boolean;
          response_time_ms: number;
          points_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_session_id: string;
          participant_id: string;
          question_id: string;
          selected_option_index: number;
          is_correct?: boolean;
          response_time_ms?: number;
          points_earned?: number;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      scores: {
        Row: {
          id: string;
          game_session_id: string;
          participant_id: string;
          total_score: number;
          correct_answers: number;
          total_questions_answered: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_session_id: string;
          participant_id: string;
          total_score?: number;
          correct_answers?: number;
          total_questions_answered?: number;
        };
        Update: {
          total_score?: number;
          correct_answers?: number;
          total_questions_answered?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_game_session: {
        Args: { p_game_pin: string; p_display_name?: string | null };
        Returns: {
          participant: Database['public']['Tables']['participants']['Row'];
          game_session: Database['public']['Tables']['game_sessions']['Row'];
        };
      };
      update_participant_name: {
        Args: { p_participant_id: string; p_display_name: string };
        Returns: undefined;
      };
      get_lobby_participants: {
        Args: { p_game_session_id: string };
        Returns: Database['public']['Tables']['participants']['Row'][];
      };
      sync_game_phase: {
        Args: { p_game_session_id: string; p_participant_id?: string };
        Returns: undefined;
      };
      get_game_session_sync: {
        Args: { p_game_session_id: string; p_participant_id?: string | null };
        Returns: Array<{
          current_question_index: number;
          game_status: 'waiting' | 'in_progress' | 'completed';
          current_phase: 'question' | 'intermission' | null;
          active_question_id: string | null;
          phase_started_at: string | null;
          phase_ends_at: string | null;
          total_questions: number;
          has_next_question: boolean;
        }>;
      };
      get_playable_game_state: {
        Args: { p_game_session_id: string; p_participant_id?: string };
        Returns: {
          quiz_title: string;
          active_question_id: string | null;
          questions: Array<{
            id: string;
            order: number;
            text: string;
            options: string[];
            time_limit_seconds: number;
            points: number;
          }>;
          participant_answers: Array<{
            question_id: string;
            selected_option_index: number;
            is_correct: boolean;
            points_earned: number;
          }>;
        };
      };
      submit_player_answer: {
        Args: {
          p_game_session_id: string;
          p_participant_id: string;
          p_question_id: string;
          p_selected_option_index: number;
          p_response_time_ms: number;
        };
        Returns: Array<{
          accepted: boolean;
          already_answered: boolean;
          locked_option_index: number | null;
          points_earned: number;
        }>;
      };
      get_leaderboard_entries: {
        Args: {
          p_game_session_id: string;
          p_participant_id?: string;
          p_limit?: number;
        };
        Returns: Array<{
          participant_id: string;
          display_name: string;
          total_score: number;
          correct_answers: number;
        }>;
      };
      get_question_results: {
        Args: { p_game_session_id: string; p_question_id: string };
        Returns: {
          question_id: string;
          correct_option_index: number;
          total_answers: number;
          correct_count: number;
          correct_answerers: Array<{
            participant_id: string;
            display_name: string;
            response_time_ms: number;
            points_earned: number;
          }>;
        };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
