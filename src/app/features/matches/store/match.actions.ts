import { createAction, props } from '@ngrx/store';
import { Match, MatchWithDetails, CreateMatchRequest } from '../models/match.model';

/**
 * Match Actions for Phase 2: Match Recording & Leaderboard
 */

// Record Match
export const recordMatch = createAction(
  '[Match] Record Match',
  props<{ request: CreateMatchRequest }>()
);

export const recordMatchSuccess = createAction(
  '[Match] Record Match Success',
  props<{ match: MatchWithDetails }>()
);

export const recordMatchFailure = createAction(
  '[Match] Record Match Failure',
  props<{ error: string }>()
);

// Load League Matches
export const loadLeagueMatches = createAction(
  '[Match] Load League Matches',
  props<{ leagueId: string }>()
);

export const loadLeagueMatchesSuccess = createAction(
  '[Match] Load League Matches Success',
  props<{ matches: MatchWithDetails[] }>()
);

export const loadLeagueMatchesFailure = createAction(
  '[Match] Load League Matches Failure',
  props<{ error: string }>()
);

// Load Single Match
export const loadMatch = createAction(
  '[Match] Load Match',
  props<{ matchId: string }>()
);

export const loadMatchSuccess = createAction(
  '[Match] Load Match Success',
  props<{ match: MatchWithDetails }>()
);

export const loadMatchFailure = createAction(
  '[Match] Load Match Failure',
  props<{ error: string }>()
);

// Load Player Matches
export const loadPlayerMatches = createAction(
  '[Match] Load Player Matches',
  props<{ leagueId: string; profileId: string }>()
);

export const loadPlayerMatchesSuccess = createAction(
  '[Match] Load Player Matches Success',
  props<{ matches: MatchWithDetails[] }>()
);

export const loadPlayerMatchesFailure = createAction(
  '[Match] Load Player Matches Failure',
  props<{ error: string }>()
);

// Cancel Match
export const cancelMatch = createAction(
  '[Match] Cancel Match',
  props<{ matchId: string }>()
);

export const cancelMatchSuccess = createAction(
  '[Match] Cancel Match Success',
  props<{ match: Match }>()
);

export const cancelMatchFailure = createAction(
  '[Match] Cancel Match Failure',
  props<{ error: string }>()
);

// Clear Match State
export const clearMatchState = createAction('[Match] Clear Match State');

// Clear Match Error
export const clearMatchError = createAction('[Match] Clear Match Error');

