import { AuthState } from '../core/models/user.model';
import { authReducer } from '../features/auth/store/auth.reducer';
import { LeagueState, leagueReducer } from '../features/leagues/store/league.reducer';

export interface AppState {
  auth: AuthState;
  leagues: LeagueState;
}

export const appReducers = {
  auth: authReducer,
  leagues: leagueReducer
};
