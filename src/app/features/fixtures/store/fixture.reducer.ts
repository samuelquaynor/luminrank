import { createReducer, on } from '@ngrx/store';
import { FixtureWithDetails, FixtureGenerationResult } from '../models/fixture.model';
import * as FixtureActions from './fixture.actions';

export interface FixtureState {
  fixtures: FixtureWithDetails[];
  selectedFixture: FixtureWithDetails | null;
  generationResult: FixtureGenerationResult | null;
  loading: boolean;
  error: string | null;
}

export const initialState: FixtureState = {
  fixtures: [],
  selectedFixture: null,
  generationResult: null,
  loading: false,
  error: null
};

export const fixtureReducer = createReducer(
  initialState,

  // Generate Fixtures
  on(FixtureActions.generateFixtures, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FixtureActions.generateFixturesSuccess, (state, { result }) => ({
    ...state,
    generationResult: result,
    loading: false
  })),
  on(FixtureActions.generateFixturesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load League Fixtures
  on(FixtureActions.loadLeagueFixtures, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FixtureActions.loadLeagueFixturesSuccess, (state, { fixtures }) => ({
    ...state,
    fixtures,
    loading: false
  })),
  on(FixtureActions.loadLeagueFixturesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Fixture
  on(FixtureActions.loadFixture, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FixtureActions.loadFixtureSuccess, (state, { fixture }) => ({
    ...state,
    selectedFixture: fixture,
    loading: false
  })),
  on(FixtureActions.loadFixtureFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Player Fixtures
  on(FixtureActions.loadPlayerFixtures, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FixtureActions.loadPlayerFixturesSuccess, (state, { fixtures }) => ({
    ...state,
    fixtures,
    loading: false
  })),
  on(FixtureActions.loadPlayerFixturesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Fixture Status
  on(FixtureActions.updateFixtureStatus, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FixtureActions.updateFixtureStatusSuccess, (state, { fixture }) => ({
    ...state,
    fixtures: state.fixtures.map(f => 
      f.id === fixture.id ? { ...f, status: fixture.status } : f
    ),
    loading: false
  })),
  on(FixtureActions.updateFixtureStatusFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Link Match to Fixture
  on(FixtureActions.linkMatchToFixture, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FixtureActions.linkMatchToFixtureSuccess, (state, { fixture }) => ({
    ...state,
    fixtures: state.fixtures.map(f => 
      f.id === fixture.id ? { ...f, ...fixture } : f
    ),
    loading: false
  })),
  on(FixtureActions.linkMatchToFixtureFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Mark Overdue Fixtures
  on(FixtureActions.markOverdueFixtures, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(FixtureActions.markOverdueFixturesSuccess, (state) => ({
    ...state,
    loading: false
  })),
  on(FixtureActions.markOverdueFixturesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear Error
  on(FixtureActions.clearFixtureError, (state) => ({
    ...state,
    error: null
  })),

  // Clear Fixtures
  on(FixtureActions.clearFixtures, () => initialState)
);

