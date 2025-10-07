import { createReducer, on } from '@ngrx/store';
import { UserState } from '../models/user.model';
import * as UserActions from './user.actions';

const initialState: UserState = {
  currentUser: null,
  users: [],
  loading: false,
  error: null,
  selectedUser: null
};

export const userReducer = createReducer(
  initialState,

  // Load Users
  on(UserActions.loadUsers, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserActions.loadUsersSuccess, (state, { response }) => ({
    ...state,
    users: response.users,
    loading: false,
    error: null
  })),

  on(UserActions.loadUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load User by ID
  on(UserActions.loadUserById, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserActions.loadUserByIdSuccess, (state, { user }) => ({
    ...state,
    selectedUser: user,
    loading: false,
    error: null
  })),

  on(UserActions.loadUserByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Create User
  on(UserActions.createUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserActions.createUserSuccess, (state, { user }) => ({
    ...state,
    users: [...state.users, user],
    loading: false,
    error: null
  })),

  on(UserActions.createUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update User
  on(UserActions.updateUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserActions.updateUserSuccess, (state, { user }) => ({
    ...state,
    users: state.users.map(u => u.id === user.id ? user : u),
    selectedUser: state.selectedUser?.id === user.id ? user : state.selectedUser,
    currentUser: state.currentUser?.id === user.id ? user : state.currentUser,
    loading: false,
    error: null
  })),

  on(UserActions.updateUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Delete User
  on(UserActions.deleteUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserActions.deleteUserSuccess, (state, { id }) => ({
    ...state,
    users: state.users.filter(u => u.id !== id),
    selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
    currentUser: state.currentUser?.id === id ? null : state.currentUser,
    loading: false,
    error: null
  })),

  on(UserActions.deleteUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Current User Profile
  on(UserActions.loadCurrentUserProfile, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserActions.loadCurrentUserProfileSuccess, (state, { user }) => ({
    ...state,
    currentUser: user,
    loading: false,
    error: null
  })),

  on(UserActions.loadCurrentUserProfileFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Update Current User Profile
  on(UserActions.updateCurrentUserProfile, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserActions.updateCurrentUserProfileSuccess, (state, { user }) => ({
    ...state,
    currentUser: user,
    users: state.users.map(u => u.id === user.id ? user : u),
    selectedUser: state.selectedUser?.id === user.id ? user : state.selectedUser,
    loading: false,
    error: null
  })),

  on(UserActions.updateCurrentUserProfileFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Search Users
  on(UserActions.searchUsers, (state) => ({
    ...state,
    loading: true,
    error: null
  })),

  on(UserActions.searchUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loading: false,
    error: null
  })),

  on(UserActions.searchUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Select User
  on(UserActions.selectUser, (state, { user }) => ({
    ...state,
    selectedUser: user
  })),

  // Clear Users
  on(UserActions.clearUsers, (state) => ({
    ...state,
    users: [],
    selectedUser: null,
    error: null
  })),

  // Clear Error
  on(UserActions.clearUserError, (state) => ({
    ...state,
    error: null
  }))
);
