import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../../../core/models/user.model';
import { UserRole } from '../../../core/models/user.model';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectUser = createSelector(
  selectAuthState,
  (state) => state.user
);

export const selectToken = createSelector(
  selectAuthState,
  (state) => state.token
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state) => state.isAuthenticated
);

export const selectIsLoading = createSelector(
  selectAuthState,
  (state) => state.loading
);

export const selectError = createSelector(
  selectAuthState,
  (state) => state.error
);

export const selectUserRole = createSelector(
  selectUser,
  (user) => user?.role
);

export const selectIsAdmin = createSelector(
  selectUserRole,
  (role) => role === UserRole.ADMIN
);

export const selectIsUser = createSelector(
  selectUserRole,
  (role) => role === UserRole.USER
);

export const selectUserEmail = createSelector(
  selectUser,
  (user) => user?.email
);

export const selectUserName = createSelector(
  selectUser,
  (user) => user?.name
);

export const selectUserId = createSelector(
  selectUser,
  (user) => user?.id
);
