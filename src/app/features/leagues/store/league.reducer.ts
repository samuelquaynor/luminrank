import { createReducer, on } from '@ngrx/store';
import { League, LeagueWithDetails, LeagueMember } from '../models/league.model';
import * as LeagueActions from './league.actions';

export interface LeagueState {
  leagues: League[];
  selectedLeague: LeagueWithDetails | null;
  members: { [leagueId: string]: LeagueMember[] };
  loading: boolean;
  error: string | null;
}

export const initialState: LeagueState = {
  leagues: [],
  selectedLeague: null,
  members: {},
  loading: false,
  error: null
};

export const leagueReducer = createReducer(
  initialState,

  // Load my leagues
  on(LeagueActions.loadMyLeagues, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LeagueActions.loadMyLeaguesSuccess, (state, { leagues }) => ({
    ...state,
    leagues,
    loading: false,
    error: null
  })),
  on(LeagueActions.loadMyLeaguesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load single league
  on(LeagueActions.loadLeague, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LeagueActions.loadLeagueSuccess, (state, { league }) => ({
    ...state,
    selectedLeague: league,
    loading: false,
    error: null
  })),
  on(LeagueActions.loadLeagueFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create league
  on(LeagueActions.createLeague, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LeagueActions.createLeagueSuccess, (state, { league }) => ({
    ...state,
    leagues: [league, ...state.leagues],
    loading: false,
    error: null
  })),
  on(LeagueActions.createLeagueFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update league
  on(LeagueActions.updateLeague, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LeagueActions.updateLeagueSuccess, (state, { league }) => ({
    ...state,
    leagues: state.leagues.map(l => l.id === league.id ? league : l),
    selectedLeague: state.selectedLeague?.id === league.id
      ? { ...state.selectedLeague, ...league }
      : state.selectedLeague,
    loading: false,
    error: null
  })),
  on(LeagueActions.updateLeagueFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete league
  on(LeagueActions.deleteLeague, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LeagueActions.deleteLeagueSuccess, (state, { id }) => ({
    ...state,
    leagues: state.leagues.filter(l => l.id !== id),
    selectedLeague: state.selectedLeague?.id === id ? null : state.selectedLeague,
    loading: false,
    error: null
  })),
  on(LeagueActions.deleteLeagueFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Join league
  on(LeagueActions.joinLeague, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LeagueActions.joinLeagueSuccess, (state, { league }) => ({
    ...state,
    leagues: [league, ...state.leagues],
    loading: false,
    error: null
  })),
  on(LeagueActions.joinLeagueFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Leave league
  on(LeagueActions.leaveLeague, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LeagueActions.leaveLeagueSuccess, (state, { id }) => ({
    ...state,
    leagues: state.leagues.filter(l => l.id !== id),
    selectedLeague: state.selectedLeague?.id === id ? null : state.selectedLeague,
    loading: false,
    error: null
  })),
  on(LeagueActions.leaveLeagueFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load members
  on(LeagueActions.loadLeagueMembers, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(LeagueActions.loadLeagueMembersSuccess, (state, { leagueId, members }) => ({
    ...state,
    members: {
      ...state.members,
      [leagueId]: members
    },
    loading: false,
    error: null
  })),
  on(LeagueActions.loadLeagueMembersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
