import { AuthState } from '../core/models/user.model';
import { authReducer } from '../features/auth/store/auth.reducer';

export interface AppState {
  auth: AuthState;
}

export const appReducers = {
  auth: authReducer
};
