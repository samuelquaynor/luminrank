import { createReducer, on } from '@ngrx/store';
import { Season } from '../models/season.model';
import * as SeasonActions from './season.actions';

export interface SeasonState {
  seasons: Season[];
  activeSeason: Season | null;
  selectedSeason: Season | null;
  loading: boolean;
  error: string | null;
}

export const initialState: SeasonState = {
  seasons: [],
  activeSeason: null,
  selectedSeason: null,
  loading: false,
  error: null
};

export const seasonReducer = createReducer(
  initialState,

  // Create Season
  on(SeasonActions.createSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SeasonActions.createSeasonSuccess, (state, { season }) => ({
    ...state,
    seasons: [season, ...state.seasons],
    loading: false
  })),
  on(SeasonActions.createSeasonFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load League Seasons
  on(SeasonActions.loadLeagueSeasons, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SeasonActions.loadLeagueSeasonsSuccess, (state, { seasons }) => ({
    ...state,
    seasons,
    loading: false
  })),
  on(SeasonActions.loadLeagueSeasonsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Active Season
  on(SeasonActions.loadActiveSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SeasonActions.loadActiveSeasonSuccess, (state, { season }) => ({
    ...state,
    activeSeason: season,
    loading: false
  })),
  on(SeasonActions.loadActiveSeasonFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Season By ID
  on(SeasonActions.loadSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SeasonActions.loadSeasonSuccess, (state, { season }) => ({
    ...state,
    selectedSeason: season,
    loading: false
  })),
  on(SeasonActions.loadSeasonFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Season
  on(SeasonActions.updateSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SeasonActions.updateSeasonSuccess, (state, { season }) => ({
    ...state,
    seasons: state.seasons.map(s => s.id === season.id ? season : s),
    selectedSeason: state.selectedSeason?.id === season.id ? season : state.selectedSeason,
    activeSeason: state.activeSeason?.id === season.id ? season : state.activeSeason,
    loading: false
  })),
  on(SeasonActions.updateSeasonFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // End Season
  on(SeasonActions.endSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SeasonActions.endSeasonSuccess, (state, { season }) => ({
    ...state,
    seasons: state.seasons.map(s => s.id === season.id ? season : s),
    activeSeason: state.activeSeason?.id === season.id ? null : state.activeSeason,
    loading: false
  })),
  on(SeasonActions.endSeasonFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete Season
  on(SeasonActions.deleteSeason, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(SeasonActions.deleteSeasonSuccess, (state, { seasonId }) => ({
    ...state,
    seasons: state.seasons.filter(s => s.id !== seasonId),
    selectedSeason: state.selectedSeason?.id === seasonId ? null : state.selectedSeason,
    loading: false
  })),
  on(SeasonActions.deleteSeasonFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear Error
  on(SeasonActions.clearSeasonError, (state) => ({
    ...state,
    error: null
  })),

  // Clear Seasons
  on(SeasonActions.clearSeasons, () => initialState)
);

