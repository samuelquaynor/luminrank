/**
 * Match Models for Phase 2: Match Recording & Leaderboard
 */

/**
 * Match status enum
 */
export enum MatchStatus {
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Match result enum (for participants)
 */
export enum MatchResult {
  WIN = 'win',
  LOSS = 'loss'
}

/**
 * Match participant interface
 */
export interface MatchParticipant {
  id: string;
  match_id: string;
  profile_id: string;
  score: number;
  result: MatchResult;
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
  match_date: string;
  recorded_by: string;
  recorded_at: string;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  
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
}

