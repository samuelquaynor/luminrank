import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LeaderboardState } from './leaderboard.reducer';

/**
 * Leaderboard Selectors for Phase 2: Match Recording & Leaderboard
 */

// Feature selector
export const selectLeaderboardState = createFeatureSelector<LeaderboardState>('leaderboard');

// Select leaderboard
export const selectLeaderboard = createSelector(
  selectLeaderboardState,
  (state) => state.leaderboard
);

// Select leaderboard entries
export const selectLeaderboardEntries = createSelector(
  selectLeaderboard,
  (leaderboard) => leaderboard?.entries || []
);

// Select player stats
export const selectPlayerStats = createSelector(
  selectLeaderboardState,
  (state) => state.playerStats
);

// Select top players
export const selectTopPlayers = createSelector(
  selectLeaderboardState,
  (state) => state.topPlayers
);

// Select loading state
export const selectLeaderboardLoading = createSelector(
  selectLeaderboardState,
  (state) => state.loading
);

// Select error
export const selectLeaderboardError = createSelector(
  selectLeaderboardState,
  (state) => state.error
);

// Select player rank
export const selectPlayerRank = (profileId: string) =>
  createSelector(selectLeaderboardEntries, (entries) => {
    const entry = entries.find((e) => e.profile_id === profileId);
    return entry?.rank || null;
  });

// Select top 3 players
export const selectTop3Players = createSelector(
  selectLeaderboardEntries,
  (entries) => entries.slice(0, 3)
);

// Select player by profile ID
export const selectPlayerByProfileId = (profileId: string) =>
  createSelector(selectLeaderboardEntries, (entries) =>
    entries.find((e) => e.profile_id === profileId)
  );

// Check if player is in top N
export const selectIsPlayerInTopN = (profileId: string, n: number = 3) =>
  createSelector(selectPlayerRank(profileId), (rank) =>
    rank !== null && rank <= n
  );

// Select leaderboard count
export const selectLeaderboardCount = createSelector(
  selectLeaderboardEntries,
  (entries) => entries.length
);

// Check if leaderboard has entries
export const selectHasLeaderboardEntries = createSelector(
  selectLeaderboardCount,
  (count) => count > 0
);

