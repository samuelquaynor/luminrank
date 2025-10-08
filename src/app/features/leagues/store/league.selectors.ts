import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LeagueState } from './league.reducer';

export const selectLeagueState = createFeatureSelector<LeagueState>('leagues');

export const selectAllLeagues = createSelector(
  selectLeagueState,
  (state) => state.leagues
);

export const selectSelectedLeague = createSelector(
  selectLeagueState,
  (state) => state.selectedLeague
);

export const selectLeagueLoading = createSelector(
  selectLeagueState,
  (state) => state.loading
);

export const selectLeagueError = createSelector(
  selectLeagueState,
  (state) => state.error
);

export const selectLeagueById = (id: string) => createSelector(
  selectAllLeagues,
  (leagues) => leagues.find(l => l.id === id)
);

export const selectLeagueMembers = (leagueId: string) => createSelector(
  selectLeagueState,
  (state) => state.members[leagueId] || []
);

export const selectMyLeaguesCount = createSelector(
  selectAllLeagues,
  (leagues) => leagues.length
);
