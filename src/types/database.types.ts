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
      divisions: {
        Row: {
          id: string
          name: string
          code: string
          competition_type: string
          display_order: number
          is_active: boolean
          created_at: string
        }
          Insert: Partial<{
          id: string
          name: string
          code: string
          competition_type: string
          display_order: number
          is_active: boolean
          created_at: string
        }>
          Update: Partial<{
          id: string
          name: string
          code: string
          competition_type: string
          display_order: number
          is_active: boolean
          created_at: string
        }>
      }
      groups: {
        Row: {
          id: string
          division_id: string
          name: string
          code: string
          display_order: number
        }
          Insert: Partial<{
          id: string
          division_id: string
          name: string
          code: string
          display_order: number
        }>
          Update: Partial<{
          id: string
          division_id: string
          name: string
          code: string
          display_order: number
        }>
      }
      teams: {
        Row: {
          id: string
          division_id: string
          group_id: string | null
          school_name: string
          team_name: string | null
          short_name: string | null
          display_order: number | null
          is_active: boolean
        }
          Insert: Partial<{
          id: string
          division_id: string
          group_id: string | null
          school_name: string
          team_name: string | null
          short_name: string | null
          display_order: number | null
          is_active: boolean
        }>
          Update: Partial<{
          id: string
          division_id: string
          group_id: string | null
          school_name: string
          team_name: string | null
          short_name: string | null
          display_order: number | null
          is_active: boolean
        }>
      }
      matches: {
        Row: {
          id: string
          division_id: string
          group_id: string | null
          stage: string
          match_no: number
          match_date: string
          start_time: string
          end_time: string | null
          home_team_id: string | null
          away_team_id: string | null
          home_placeholder: string | null
          away_placeholder: string | null
          home_score: number | null
          away_score: number | null
          status: string
          winner_team_id: string | null
          loser_team_id: string | null
          is_forfeit: boolean
          forfeit_loser_team_id: string | null
          result_confirmed_at: string | null
          created_at: string
          updated_at: string
        }
          Insert: Partial<{
          id: string
          division_id: string
          group_id: string | null
          stage: string
          match_no: number
          match_date: string
          start_time: string
          end_time: string | null
          home_team_id: string | null
          away_team_id: string | null
          home_placeholder: string | null
          away_placeholder: string | null
          home_score: number | null
          away_score: number | null
          status: string
          winner_team_id: string | null
          loser_team_id: string | null
          is_forfeit: boolean
          forfeit_loser_team_id: string | null
          result_confirmed_at: string | null
          created_at: string
          updated_at: string
        }>
          Update: Partial<{
          id: string
          division_id: string
          group_id: string | null
          stage: string
          match_no: number
          match_date: string
          start_time: string
          end_time: string | null
          home_team_id: string | null
          away_team_id: string | null
          home_placeholder: string | null
          away_placeholder: string | null
          home_score: number | null
          away_score: number | null
          status: string
          winner_team_id: string | null
          loser_team_id: string | null
          is_forfeit: boolean
          forfeit_loser_team_id: string | null
          result_confirmed_at: string | null
          created_at: string
          updated_at: string
        }>
      }
      standings_override: {
        Row: {
          id: string
          division_id: string
          group_id: string
          team_id: string
          manual_rank: number
          reason: string | null
          locked_by: string | null
          locked_at: string
        }
          Insert: Partial<{
          id: string
          division_id: string
          group_id: string
          team_id: string
          manual_rank: number
          reason: string | null
          locked_by: string | null
          locked_at: string
        }>
          Update: Partial<{
          id: string
          division_id: string
          group_id: string
          team_id: string
          manual_rank: number
          reason: string | null
          locked_by: string | null
          locked_at: string
        }>
      }
      bracket_slots: {
        Row: {
          id: string
          division_id: string
          stage: string
          match_id: string
          slot_position: string
          team_id: string | null
          seed_label: string | null
          source_group_id: string | null
          source_rank: number | null
          is_locked: boolean
          created_at: string
        }
          Insert: Partial<{
          id: string
          division_id: string
          stage: string
          match_id: string
          slot_position: string
          team_id: string | null
          seed_label: string | null
          source_group_id: string | null
          source_rank: number | null
          is_locked: boolean
          created_at: string
        }>
          Update: Partial<{
          id: string
          division_id: string
          stage: string
          match_id: string
          slot_position: string
          team_id: string | null
          seed_label: string | null
          source_group_id: string | null
          source_rank: number | null
          is_locked: boolean
          created_at: string
        }>
      }
      audit_logs: {
        Row: {
          id: string
          actor_name: string
          actor_role: string | null
          action: string
          target_type: string
          target_id: string
          before_data: Json | null
          after_data: Json | null
          reason: string | null
          created_at: string
        }
          Insert: Partial<{
          id: string
          actor_name: string
          actor_role: string | null
          action: string
          target_type: string
          target_id: string
          before_data: Json | null
          after_data: Json | null
          reason: string | null
          created_at: string
        }>
          Update: Partial<{
          id: string
          actor_name: string
          actor_role: string | null
          action: string
          target_type: string
          target_id: string
          before_data: Json | null
          after_data: Json | null
          reason: string | null
          created_at: string
        }>
      }
      admin_users: {
        Row: {
          id: string
          name: string
          role: string
          pin_hash: string
          pin_salt: string | null
          is_active: boolean
          created_at: string
        }
          Insert: Partial<{
          id: string
          name: string
          role: string
          pin_hash: string
          pin_salt: string | null
          is_active: boolean
          created_at: string
        }>
          Update: Partial<{
          id: string
          name: string
          role: string
          pin_hash: string
          pin_salt: string | null
          is_active: boolean
          created_at: string
        }>
      }
      admin_login_attempts: {
        Row: {
          id: string
          ip_address: string
          attempt_time: string
          success: boolean
        }
          Insert: Partial<{
          id: string
          ip_address: string
          attempt_time: string
          success: boolean
        }>
          Update: Partial<{
          id: string
          ip_address: string
          attempt_time: string
          success: boolean
        }>
      }
      admin_sessions: {
        Row: {
          id: string
          admin_user_id: string
          token_hash: string
          expires_at: string
          created_at: string
        }
          Insert: Partial<{
          id: string
          admin_user_id: string
          token_hash: string
          expires_at: string
          created_at: string
        }>
          Update: Partial<{
          id: string
          admin_user_id: string
          token_hash: string
          expires_at: string
          created_at: string
        }>
      }
    }
  }
}
