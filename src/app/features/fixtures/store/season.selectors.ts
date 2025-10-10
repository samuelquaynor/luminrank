import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SeasonState } from './season.reducer';
import { SeasonStatus } from '../models/season.model';

export const selectSeasonState = createFeatureSelector<SeasonState>('season');

export const selectAllSeasons = createSelector(
  selectSeasonState,
  (state) => state.seasons
);

export const selectActiveSeason = createSelector(
  selectSeasonState,
  (state) => state.activeSeason
);

export const selectSelectedSeason = createSelector(
  selectSeasonState,
  (state) => state.selectedSeason
);

export const selectSeasonLoading = createSelector(
  selectSeasonState,
  (state) => state.loading
);

export const selectSeasonError = createSelector(
  selectSeasonState,
  (state) => state.error
);

// Derived selectors
export const selectUpcomingSeasons = createSelector(
  selectAllSeasons,
  (seasons) => seasons.filter(s => s.status === SeasonStatus.UPCOMING)
);

export const selectCompletedSeasons = createSelector(
  selectAllSeasons,
  (seasons) => seasons.filter(s => s.status === SeasonStatus.COMPLETED)
);

export const selectSeasonById = (seasonId: string) => createSelector(
  selectAllSeasons,
  (seasons) => seasons.find(s => s.id === seasonId)
);

export const selectHasActiveSeason = createSelector(
  selectActiveSeason,
  (season) => season !== null
);

