import { createAction, props } from '@ngrx/store';
import { Leaderboard, LeaderboardEntry, PlayerStats } from '../models/leaderboard.model';

/**
 * Leaderboard Actions for Phase 2: Match Recording & Leaderboard
 */

// Load Leaderboard
export const loadLeaderboard = createAction(
  '[Leaderboard] Load Leaderboard',
  props<{ leagueId: string }>()
);

export const loadLeaderboardSuccess = createAction(
  '[Leaderboard] Load Leaderboard Success',
  props<{ leaderboard: Leaderboard }>()
);

export const loadLeaderboardFailure = createAction(
  '[Leaderboard] Load Leaderboard Failure',
  props<{ error: string }>()
);

// Load Player Stats
export const loadPlayerStats = createAction(
  '[Leaderboard] Load Player Stats',
  props<{ leagueId: string; profileId: string }>()
);

export const loadPlayerStatsSuccess = createAction(
  '[Leaderboard] Load Player Stats Success',
  props<{ stats: PlayerStats | null }>()
);

export const loadPlayerStatsFailure = createAction(
  '[Leaderboard] Load Player Stats Failure',
  props<{ error: string }>()
);

// Load Top Players
export const loadTopPlayers = createAction(
  '[Leaderboard] Load Top Players',
  props<{ leagueId: string; limit: number }>()
);

export const loadTopPlayersSuccess = createAction(
  '[Leaderboard] Load Top Players Success',
  props<{ topPlayers: LeaderboardEntry[] }>()
);

export const loadTopPlayersFailure = createAction(
  '[Leaderboard] Load Top Players Failure',
  props<{ error: string }>()
);

// Clear Leaderboard State
export const clearLeaderboardState = createAction('[Leaderboard] Clear Leaderboard State');

// Clear Leaderboard Error
export const clearLeaderboardError = createAction('[Leaderboard] Clear Leaderboard Error');

