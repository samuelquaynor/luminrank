/**
 * Leaderboard Models for Phase 2: Match Recording & Leaderboard
 */

/**
 * Leaderboard entry interface
 * Represents a single player's stats and ranking in a league
 */
export interface LeaderboardEntry {
  rank: number;
  profile_id: string;
  display_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  points: number;
  win_rate: number; // Percentage (0-100)
}

/**
 * Leaderboard response interface
 * Contains the full leaderboard for a league
 */
export interface Leaderboard {
  league_id: string;
  entries: LeaderboardEntry[];
  updated_at: string;
}

/**
 * Player stats summary (for individual player view)
 */
export interface PlayerStats {
  profile_id: string;
  display_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  points: number;
  win_rate: number;
  rank?: number;
  recent_form?: MatchResult[]; // Last 5 matches (optional, for future)
}

/**
 * Match result for recent form tracking
 */
export enum MatchResult {
  WIN = 'W',
  LOSS = 'L'
}

