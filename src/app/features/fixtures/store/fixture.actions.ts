import { createAction, props } from '@ngrx/store';
import { 
  Fixture, 
  FixtureWithDetails, 
  GenerateFixturesRequest, 
  FixtureGenerationResult,
  FixtureStatus 
} from '../models/fixture.model';

// Generate Fixtures
export const generateFixtures = createAction(
  '[Fixture] Generate Fixtures',
  props<{ request: GenerateFixturesRequest }>()
);

export const generateFixturesSuccess = createAction(
  '[Fixture] Generate Fixtures Success',
  props<{ result: FixtureGenerationResult }>()
);

export const generateFixturesFailure = createAction(
  '[Fixture] Generate Fixtures Failure',
  props<{ error: string }>()
);

// Load League Fixtures
export const loadLeagueFixtures = createAction(
  '[Fixture] Load League Fixtures',
  props<{ leagueId: string; seasonId?: string }>()
);

export const loadLeagueFixturesSuccess = createAction(
  '[Fixture] Load League Fixtures Success',
  props<{ fixtures: FixtureWithDetails[] }>()
);

export const loadLeagueFixturesFailure = createAction(
  '[Fixture] Load League Fixtures Failure',
  props<{ error: string }>()
);

// Load Single Fixture
export const loadFixture = createAction(
  '[Fixture] Load Fixture',
  props<{ fixtureId: string }>()
);

export const loadFixtureSuccess = createAction(
  '[Fixture] Load Fixture Success',
  props<{ fixture: FixtureWithDetails }>()
);

export const loadFixtureFailure = createAction(
  '[Fixture] Load Fixture Failure',
  props<{ error: string }>()
);

// Load Player Fixtures
export const loadPlayerFixtures = createAction(
  '[Fixture] Load Player Fixtures',
  props<{ profileId: string; leagueId: string; seasonId?: string }>()
);

export const loadPlayerFixturesSuccess = createAction(
  '[Fixture] Load Player Fixtures Success',
  props<{ fixtures: FixtureWithDetails[] }>()
);

export const loadPlayerFixturesFailure = createAction(
  '[Fixture] Load Player Fixtures Failure',
  props<{ error: string }>()
);

// Update Fixture Status
export const updateFixtureStatus = createAction(
  '[Fixture] Update Fixture Status',
  props<{ fixtureId: string; status: FixtureStatus }>()
);

export const updateFixtureStatusSuccess = createAction(
  '[Fixture] Update Fixture Status Success',
  props<{ fixture: Fixture }>()
);

export const updateFixtureStatusFailure = createAction(
  '[Fixture] Update Fixture Status Failure',
  props<{ error: string }>()
);

// Link Match to Fixture
export const linkMatchToFixture = createAction(
  '[Fixture] Link Match to Fixture',
  props<{ fixtureId: string; matchId: string; winnerId: string }>()
);

export const linkMatchToFixtureSuccess = createAction(
  '[Fixture] Link Match to Fixture Success',
  props<{ fixture: Fixture }>()
);

export const linkMatchToFixtureFailure = createAction(
  '[Fixture] Link Match to Fixture Failure',
  props<{ error: string }>()
);

// Mark Overdue Fixtures
export const markOverdueFixtures = createAction(
  '[Fixture] Mark Overdue Fixtures'
);

export const markOverdueFixturesSuccess = createAction(
  '[Fixture] Mark Overdue Fixtures Success',
  props<{ count: number }>()
);

export const markOverdueFixturesFailure = createAction(
  '[Fixture] Mark Overdue Fixtures Failure',
  props<{ error: string }>()
);

// Clear Fixture Error
export const clearFixtureError = createAction(
  '[Fixture] Clear Fixture Error'
);

// Clear Fixtures
export const clearFixtures = createAction(
  '[Fixture] Clear Fixtures'
);

