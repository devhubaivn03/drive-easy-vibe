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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["chat_sender_type"]
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["chat_sender_type"]
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["chat_sender_type"]
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          claimed_by: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["chat_status"]
          visitor_name: string | null
          visitor_token: string
        }
        Insert: {
          claimed_by?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["chat_status"]
          visitor_name?: string | null
          visitor_token: string
        }
        Update: {
          claimed_by?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["chat_status"]
          visitor_name?: string | null
          visitor_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "client_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "client_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      client_chats: {
        Row: {
          claimed_by: string | null
          client_id: string
          created_at: string
          id: string
          last_message_at: string
          status: string
        }
        Insert: {
          claimed_by?: string | null
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
        }
        Update: {
          claimed_by?: string | null
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          status?: string
        }
        Relationships: []
      }
      contact_leads: {
        Row: {
          assigned_to: string | null
          content: string | null
          created_at: string
          id: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          assigned_to?: string | null
          content?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          assigned_to?: string | null
          content?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: [
          {
            foreignKeyName: "contact_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          answers: Json
          client_id: string
          exam_set_id: string
          id: string
          score: number
          submitted_at: string
          time_spent_seconds: number
          total_questions: number
        }
        Insert: {
          answers?: Json
          client_id: string
          exam_set_id: string
          id?: string
          score?: number
          submitted_at?: string
          time_spent_seconds?: number
          total_questions?: number
        }
        Update: {
          answers?: Json
          client_id?: string
          exam_set_id?: string
          id?: string
          score?: number
          submitted_at?: string
          time_spent_seconds?: number
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_set_id_fkey"
            columns: ["exam_set_id"]
            isOneToOne: false
            referencedRelation: "exam_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          client_id: string
          created_at: string
          graduation_passed: boolean | null
          id: string
          notes: string | null
          road_score: number | null
          simulation_score: number | null
          theory_score: number | null
          track_score: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          graduation_passed?: boolean | null
          id?: string
          notes?: string | null
          road_score?: number | null
          simulation_score?: number | null
          theory_score?: number | null
          track_score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          graduation_passed?: boolean | null
          id?: string
          notes?: string | null
          road_score?: number | null
          simulation_score?: number | null
          theory_score?: number | null
          track_score?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      exam_set_questions: {
        Row: {
          answer_1: string
          answer_2: string
          answer_3: string | null
          answer_4: string | null
          correct_answer: number
          exam_set_id: string
          id: string
          image_url: string | null
          order_index: number
          question_text: string
        }
        Insert: {
          answer_1: string
          answer_2: string
          answer_3?: string | null
          answer_4?: string | null
          correct_answer: number
          exam_set_id: string
          id?: string
          image_url?: string | null
          order_index?: number
          question_text: string
        }
        Update: {
          answer_1?: string
          answer_2?: string
          answer_3?: string | null
          answer_4?: string | null
          correct_answer?: number
          exam_set_id?: string
          id?: string
          image_url?: string | null
          order_index?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_set_questions_exam_set_id_fkey"
            columns: ["exam_set_id"]
            isOneToOne: false
            referencedRelation: "exam_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sets: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_id: string | null
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          license_type: Database["public"]["Enums"]["license_type"] | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id: string
          license_type?: Database["public"]["Enums"]["license_type"] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          license_type?: Database["public"]["Enums"]["license_type"] | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_1: string
          answer_2: string
          answer_3: string | null
          answer_4: string | null
          correct_answer: number
          created_at: string
          id: string
          image_url: string | null
          question_text: string
        }
        Insert: {
          answer_1: string
          answer_2: string
          answer_3?: string | null
          answer_4?: string | null
          correct_answer: number
          created_at?: string
          id?: string
          image_url?: string | null
          question_text: string
        }
        Update: {
          answer_1?: string
          answer_2?: string
          answer_3?: string | null
          answer_4?: string | null
          correct_answer?: number
          created_at?: string
          id?: string
          image_url?: string | null
          question_text?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          client_id: string
          id: string
          notes: string | null
          road_test_score: number | null
          schedule_milestones: Json | null
          simulation_score: number | null
          teacher_id: string
          theory_score: number | null
          track_test_score: number | null
          updated_at: string
        }
        Insert: {
          client_id: string
          id?: string
          notes?: string | null
          road_test_score?: number | null
          schedule_milestones?: Json | null
          simulation_score?: number | null
          teacher_id: string
          theory_score?: number | null
          track_test_score?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          id?: string
          notes?: string | null
          road_test_score?: number | null
          schedule_milestones?: Json | null
          simulation_score?: number | null
          teacher_id?: string
          theory_score?: number | null
          track_test_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_client_chat: { Args: { _client_id: string }; Returns: boolean }
      get_user_admin_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "teacher" | "staff" | "client"
      chat_sender_type: "visitor" | "staff"
      chat_status: "waiting" | "active" | "closed"
      lead_status: "new" | "contacted" | "converted"
      license_type: "A1" | "A2" | "B1" | "B2" | "C" | "D" | "E" | "F"
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
      app_role: ["superadmin", "admin", "teacher", "staff", "client"],
      chat_sender_type: ["visitor", "staff"],
      chat_status: ["waiting", "active", "closed"],
      lead_status: ["new", "contacted", "converted"],
      license_type: ["A1", "A2", "B1", "B2", "C", "D", "E", "F"],
    },
  },
} as const
