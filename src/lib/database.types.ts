export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      markets: {
        Row: {
          b_liquidity: number
          closes_at: string
          created_at: string
          id: string
          initial_yes_price: number
          market_type: string
          match_id: string | null
          no_price: number | null
          q_no: number
          q_yes: number
          question: string
          question_en: string | null
          ready_for_review: boolean
          resolution_rule: string
          resolved_at: string | null
          resolved_outcome: string | null
          settlement_source: string | null
          status: string
          updated_at: string
          yes_price: number
        }
        Insert: {
          b_liquidity?: number
          closes_at: string
          created_at?: string
          id?: string
          initial_yes_price: number
          market_type?: string
          match_id?: string | null
          no_price?: number | null
          q_no?: number
          q_yes?: number
          question: string
          question_en?: string | null
          ready_for_review?: boolean
          resolution_rule: string
          resolved_at?: string | null
          resolved_outcome?: string | null
          settlement_source?: string | null
          status?: string
          updated_at?: string
          yes_price: number
        }
        Update: Partial<Database["public"]["Tables"]["markets"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "markets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team: string
          created_at: string
          external_id: string | null
          finished_at: string | null
          home_score: number | null
          home_team: string
          id: string
          kickoff_at: string
          league: string | null
          raw_data: Json | null
          source: string | null
          sport: string
          sport_key: string
          status: string
          updated_at: string
        }
        Insert: {
          away_score?: number | null
          away_team: string
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          home_score?: number | null
          home_team: string
          id?: string
          kickoff_at: string
          league?: string | null
          raw_data?: Json | null
          source?: string | null
          sport?: string
          sport_key: string
          status?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>
        Relationships: []
      }
      point_ledger: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          market_id: string | null
          trade_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          market_id?: string | null
          trade_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["point_ledger"]["Insert"]>
        Relationships: []
      }
      positions: {
        Row: {
          contracts: number
          created_at: string
          id: string
          market_id: string | null
          side: string
          total_cost: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contracts?: number
          created_at?: string
          id?: string
          market_id?: string | null
          side: string
          total_cost?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["positions"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "positions_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          correct_prediction_count: number
          created_at: string
          display_name: string | null
          id: string
          last_daily_bonus_date: string | null
          locale: string
          points_balance: number
          prediction_count: number
          total_points_earned: number
          total_points_lost: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          correct_prediction_count?: number
          created_at?: string
          display_name?: string | null
          id: string
          last_daily_bonus_date?: string | null
          locale?: string
          points_balance?: number
          prediction_count?: number
          total_points_earned?: number
          total_points_lost?: number
          updated_at?: string
          username?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      trades: {
        Row: {
          avg_price: number
          contracts_bought: number
          created_at: string
          id: string
          market_id: string | null
          points_spent: number
          side: string
          user_id: string | null
          yes_price_after: number
          yes_price_before: number
        }
        Insert: {
          avg_price: number
          contracts_bought: number
          created_at?: string
          id?: string
          market_id?: string | null
          points_spent: number
          side: string
          user_id?: string | null
          yes_price_after: number
          yes_price_before: number
        }
        Update: Partial<Database["public"]["Tables"]["trades"]["Insert"]>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      buy_contract: {
        Args: { p_market_id: string; p_points_spent: number; p_side: string }
        Returns: Json
      }
      cancel_market: { Args: { p_market_id: string }; Returns: Json }
      claim_daily_bonus: { Args: Record<string, never>; Returns: Json }
      resolve_market: {
        Args: {
          p_market_id: string
          p_outcome: string
          p_settlement_source?: string
        }
        Returns: Json
      }
      update_my_profile: {
        Args: {
          p_avatar_url?: string
          p_display_name?: string
          p_username?: string
        }
        Returns: Database["public"]["Tables"]["profiles"]["Row"]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Market = Database["public"]["Tables"]["markets"]["Row"]
export type Match = Database["public"]["Tables"]["matches"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Position = Database["public"]["Tables"]["positions"]["Row"]
export type Trade = Database["public"]["Tables"]["trades"]["Row"]
export type LedgerEntry = Database["public"]["Tables"]["point_ledger"]["Row"]
