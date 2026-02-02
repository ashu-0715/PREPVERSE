export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      career_assessments: {
        Row: {
          career_path: Json | null
          created_at: string | null
          id: string
          interests: string[]
          recommended_roles: string[]
          skills: string[]
          user_id: string
        }
        Insert: {
          career_path?: Json | null
          created_at?: string | null
          id?: string
          interests: string[]
          recommended_roles: string[]
          skills: string[]
          user_id: string
        }
        Update: {
          career_path?: Json | null
          created_at?: string | null
          id?: string
          interests?: string[]
          recommended_roles?: string[]
          skills?: string[]
          user_id?: string
        }
        Relationships: []
      }
      note_requests: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_fulfilled: boolean | null
          semester: string | null
          subject: string
          topic: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_fulfilled?: boolean | null
          semester?: string | null
          subject: string
          topic: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_fulfilled?: boolean | null
          semester?: string | null
          subject?: string
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string | null
          file_url: string
          id: string
          rating: number | null
          rating_count: number | null
          semester: string | null
          subject: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: string
          rating?: number | null
          rating_count?: number | null
          semester?: string | null
          subject: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: string
          rating?: number | null
          rating_count?: number | null
          semester?: string | null
          subject?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          skills: string[] | null
          streak_days: number | null
          updated_at: string | null
          year_of_study: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id: string
          skills?: string[] | null
          streak_days?: number | null
          updated_at?: string | null
          year_of_study?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          skills?: string[] | null
          streak_days?: number | null
          updated_at?: string | null
          year_of_study?: string | null
        }
        Relationships: []
      }
      skill_availability: {
        Row: {
          available_date: string
          created_at: string | null
          end_time: string
          id: string
          is_booked: boolean | null
          post_id: string
          start_time: string
          user_id: string
        }
        Insert: {
          available_date: string
          created_at?: string | null
          end_time: string
          id?: string
          is_booked?: boolean | null
          post_id: string
          start_time: string
          user_id: string
        }
        Update: {
          available_date?: string
          created_at?: string | null
          end_time?: string
          id?: string
          is_booked?: boolean | null
          post_id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_availability_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "skill_posts_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_badges: {
        Row: {
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      skill_connections: {
        Row: {
          connection_type: Database["public"]["Enums"]["session_mode"] | null
          created_at: string | null
          id: string
          message: string | null
          post_id: string
          post_owner_id: string
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string | null
        }
        Insert: {
          connection_type?: Database["public"]["Enums"]["session_mode"] | null
          created_at?: string | null
          id?: string
          message?: string | null
          post_id: string
          post_owner_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Update: {
          connection_type?: Database["public"]["Enums"]["session_mode"] | null
          created_at?: string | null
          id?: string
          message?: string | null
          post_id?: string
          post_owner_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_connections_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "skill_posts_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "skill_posts_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_posts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          likes: number | null
          skill_offered: string
          skill_requested: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          likes?: number | null
          skill_offered: string
          skill_requested: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          likes?: number | null
          skill_offered?: string
          skill_requested?: string
          user_id?: string
        }
        Relationships: []
      }
      skill_posts_v2: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string | null
          current_level: Database["public"]["Enums"]["skill_level"] | null
          description: string | null
          id: string
          image_url: string | null
          learning_goal: string | null
          likes: number | null
          post_type: Database["public"]["Enums"]["skill_post_type"]
          preferred_mode: Database["public"]["Enums"]["session_mode"]
          session_duration: number | null
          skill_level: Database["public"]["Enums"]["skill_level"]
          skill_title: string
          updated_at: string | null
          urgency: Database["public"]["Enums"]["urgency_level"] | null
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          current_level?: Database["public"]["Enums"]["skill_level"] | null
          description?: string | null
          id?: string
          image_url?: string | null
          learning_goal?: string | null
          likes?: number | null
          post_type: Database["public"]["Enums"]["skill_post_type"]
          preferred_mode?: Database["public"]["Enums"]["session_mode"]
          session_duration?: number | null
          skill_level?: Database["public"]["Enums"]["skill_level"]
          skill_title: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string | null
          current_level?: Database["public"]["Enums"]["skill_level"] | null
          description?: string | null
          id?: string
          image_url?: string | null
          learning_goal?: string | null
          likes?: number | null
          post_type?: Database["public"]["Enums"]["skill_post_type"]
          preferred_mode?: Database["public"]["Enums"]["session_mode"]
          session_duration?: number | null
          skill_level?: Database["public"]["Enums"]["skill_level"]
          skill_title?: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
          user_id?: string
        }
        Relationships: []
      }
      skill_reviews: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          session_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          session_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "skill_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_sessions: {
        Row: {
          connection_id: string
          created_at: string | null
          duration: number
          id: string
          learner_id: string
          meeting_link: string | null
          meeting_platform: Database["public"]["Enums"]["meeting_platform"]
          notes: string | null
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["session_status"]
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          duration?: number
          id?: string
          learner_id: string
          meeting_link?: string | null
          meeting_platform?: Database["public"]["Enums"]["meeting_platform"]
          notes?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["session_status"]
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          duration?: number
          id?: string
          learner_id?: string
          meeting_link?: string | null
          meeting_platform?: Database["public"]["Enums"]["meeting_platform"]
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["session_status"]
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_sessions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "skill_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          is_active: boolean | null
          last_active_at: string | null
          logged_in_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          logged_in_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          logged_in_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_skill_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "skill_badges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role:
        | {
            Args: { _role: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
    }
    Enums: {
      app_role: "student" | "faculty" | "admin"
      connection_status: "pending" | "accepted" | "declined" | "completed"
      meeting_platform: "google_meet" | "zoom" | "in_app"
      session_mode: "chat" | "voice_call" | "video_meeting"
      session_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      skill_category:
        | "coding"
        | "design"
        | "academics"
        | "languages"
        | "soft_skills"
        | "music"
        | "sports"
        | "other"
      skill_level: "beginner" | "intermediate" | "advanced"
      skill_post_type: "offer" | "request"
      urgency_level: "low" | "medium" | "high" | "urgent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "faculty", "admin"],
      connection_status: ["pending", "accepted", "declined", "completed"],
      meeting_platform: ["google_meet", "zoom", "in_app"],
      session_mode: ["chat", "voice_call", "video_meeting"],
      session_status: ["scheduled", "in_progress", "completed", "cancelled"],
      skill_category: [
        "coding",
        "design",
        "academics",
        "languages",
        "soft_skills",
        "music",
        "sports",
        "other",
      ],
      skill_level: ["beginner", "intermediate", "advanced"],
      skill_post_type: ["offer", "request"],
      urgency_level: ["low", "medium", "high", "urgent"],
    },
  },
} as const
