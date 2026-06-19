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
        Update: {
          b_liquidity?: number
          closes_at?: string
          created_at?: string
          id?: string
          initial_yes_price?: number
          market_type?: string
          match_id?: string | null
          no_price?: number | null
          q_no?: number
          q_yes?: number
          question?: string
          question_en?: string | null
          ready_for_review?: boolean
          resolution_rule?: string
          resolved_at?: string | null
          resolved_outcome?: string | null
          settlement_source?: string | null
          status?: string
          updated_at?: string
          yes_price?: number
        }
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
        Update: {
          away_score?: number | null
          away_team?: string
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          home_score?: number | null
          home_team?: string
          id?: string
          kickoff_at?: string
          league?: string | null
          raw_data?: Json | null
          source?: string | null
          sport?: string
          sport_key?: string
          status?: string
          updated_at?: string
        }
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
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          market_id?: string | null
          trade_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_ledger_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_ledger_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Update: {
          contracts?: number
          created_at?: string
          id?: string
          market_id?: string | null
          side?: string
          total_cost?: number
          updated_at?: string
          user_id?: string | null
        }
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
          results_seen_at: string | null
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
          results_seen_at?: string | null
          total_points_earned?: number
          total_points_lost?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          correct_prediction_count?: number
          created_at?: string
          display_name?: string | null
          id?: string
          last_daily_bonus_date?: string | null
          locale?: string
          points_balance?: number
          prediction_count?: number
          results_seen_at?: string | null
          total_points_earned?: number
          total_points_lost?: number
          updated_at?: string
          username?: string | null
        }
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
        Update: {
          avg_price?: number
          contracts_bought?: number
          created_at?: string
          id?: string
          market_id?: string | null
          points_spent?: number
          side?: string
          user_id?: string | null
          yes_price_after?: number
          yes_price_before?: number
        }
        Relationships: [
          {
            foreignKeyName: "trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
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
      buy_contract: {
        Args: { p_market_id: string; p_points_spent: number; p_side: string }
        Returns: Json
      }
      cancel_market: { Args: { p_market_id: string }; Returns: Json }
      claim_daily_bonus: { Args: never; Returns: Json }
      cron_sync_results: { Args: never; Returns: undefined }
      mark_results_seen: { Args: { p_seen_at: string }; Returns: string }
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
        Returns: {
          avatar_url: string | null
          correct_prediction_count: number
          created_at: string
          display_name: string | null
          id: string
          last_daily_bonus_date: string | null
          locale: string
          points_balance: number
          prediction_count: number
          results_seen_at: string | null
          total_points_earned: number
          total_points_lost: number
          updated_at: string
          username: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

export type Market = Database["public"]["Tables"]["markets"]["Row"]
export type Match = Database["public"]["Tables"]["matches"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Position = Database["public"]["Tables"]["positions"]["Row"]
export type Trade = Database["public"]["Tables"]["trades"]["Row"]
export type LedgerEntry = Database["public"]["Tables"]["point_ledger"]["Row"]
