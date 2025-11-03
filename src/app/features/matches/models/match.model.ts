/**
 * Match Models for Phase 2: Match Recording & Leaderboard
 */

/**
 * Match status enum
 * Phase 4: Added DISPUTED status
 */
export enum MatchStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

/**
 * Match result enum (for participants)
 */
export enum MatchResult {
  WIN = 'win',
  LOSS = 'loss',
}

/**
 * Match participant interface
 */
export interface MatchParticipant {
  id: string;
  match_id: string;
  profile_id: string;
  score: number | null;
  result: MatchResult | null;
  created_at: string;

  // Populated fields (from joins)
  display_name?: string;
}

/**
 * Match interface
 */
export interface Match {
  id: string;
  league_id: string;
  season_id?: string | null;
  match_date?: string | null;
  recorded_by?: string | null;
  recorded_at?: string | null;
  status: MatchStatus | string; // Allow string for scheduled/overdue/forfeited
  created_at: string;
  updated_at: string;

  // Scheduling fields (for scheduled matches)
  round_number?: number | null;
  scheduled_date?: string | null;
  submission_deadline?: string | null;
  home_player_id?: string | null;
  away_player_id?: string | null;

  // Populated fields (from joins)
  participants?: MatchParticipant[];
  recorder_name?: string;
}

/**
 * Create match request DTO
 */
export interface CreateMatchRequest {
  league_id: string;
  match_date: string;
  participants: {
    profile_id: string;
    score: number;
    result: MatchResult;
  }[];
}

/**
 * Match with full participant details (for display)
 */
export interface MatchWithDetails extends Match {
  participants: MatchParticipant[];
  // Populated player names for scheduled matches
  home_player?: { name: string } | null;
  away_player?: { name: string } | null;
}
