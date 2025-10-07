import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { UserService } from '../services/user.service';
import * as UserActions from './user.actions';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private userService = inject(UserService);

  // Load Users Effect
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUsers),
      switchMap(({ page = 1, limit = 10 }) =>
        this.userService.getUsers(page, limit).pipe(
          map(response => UserActions.loadUsersSuccess({ response })),
          catchError(error => of(UserActions.loadUsersFailure({ 
            error: error.message || 'Failed to load users' 
          })))
        )
      )
    )
  );

  // Load User by ID Effect
  loadUserById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUserById),
      switchMap(({ id }) =>
        this.userService.getUserById(id).pipe(
          map(user => user 
            ? UserActions.loadUserByIdSuccess({ user })
            : UserActions.loadUserByIdFailure({ error: 'User not found' })
          ),
          catchError(error => of(UserActions.loadUserByIdFailure({ 
            error: error.message || 'Failed to load user' 
          })))
        )
      )
    )
  );

  // Create User Effect
  createUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.createUser),
      switchMap(({ userData }) =>
        this.userService.createUser(userData).pipe(
          map(user => UserActions.createUserSuccess({ user })),
          catchError(error => of(UserActions.createUserFailure({ 
            error: error.message || 'Failed to create user' 
          })))
        )
      )
    )
  );

  // Update User Effect
  updateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateUser),
      switchMap(({ id, userData }) =>
        this.userService.updateUser(id, userData).pipe(
          map(user => UserActions.updateUserSuccess({ user })),
          catchError(error => of(UserActions.updateUserFailure({ 
            error: error.message || 'Failed to update user' 
          })))
        )
      )
    )
  );

  // Delete User Effect
  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.deleteUser),
      switchMap(({ id }) =>
        this.userService.deleteUser(id).pipe(
          map(() => UserActions.deleteUserSuccess({ id })),
          catchError(error => of(UserActions.deleteUserFailure({ 
            error: error.message || 'Failed to delete user' 
          })))
        )
      )
    )
  );

  // Load Current User Profile Effect
  loadCurrentUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadCurrentUserProfile),
      switchMap(({ userId }) =>
        this.userService.getCurrentUserProfile(userId).pipe(
          map(user => user 
            ? UserActions.loadCurrentUserProfileSuccess({ user })
            : UserActions.loadCurrentUserProfileFailure({ error: 'User profile not found' })
          ),
          catchError(error => of(UserActions.loadCurrentUserProfileFailure({ 
            error: error.message || 'Failed to load user profile' 
          })))
        )
      )
    )
  );

  // Update Current User Profile Effect
  updateCurrentUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateCurrentUserProfile),
      switchMap(({ userId, profileData }) =>
        this.userService.updateCurrentUserProfile(userId, profileData).pipe(
          map(user => UserActions.updateCurrentUserProfileSuccess({ user })),
          catchError(error => of(UserActions.updateCurrentUserProfileFailure({ 
            error: error.message || 'Failed to update user profile' 
          })))
        )
      )
    )
  );

  // Search Users Effect
  searchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.searchUsers),
      switchMap(({ searchTerm }) =>
        this.userService.searchUsers(searchTerm).pipe(
          map(users => UserActions.searchUsersSuccess({ users })),
          catchError(error => of(UserActions.searchUsersFailure({ 
            error: error.message || 'Failed to search users' 
          })))
        )
      )
    )
  );
}
