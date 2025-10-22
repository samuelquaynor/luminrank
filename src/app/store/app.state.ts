// Auth and League are now handled by signal stores, no longer needed in app state
import { MatchState, matchReducer } from '../features/matches/store/match.reducer';
import {
  LeaderboardState,
  leaderboardReducer,
} from '../features/matches/store/leaderboard.reducer';
import { FixtureState, fixtureReducer } from '../features/fixtures/store/fixture.reducer';
import { SeasonState, seasonReducer } from '../features/fixtures/store/season.reducer';
import { DisputeState, disputeReducer } from '../features/disputes/store/dispute.reducer';

export interface AppState {
  match: MatchState;
  leaderboard: LeaderboardState;
  fixture: FixtureState;
  season: SeasonState;
  dispute: DisputeState;
}

export const appReducers = {
  match: matchReducer,
  leaderboard: leaderboardReducer,
  fixture: fixtureReducer,
  season: seasonReducer,
  dispute: disputeReducer,
};
