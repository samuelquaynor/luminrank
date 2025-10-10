import { createReducer, on } from '@ngrx/store';
import { MatchWithDetails } from '../models/match.model';
import * as MatchActions from './match.actions';

/**
 * Match State Interface
 */
export interface MatchState {
  matches: MatchWithDetails[];
  selectedMatch: MatchWithDetails | null;
  loading: boolean;
  error: string | null;
  recordingMatch: boolean;
}

/**
 * Initial State
 */
export const initialState: MatchState = {
  matches: [],
  selectedMatch: null,
  loading: false,
  error: null,
  recordingMatch: false
};

/**
 * Match Reducer
 */
export const matchReducer = createReducer(
  initialState,

  // Record Match
  on(MatchActions.recordMatch, (state) => ({
    ...state,
    recordingMatch: true,
    error: null
  })),

  on(MatchActions.recordMatchSuccess, (state, { match }) => ({
    ...state,
    matches: [match, ...state.matches],
    recordingMatch: false,
    error: null
  })),

  on(MatchActions.recordMatchFailure, (state, { error }) => ({
    ...state,
    recordingMatch: false,
    error
  })),

  // Load League Matches
  on(MatchActions.loadLeagueMatches, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MatchActions.loadLeagueMatchesSuccess, (state, { matches }) => ({
    ...state,
    matches,
    loading: false,
    error: null
  })),

  on(MatchActions.loadLeagueMatchesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Match
  on(MatchActions.loadMatch, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MatchActions.loadMatchSuccess, (state, { match }) => ({
    ...state,
    selectedMatch: match,
    loading: false,
    error: null
  })),

  on(MatchActions.loadMatchFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Player Matches
  on(MatchActions.loadPlayerMatches, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MatchActions.loadPlayerMatchesSuccess, (state, { matches }) => ({
    ...state,
    matches,
    loading: false,
    error: null
  })),

  on(MatchActions.loadPlayerMatchesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Cancel Match
  on(MatchActions.cancelMatch, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(MatchActions.cancelMatchSuccess, (state, { match }) => ({
    ...state,
    matches: state.matches.filter(m => m.id !== match.id),
    loading: false,
    error: null
  })),

  on(MatchActions.cancelMatchFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear State
  on(MatchActions.clearMatchState, () => initialState),

  // Clear Error
  on(MatchActions.clearMatchError, (state) => ({
    ...state,
    error: null
  }))
);

