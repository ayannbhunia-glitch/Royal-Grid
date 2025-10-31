// Supabase Database Types
// Auto-generated types for type-safe database queries

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
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          total_games: number
          wins: number
          losses: number
          elo_rating: number
          last_seen_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          total_games?: number
          wins?: number
          losses?: number
          elo_rating?: number
          last_seen_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          total_games?: number
          wins?: number
          losses?: number
          elo_rating?: number
          last_seen_at?: string
        }
      }
      games: {
        Row: {
          id: string
          status: 'waiting' | 'active' | 'ended' | 'cancelled'
          num_players: number
          grid_size: number
          players: Json
          state: Json
          created_by: string | null
          created_at: string
          started_at: string | null
          ended_at: string | null
          winner_uid: string | null
          share_code: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          status?: 'waiting' | 'active' | 'ended' | 'cancelled'
          num_players?: number
          grid_size?: number
          players?: Json
          state?: Json
          created_by?: string | null
          created_at?: string
          started_at?: string | null
          ended_at?: string | null
          winner_uid?: string | null
          share_code?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          status?: 'waiting' | 'active' | 'ended' | 'cancelled'
          num_players?: number
          grid_size?: number
          players?: Json
          state?: Json
          created_by?: string | null
          created_at?: string
          started_at?: string | null
          ended_at?: string | null
          winner_uid?: string | null
          share_code?: string | null
          updated_at?: string
        }
      }
      moves: {
        Row: {
          id: number
          game_id: string
          move_number: number
          player_uid: string
          move_data: Json
          created_at: string
        }
        Insert: {
          id?: number
          game_id: string
          move_number: number
          player_uid: string
          move_data: Json
          created_at?: string
        }
        Update: {
          id?: number
          game_id?: string
          move_number?: number
          player_uid?: string
          move_data?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      game_status: 'waiting' | 'active' | 'ended' | 'cancelled'
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type Move = Database['public']['Tables']['moves']['Row']

export type GamePlayer = {
  uid: string
  name: string
  avatar?: string
  order: number
  joinedAt: string
  finishedAt?: string
  rank?: number
}

export type GameState = {
  board: any[][] // Will match your existing board structure
  turn: number
  currentPlayer: number
  history: any[]
  lastMoveAt: string | null
}
