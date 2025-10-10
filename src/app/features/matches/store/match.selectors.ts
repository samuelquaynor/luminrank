import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MatchState } from './match.reducer';

/**
 * Match Selectors for Phase 2: Match Recording & Leaderboard
 */

// Feature selector
export const selectMatchState = createFeatureSelector<MatchState>('match');

// Select all matches
export const selectAllMatches = createSelector(
  selectMatchState,
  (state) => state.matches
);

// Select selected match
export const selectSelectedMatch = createSelector(
  selectMatchState,
  (state) => state.selectedMatch
);

// Select loading state
export const selectMatchLoading = createSelector(
  selectMatchState,
  (state) => state.loading
);

// Select recording state
export const selectMatchRecording = createSelector(
  selectMatchState,
  (state) => state.recordingMatch
);

// Select error
export const selectMatchError = createSelector(
  selectMatchState,
  (state) => state.error
);

// Select match by ID
export const selectMatchById = (matchId: string) =>
  createSelector(selectAllMatches, (matches) =>
    matches.find((match) => match.id === matchId)
  );

// Select recent matches (last N)
export const selectRecentMatches = (limit: number = 5) =>
  createSelector(selectAllMatches, (matches) =>
    matches.slice(0, limit)
  );

// Select matches for a specific player
export const selectMatchesForPlayer = (profileId: string) =>
  createSelector(selectAllMatches, (matches) =>
    matches.filter((match) =>
      match.participants?.some((p) => p.profile_id === profileId)
    )
  );

// Select player's wins
export const selectPlayerWins = (profileId: string) =>
  createSelector(selectAllMatches, (matches) =>
    matches.filter((match) =>
      match.participants?.some(
        (p) => p.profile_id === profileId && p.result === 'win'
      )
    )
  );

// Select player's losses
export const selectPlayerLosses = (profileId: string) =>
  createSelector(selectAllMatches, (matches) =>
    matches.filter((match) =>
      match.participants?.some(
        (p) => p.profile_id === profileId && p.result === 'loss'
      )
    )
  );

// Select match count
export const selectMatchCount = createSelector(
  selectAllMatches,
  (matches) => matches.length
);

// Check if there are any matches
export const selectHasMatches = createSelector(
  selectMatchCount,
  (count) => count > 0
);

