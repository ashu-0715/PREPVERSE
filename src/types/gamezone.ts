export interface QuestionSet {
  id: string;
  user_id: string;
  title: string;
  source_file_name?: string;
  source_file_url?: string;
  total_questions: number;
  difficulty: string;
  topics: string[];
  created_at: string;
  updated_at: string;
}

export interface GameQuestion {
  id: string;
  question_set_id: string;
  question_type: 'mcq' | 'true_false' | 'fill_blank';
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: string;
  topic?: string;
}

export interface GameRoom {
  id: string;
  host_id: string;
  room_code: string;
  question_set_id: string;
  status: 'waiting' | 'playing' | 'finished';
  max_players: number;
  current_question_index: number;
  question_timer: number;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface GamePlayer {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  score: number;
  streak: number;
  correct_answers: number;
  total_answered: number;
  is_ready: boolean;
  joined_at: string;
}

export interface UserGameStats {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  games_played: number;
  total_correct: number;
  total_answered: number;
  longest_streak: number;
  battles_won: number;
  materials_uploaded: number;
}

export interface GameBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: any;
}

export const LEVEL_NAMES: Record<number, string> = {
  1: "Beginner Learner",
  2: "Smart Reviser",
  3: "Quiz Challenger",
  4: "Revision Pro",
  5: "Master Mind",
};

export const getXpForLevel = (level: number) => level * 500;
