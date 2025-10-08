import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';

import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private router = inject(Router);
  private store = inject(Store);

  // Login Effect
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials }) =>
        this.authService.loginWithEmail(credentials).pipe(
          map((response) => AuthActions.loginSuccess({ response })),
          catchError((error) => of(AuthActions.loginFailure({ error: error.message })))
        )
      )
    )
  );

  // Login Success Effect
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ response }) => {
          this.storageService.saveToken(response.token);
          // Redirect to profile setup if user doesn't have a name
          if (!response.user.name) {
            this.router.navigate(['/profile-setup']);
          } else {
            this.router.navigate(['/']);
          }
        })
      ),
    { dispatch: false }
  );

  // Register Effect
  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      switchMap(({ registerData }) =>
        this.authService.registerWithEmail(registerData).pipe(
          map((response) => AuthActions.registerSuccess({ response })),
          catchError((error) => of(AuthActions.registerFailure({ error: error.message })))
        )
      )
    )
  );

  // Register Success Effect
  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(({ response }) => {
          this.storageService.saveToken(response.token);
          // Redirect to profile setup after registration
          this.router.navigate(['/profile-setup']);
        })
      ),
    { dispatch: false }
  );

  // Logout Effect
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess())) // Always succeed logout
        )
      )
    )
  );

  // Logout Success Effect
  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          this.storageService.removeToken();
          this.router.navigate(['/']);
        })
      ),
    { dispatch: false }
  );

  // Load User Effect
  loadUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadUserFromToken),
      switchMap(({ token }) =>
        this.authService.getCurrentUser(token).pipe(
          map((user) => {
            if (user) {
              return AuthActions.loadUserSuccess({ user });
            } else {
              return AuthActions.loadUserFailure({ error: 'Invalid token' });
            }
          }),
          catchError((error) => of(AuthActions.loadUserFailure({ error: error.message })))
        )
      )
    )
  );

  // Check Auth Effect
  checkAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkAuth),
      map(() => {
        const token = this.storageService.getValidToken();
        if (token) {
          return AuthActions.loadUserFromToken({ token });
        } else {
          return AuthActions.logoutSuccess();
        }
      })
    )
  );

  // Load User Success Effect
  loadUserSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loadUserSuccess),
        tap((action) => {
          // User loaded successfully, no additional action needed
        })
      ),
    { dispatch: false }
  );
}
