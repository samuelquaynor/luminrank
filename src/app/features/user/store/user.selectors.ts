import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from '../models/user.model';

export const selectUserState = createFeatureSelector<UserState>('user');

// Current User Selectors
export const selectCurrentUser = createSelector(
  selectUserState,
  (state) => state.currentUser
);

export const selectCurrentUserProfile = createSelector(
  selectCurrentUser,
  (user) => user?.profile
);

export const selectCurrentUserRole = createSelector(
  selectCurrentUser,
  (user) => user?.role
);

export const selectCurrentUserPreferences = createSelector(
  selectCurrentUserProfile,
  (profile) => profile?.preferences
);

// Users List Selectors
export const selectUsers = createSelector(
  selectUserState,
  (state) => state.users
);

export const selectSelectedUser = createSelector(
  selectUserState,
  (state) => state.selectedUser
);

export const selectUserById = (id: string) => createSelector(
  selectUsers,
  (users) => users.find(user => user.id === id)
);

// Loading and Error Selectors
export const selectUserLoading = createSelector(
  selectUserState,
  (state) => state.loading
);

export const selectUserError = createSelector(
  selectUserState,
  (state) => state.error
);

// Computed Selectors
export const selectActiveUsers = createSelector(
  selectUsers,
  (users) => users.filter(user => user.isActive)
);

export const selectInactiveUsers = createSelector(
  selectUsers,
  (users) => users.filter(user => !user.isActive)
);

export const selectUsersByRole = (role: string) => createSelector(
  selectUsers,
  (users) => users.filter(user => user.role === role)
);

export const selectAdminUsers = createSelector(
  selectUsers,
  (users) => users.filter(user => user.role === 'ADMIN')
);

export const selectRegularUsers = createSelector(
  selectUsers,
  (users) => users.filter(user => user.role === 'USER')
);

export const selectUsersCount = createSelector(
  selectUsers,
  (users) => users.length
);

export const selectActiveUsersCount = createSelector(
  selectActiveUsers,
  (users) => users.length
);

// User Search Selectors
export const selectUsersBySearchTerm = (searchTerm: string) => createSelector(
  selectUsers,
  (users) => {
    if (!searchTerm) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }
);

// Permission Selectors
export const selectCanManageUsers = createSelector(
  selectCurrentUserRole,
  (role) => role === 'ADMIN'
);

export const selectCanViewUserProfile = createSelector(
  selectCurrentUser,
  selectSelectedUser,
  (currentUser, selectedUser) => {
    if (!currentUser || !selectedUser) return false;
    return currentUser.role === 'ADMIN' || currentUser.id === selectedUser.id;
  }
);

export const selectCanEditUserProfile = createSelector(
  selectCurrentUser,
  selectSelectedUser,
  (currentUser, selectedUser) => {
    if (!currentUser || !selectedUser) return false;
    return currentUser.role === 'ADMIN' || currentUser.id === selectedUser.id;
  }
);

export const selectCanDeleteUser = createSelector(
  selectCurrentUser,
  selectSelectedUser,
  (currentUser, selectedUser) => {
    if (!currentUser || !selectedUser) return false;
    // Admins can delete users, but not themselves
    return currentUser.role === 'ADMIN' && currentUser.id !== selectedUser.id;
  }
);
