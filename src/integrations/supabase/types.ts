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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      goal_logs: {
        Row: {
          created_at: string
          difficulty_feeling: string | null
          effort_rating: number
          goal_id: string
          id: string
          log_date: string
          notes: string | null
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_feeling?: string | null
          effort_rating: number
          goal_id: string
          id?: string
          log_date?: string
          notes?: string | null
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_feeling?: string | null
          effort_rating?: number
          goal_id?: string
          id?: string
          log_date?: string
          notes?: string | null
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          consecutive_misses: number
          consecutive_successes: number
          created_at: string
          current_difficulty_multiplier: number
          days_per_week: number
          description: string | null
          effort_per_day_minutes: number
          feasibility_score: number
          id: string
          in_recovery_mode: boolean
          momentum_score: number
          name: string
          recovery_start_date: string | null
          status: Database["public"]["Enums"]["goal_status"]
          timeframe_days: number
          total_effort_logged: number
          updated_at: string
          user_id: string
        }
        Insert: {
          consecutive_misses?: number
          consecutive_successes?: number
          created_at?: string
          current_difficulty_multiplier?: number
          days_per_week?: number
          description?: string | null
          effort_per_day_minutes?: number
          feasibility_score?: number
          id?: string
          in_recovery_mode?: boolean
          momentum_score?: number
          name: string
          recovery_start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          timeframe_days?: number
          total_effort_logged?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          consecutive_misses?: number
          consecutive_successes?: number
          created_at?: string
          current_difficulty_multiplier?: number
          days_per_week?: number
          description?: string | null
          effort_per_day_minutes?: number
          feasibility_score?: number
          id?: string
          in_recovery_mode?: boolean
          momentum_score?: number
          name?: string
          recovery_start_date?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          timeframe_days?: number
          total_effort_logged?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          acknowledged: boolean
          created_at: string
          goal_id: string
          id: string
          reason: Database["public"]["Enums"]["miss_reason"]
          reason_details: string | null
          reflection_date: string
          suggested_adjustment: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          goal_id: string
          id?: string
          reason: Database["public"]["Enums"]["miss_reason"]
          reason_details?: string | null
          reflection_date?: string
          suggested_adjustment?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          goal_id?: string
          id?: string
          reason?: Database["public"]["Enums"]["miss_reason"]
          reason_details?: string | null
          reflection_date?: string
          suggested_adjustment?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_status: "active" | "paused" | "completed" | "archived"
      miss_reason:
        | "time"
        | "energy"
        | "forgot"
        | "motivation"
        | "external"
        | "other"
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
      goal_status: ["active", "paused", "completed", "archived"],
      miss_reason: [
        "time",
        "energy",
        "forgot",
        "motivation",
        "external",
        "other",
      ],
    },
  },
} as const
