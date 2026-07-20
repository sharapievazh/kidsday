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
      kid_secrets: {
        Row: {
          created_at: string
          pin_code: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          pin_code: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          pin_code?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kid_secrets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kid_secrets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          color: string | null
          created_at: string
          emoji: string | null
          id: string
          name: string
          parent_id: string | null
          role: Database["public"]["Enums"]["profile_role"]
          streak_count: number
          streak_last_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          parent_id?: string | null
          role: Database["public"]["Enums"]["profile_role"]
          streak_count?: number
          streak_last_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          streak_count?: number
          streak_last_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_purchases: {
        Row: {
          cost: number
          created_at: string
          delivered: boolean
          delivered_at: string | null
          id: string
          kid_id: string
          reward_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          delivered?: boolean
          delivered_at?: string | null
          id?: string
          kid_id: string
          reward_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          delivered?: boolean
          delivered_at?: string | null
          id?: string
          kid_id?: string
          reward_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_purchases_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_purchases_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_purchases_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          cost: number
          created_at: string
          emoji: string | null
          id: string
          name: string
          name_ru: string | null
          parent_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cost: number
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          name_ru?: string | null
          parent_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cost?: number
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          name_ru?: string | null
          parent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          coins_awarded: number
          completed_on: string
          created_at: string
          id: string
          kid_id: string
          task_id: string
        }
        Insert: {
          coins_awarded?: number
          completed_on?: string
          created_at?: string
          id?: string
          kid_id: string
          task_id: string
        }
        Update: {
          coins_awarded?: number
          completed_on?: string
          created_at?: string
          id?: string
          kid_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_kid_id_fkey"
            columns: ["kid_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string
          category: Database["public"]["Enums"]["task_category"]
          coins: number
          created_at: string
          days_of_week: number[]
          frequency: Database["public"]["Enums"]["task_frequency"]
          id: string
          parent_id: string
          schedule_type: Database["public"]["Enums"]["schedule_type"]
          title: string
          title_ru: string | null
          updated_at: string
        }
        Insert: {
          assignee_id: string
          category: Database["public"]["Enums"]["task_category"]
          coins?: number
          created_at?: string
          days_of_week?: number[]
          frequency?: Database["public"]["Enums"]["task_frequency"]
          id?: string
          parent_id: string
          schedule_type?: Database["public"]["Enums"]["schedule_type"]
          title: string
          title_ru?: string | null
          updated_at?: string
        }
        Update: {
          assignee_id?: string
          category?: Database["public"]["Enums"]["task_category"]
          coins?: number
          created_at?: string
          days_of_week?: number[]
          frequency?: Database["public"]["Enums"]["task_frequency"]
          id?: string
          parent_id?: string
          schedule_type?: Database["public"]["Enums"]["schedule_type"]
          title?: string
          title_ru?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_safe: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string | null
          id: string | null
          name: string | null
          parent_id: string | null
          role: Database["public"]["Enums"]["profile_role"] | null
          streak_count: number | null
          streak_last_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string | null
          name?: string | null
          parent_id?: string | null
          role?: Database["public"]["Enums"]["profile_role"] | null
          streak_count?: number | null
          streak_last_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string | null
          name?: string | null
          parent_id?: string | null
          role?: Database["public"]["Enums"]["profile_role"] | null
          streak_count?: number | null
          streak_last_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_parent_id: { Args: never; Returns: string }
    }
    Enums: {
      profile_role: "parent" | "kid"
      schedule_type: "school_days" | "holidays" | "always"
      task_category:
        | "Hygiene"
        | "Chores"
        | "Self-Education"
        | "Reading"
        | "Piano"
        | "Chess"
        | "Sports"
        | "Creative"
      task_frequency: "daily" | "weekly"
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
      profile_role: ["parent", "kid"],
      schedule_type: ["school_days", "holidays", "always"],
      task_category: [
        "Hygiene",
        "Chores",
        "Self-Education",
        "Reading",
        "Piano",
        "Chess",
        "Sports",
        "Creative",
      ],
      task_frequency: ["daily", "weekly"],
    },
  },
} as const
