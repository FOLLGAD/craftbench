export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat: {
        Row: {
          chat_id: string
          created_at: string
          title: string
          user_id: string
        }
        Insert: {
          chat_id?: string
          created_at: string
          title: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_user_id_user_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customers: {
        Row: {
          company: string
          created_at: string | null
          email: string | null
          id: string
          industry: string | null
          location: string | null
          phone: string | null
          status: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          company: string
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          phone?: string | null
          status?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          company?: string
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          phone?: string | null
          status?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      document: {
        Row: {
          content: string | null
          createdAt: string
          id: string
          title: string
          userId: string
        }
        Insert: {
          content?: string | null
          createdAt: string
          id?: string
          title: string
          userId: string
        }
        Update: {
          content?: string | null
          createdAt?: string
          id?: string
          title?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_userId_user_user_id_fk"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      highscore: {
        Row: {
          completed_at: string | null
          id: string
          name: string | null
          problems_solved: number
          time_seconds: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          name?: string | null
          problems_solved: number
          time_seconds: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          name?: string | null
          problems_solved?: number
          time_seconds?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "highscore_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      "mc-comments": {
        Row: {
          comparison_id: string
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comparison_id: string
          content: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Update: {
          comparison_id?: string
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mc-comments_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "mc-comparisons"
            referencedColumns: ["id"]
          },
        ]
      }
      "mc-comparisons": {
        Row: {
          created_at: string | null
          generation_a_id: string
          generation_b_id: string
          id: string
          prompt: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          generation_a_id: string
          generation_b_id: string
          id?: string
          prompt: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          generation_a_id?: string
          generation_b_id?: string
          id?: string
          prompt?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mc-comparisons_generation_a_id_fkey"
            columns: ["generation_a_id"]
            isOneToOne: false
            referencedRelation: "mc-generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mc-comparisons_generation_b_id_fkey"
            columns: ["generation_b_id"]
            isOneToOne: false
            referencedRelation: "mc-generations"
            referencedColumns: ["id"]
          },
        ]
      }
      "mc-generations": {
        Row: {
          created_at: string | null
          generated_code: string
          id: string
          model_name: string
          prompt: string
        }
        Insert: {
          created_at?: string | null
          generated_code: string
          id?: string
          model_name: string
          prompt: string
        }
        Update: {
          created_at?: string | null
          generated_code?: string
          id?: string
          model_name?: string
          prompt?: string
        }
        Relationships: [
          {
            foreignKeyName: "mc-generations_model_name_fkey"
            columns: ["model_name"]
            isOneToOne: false
            referencedRelation: "mc-models"
            referencedColumns: ["model_name"]
          },
        ]
      }
      "mc-models": {
        Row: {
          created_at: string
          elo: number
          is_disabled: boolean
          model_name: string
        }
        Insert: {
          created_at?: string
          elo?: number
          is_disabled?: boolean
          model_name: string
        }
        Update: {
          created_at?: string
          elo?: number
          is_disabled?: boolean
          model_name?: string
        }
        Relationships: []
      }
      "mc-votes": {
        Row: {
          comparison_id: string
          created_at: string | null
          generation_id: string
          id: string
          user_id: string
          vote: number
        }
        Insert: {
          comparison_id: string
          created_at?: string | null
          generation_id: string
          id?: string
          user_id?: string
          vote: number
        }
        Update: {
          comparison_id?: string
          created_at?: string | null
          generation_id?: string
          id?: string
          user_id?: string
          vote?: number
        }
        Relationships: [
          {
            foreignKeyName: "mc-votes_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "mc-comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mc-votes_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "mc-generations"
            referencedColumns: ["id"]
          },
        ]
      }
      message: {
        Row: {
          chat_id: string
          content: Json
          created_at: string
          message_id: string
          role: string
        }
        Insert: {
          chat_id: string
          content: Json
          created_at: string
          message_id?: string
          role: string
        }
        Update: {
          chat_id?: string
          content?: Json
          created_at?: string
          message_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_chat_id_chat_chat_id_fk"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["chat_id"]
          },
        ]
      }
      organization: {
        Row: {
          created_at: string
          image: string | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          image?: string | null
          name: string
          organization_id?: string
        }
        Update: {
          created_at?: string
          image?: string | null
          name?: string
          organization_id?: string
        }
        Relationships: []
      }
      songs: {
        Row: {
          created_at: string | null
          id: string
          pattern: Json
          tempo: number
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pattern: Json
          tempo: number
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pattern?: Json
          tempo?: number
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user: {
        Row: {
          created_at: string
          image: string | null
          name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          image?: string | null
          name?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          image?: string | null
          name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_to_organization: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_to_organization_organization_id_organization_organization_"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "user_to_organization_user_id_user_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vote: {
        Row: {
          chat_id: string
          is_upvoted: boolean
          message_id: string
        }
        Insert: {
          chat_id: string
          is_upvoted: boolean
          message_id: string
        }
        Update: {
          chat_id?: string
          is_upvoted?: boolean
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_chat_id_chat_chat_id_fk"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["chat_id"]
          },
          {
            foreignKeyName: "vote_message_id_message_message_id_fk"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "message"
            referencedColumns: ["message_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_comment_count: {
        Args: { comparison_id: string }
        Returns: number
      }
    }
    Enums: {
      org_role: "owner" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      org_role: ["owner", "member"],
    },
  },
} as const
