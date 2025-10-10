import { createReducer, on } from '@ngrx/store';
import { Leaderboard, LeaderboardEntry, PlayerStats } from '../models/leaderboard.model';
import * as LeaderboardActions from './leaderboard.actions';

/**
 * Leaderboard State Interface
 */
export interface LeaderboardState {
  leaderboard: Leaderboard | null;
  playerStats: PlayerStats | null;
  topPlayers: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial State
 */
export const initialState: LeaderboardState = {
  leaderboard: null,
  playerStats: null,
  topPlayers: [],
  loading: false,
  error: null
};

/**
 * Leaderboard Reducer
 */
export const leaderboardReducer = createReducer(
  initialState,

  // Load Leaderboard
  on(LeaderboardActions.loadLeaderboard, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(LeaderboardActions.loadLeaderboardSuccess, (state, { leaderboard }) => ({
    ...state,
    leaderboard,
    loading: false,
    error: null
  })),

  on(LeaderboardActions.loadLeaderboardFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Player Stats
  on(LeaderboardActions.loadPlayerStats, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(LeaderboardActions.loadPlayerStatsSuccess, (state, { stats }) => ({
    ...state,
    playerStats: stats,
    loading: false,
    error: null
  })),

  on(LeaderboardActions.loadPlayerStatsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Top Players
  on(LeaderboardActions.loadTopPlayers, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(LeaderboardActions.loadTopPlayersSuccess, (state, { topPlayers }) => ({
    ...state,
    topPlayers,
    loading: false,
    error: null
  })),

  on(LeaderboardActions.loadTopPlayersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear State
  on(LeaderboardActions.clearLeaderboardState, () => initialState),

  // Clear Error
  on(LeaderboardActions.clearLeaderboardError, (state) => ({
    ...state,
    error: null
  }))
);

