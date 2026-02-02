export type SkillPostType = 'offer' | 'request';
export type SkillCategory = 'coding' | 'design' | 'academics' | 'languages' | 'soft_skills' | 'music' | 'sports' | 'other';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type SessionMode = 'chat' | 'voice_call' | 'video_meeting';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';
export type MeetingPlatform = 'google_meet' | 'zoom' | 'in_app';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface SkillPost {
  id: string;
  user_id: string;
  post_type: SkillPostType;
  skill_title: string;
  category: SkillCategory;
  skill_level: SkillLevel;
  description: string | null;
  preferred_mode: SessionMode;
  session_duration: number;
  learning_goal: string | null;
  current_level: SkillLevel | null;
  urgency: UrgencyLevel | null;
  image_url: string | null;
  likes: number;
  created_at: string;
  updated_at: string;
  // Joined data
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  availability?: SkillAvailability[];
  user_has_liked?: boolean;
}

export interface SkillAvailability {
  id: string;
  post_id: string;
  user_id: string;
  available_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

export interface SkillConnection {
  id: string;
  post_id: string;
  requester_id: string;
  post_owner_id: string;
  status: ConnectionStatus;
  connection_type: SessionMode;
  message: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  post?: SkillPost;
  requester?: {
    full_name: string;
    avatar_url: string | null;
  };
  post_owner?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface SkillSession {
  id: string;
  connection_id: string;
  teacher_id: string;
  learner_id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  meeting_platform: MeetingPlatform;
  meeting_link: string | null;
  status: SessionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  connection?: SkillConnection;
  teacher?: {
    full_name: string;
    avatar_url: string | null;
  };
  learner?: {
    full_name: string;
    avatar_url: string | null;
  };
  reviews?: SkillReview[];
}

export interface SkillReview {
  id: string;
  session_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
}

export interface SkillBadge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteria: unknown;
  created_at: string;
}

export interface UserSkillBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: SkillBadge;
}

export const CATEGORY_OPTIONS: { value: SkillCategory; label: string; icon: string }[] = [
  { value: 'coding', label: 'Coding', icon: '💻' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'academics', label: 'Academics', icon: '📚' },
  { value: 'languages', label: 'Languages', icon: '🌍' },
  { value: 'soft_skills', label: 'Soft Skills', icon: '🤝' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export const LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const MODE_OPTIONS: { value: SessionMode; label: string; icon: string }[] = [
  { value: 'chat', label: 'Chat', icon: '💬' },
  { value: 'voice_call', label: 'Voice Call', icon: '📞' },
  { value: 'video_meeting', label: 'Video Meeting', icon: '📹' },
];

export const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
];

export const PLATFORM_OPTIONS: { value: MeetingPlatform; label: string; icon: string }[] = [
  { value: 'google_meet', label: 'Google Meet', icon: '🔵' },
  { value: 'zoom', label: 'Zoom', icon: '🔷' },
  { value: 'in_app', label: 'In-App Video', icon: '📹' },
];

export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];
