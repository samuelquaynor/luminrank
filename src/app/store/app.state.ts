import { AuthState } from '../core/models/user.model';
import { UserState } from '../features/user/models/user.model';
import { authReducer } from '../features/auth/store/auth.reducer';
import { userReducer } from '../features/user/store/user.reducer';

export interface AppState {
  auth: AuthState;
  user: UserState;
}

export const appReducers = {
  auth: authReducer,
  user: userReducer
};
