import { AuthState } from '../core/models/user.model';
import { authReducer } from '../features/auth/store/auth.reducer';
import { LeagueState, leagueReducer } from '../features/leagues/store/league.reducer';
import { MatchState, matchReducer } from '../features/matches/store/match.reducer';
import { LeaderboardState, leaderboardReducer } from '../features/matches/store/leaderboard.reducer';

export interface AppState {
  auth: AuthState;
  leagues: LeagueState;
  match: MatchState;
  leaderboard: LeaderboardState;
}

export const appReducers = {
  auth: authReducer,
  leagues: leagueReducer,
  match: matchReducer,
  leaderboard: leaderboardReducer
};
