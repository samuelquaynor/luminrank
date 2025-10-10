import { createAction, props } from '@ngrx/store';
import { Season, CreateSeasonRequest, UpdateSeasonRequest } from '../models/season.model';

// Create Season
export const createSeason = createAction(
  '[Season] Create Season',
  props<{ request: CreateSeasonRequest }>()
);

export const createSeasonSuccess = createAction(
  '[Season] Create Season Success',
  props<{ season: Season }>()
);

export const createSeasonFailure = createAction(
  '[Season] Create Season Failure',
  props<{ error: string }>()
);

// Load League Seasons
export const loadLeagueSeasons = createAction(
  '[Season] Load League Seasons',
  props<{ leagueId: string }>()
);

export const loadLeagueSeasonsSuccess = createAction(
  '[Season] Load League Seasons Success',
  props<{ seasons: Season[] }>()
);

export const loadLeagueSeasonsFailure = createAction(
  '[Season] Load League Seasons Failure',
  props<{ error: string }>()
);

// Load Active Season
export const loadActiveSeason = createAction(
  '[Season] Load Active Season',
  props<{ leagueId: string }>()
);

export const loadActiveSeasonSuccess = createAction(
  '[Season] Load Active Season Success',
  props<{ season: Season | null }>()
);

export const loadActiveSeasonFailure = createAction(
  '[Season] Load Active Season Failure',
  props<{ error: string }>()
);

// Load Season By ID
export const loadSeason = createAction(
  '[Season] Load Season',
  props<{ seasonId: string }>()
);

export const loadSeasonSuccess = createAction(
  '[Season] Load Season Success',
  props<{ season: Season }>()
);

export const loadSeasonFailure = createAction(
  '[Season] Load Season Failure',
  props<{ error: string }>()
);

// Update Season
export const updateSeason = createAction(
  '[Season] Update Season',
  props<{ seasonId: string; request: UpdateSeasonRequest }>()
);

export const updateSeasonSuccess = createAction(
  '[Season] Update Season Success',
  props<{ season: Season }>()
);

export const updateSeasonFailure = createAction(
  '[Season] Update Season Failure',
  props<{ error: string }>()
);

// End Season
export const endSeason = createAction(
  '[Season] End Season',
  props<{ seasonId: string; endDate: string }>()
);

export const endSeasonSuccess = createAction(
  '[Season] End Season Success',
  props<{ season: Season }>()
);

export const endSeasonFailure = createAction(
  '[Season] End Season Failure',
  props<{ error: string }>()
);

// Delete Season
export const deleteSeason = createAction(
  '[Season] Delete Season',
  props<{ seasonId: string }>()
);

export const deleteSeasonSuccess = createAction(
  '[Season] Delete Season Success',
  props<{ seasonId: string }>()
);

export const deleteSeasonFailure = createAction(
  '[Season] Delete Season Failure',
  props<{ error: string }>()
);

// Clear Season Error
export const clearSeasonError = createAction(
  '[Season] Clear Season Error'
);

// Clear Seasons
export const clearSeasons = createAction(
  '[Season] Clear Seasons'
);

