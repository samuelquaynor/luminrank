import { createAction, props } from '@ngrx/store';
import { User, CreateUserData, UpdateUserData, UserListResponse } from '../models/user.model';

// Load Users
export const loadUsers = createAction(
  '[User] Load Users',
  props<{ page?: number; limit?: number }>()
);

export const loadUsersSuccess = createAction(
  '[User] Load Users Success',
  props<{ response: UserListResponse }>()
);

export const loadUsersFailure = createAction(
  '[User] Load Users Failure',
  props<{ error: string }>()
);

// Load User by ID
export const loadUserById = createAction(
  '[User] Load User by ID',
  props<{ id: string }>()
);

export const loadUserByIdSuccess = createAction(
  '[User] Load User by ID Success',
  props<{ user: User }>()
);

export const loadUserByIdFailure = createAction(
  '[User] Load User by ID Failure',
  props<{ error: string }>()
);

// Create User
export const createUser = createAction(
  '[User] Create User',
  props<{ userData: CreateUserData }>()
);

export const createUserSuccess = createAction(
  '[User] Create User Success',
  props<{ user: User }>()
);

export const createUserFailure = createAction(
  '[User] Create User Failure',
  props<{ error: string }>()
);

// Update User
export const updateUser = createAction(
  '[User] Update User',
  props<{ id: string; userData: UpdateUserData }>()
);

export const updateUserSuccess = createAction(
  '[User] Update User Success',
  props<{ user: User }>()
);

export const updateUserFailure = createAction(
  '[User] Update User Failure',
  props<{ error: string }>()
);

// Delete User
export const deleteUser = createAction(
  '[User] Delete User',
  props<{ id: string }>()
);

export const deleteUserSuccess = createAction(
  '[User] Delete User Success',
  props<{ id: string }>()
);

export const deleteUserFailure = createAction(
  '[User] Delete User Failure',
  props<{ error: string }>()
);

// Load Current User Profile
export const loadCurrentUserProfile = createAction(
  '[User] Load Current User Profile',
  props<{ userId: string }>()
);

export const loadCurrentUserProfileSuccess = createAction(
  '[User] Load Current User Profile Success',
  props<{ user: User }>()
);

export const loadCurrentUserProfileFailure = createAction(
  '[User] Load Current User Profile Failure',
  props<{ error: string }>()
);

// Update Current User Profile
export const updateCurrentUserProfile = createAction(
  '[User] Update Current User Profile',
  props<{ userId: string; profileData: Partial<User['profile']> }>()
);

export const updateCurrentUserProfileSuccess = createAction(
  '[User] Update Current User Profile Success',
  props<{ user: User }>()
);

export const updateCurrentUserProfileFailure = createAction(
  '[User] Update Current User Profile Failure',
  props<{ error: string }>()
);

// Search Users
export const searchUsers = createAction(
  '[User] Search Users',
  props<{ searchTerm: string }>()
);

export const searchUsersSuccess = createAction(
  '[User] Search Users Success',
  props<{ users: User[] }>()
);

export const searchUsersFailure = createAction(
  '[User] Search Users Failure',
  props<{ error: string }>()
);

// Select User
export const selectUser = createAction(
  '[User] Select User',
  props<{ user: User | null }>()
);

// Clear Users
export const clearUsers = createAction(
  '[User] Clear Users'
);

// Clear Error
export const clearUserError = createAction(
  '[User] Clear User Error'
);
