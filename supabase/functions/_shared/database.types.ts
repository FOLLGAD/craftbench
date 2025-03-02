
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      "mc-comparisons": {
        Row: {
          created_at: string | null
          generation_a_id: string
          generation_b_id: string
          id: string
          prompt: string
        }
        Insert: {
          created_at?: string | null
          generation_a_id: string
          generation_b_id: string
          id?: string
          prompt: string
        }
        Update: {
          created_at?: string | null
          generation_a_id?: string
          generation_b_id?: string
          id?: string
          prompt?: string
        }
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
      }
      "mc-models": {
        Row: {
          created_at: string
          elo: number
          model_name: string
        }
        Insert: {
          created_at?: string
          elo?: number
          model_name: string
        }
        Update: {
          created_at?: string
          elo?: number
          model_name?: string
        }
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
      }
    }
  }
}
