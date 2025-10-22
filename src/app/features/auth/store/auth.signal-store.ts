import { Injectable, inject, signal, computed } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, catchError, tap, map } from 'rxjs';
import { of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { StorageService } from '../../../core/services/storage.service';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '../../../core/models/user.model';

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

@Injectable()
export class AuthSignalStore {
  private authService = inject(AuthService);
  private storageService = inject(StorageService);

  // State signals
  private state = signal<AuthState>({
    user: null,
    token: null,
    loading: false,
    error: null,
    isAuthenticated: false,
  });

  // Selectors (computed signals)
  user = computed(() => this.state().user);
  token = computed(() => this.state().token);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);
  isAuthenticated = computed(() => this.state().isAuthenticated);

  // Derived selectors
  userRole = computed(() => this.user()?.role);
  isAdmin = computed(() => this.userRole() === 'ADMIN');
  isUser = computed(() => this.userRole() === 'USER');
  userEmail = computed(() => this.user()?.email);
  userName = computed(() => this.user()?.name);
  userId = computed(() => this.user()?.id);

  // Actions
  login = rxMethod<LoginCredentials>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap((credentials) =>
        this.authService.loginWithEmail(credentials).pipe(
          tap((response) => {
            this.setAuthSuccess(response);
            this.storageService.saveToken(response.token);
          }),
          catchError((error) => {
            this.setError(error.message || 'Login failed');
            return of(null);
          })
        )
      )
    )
  );

  register = rxMethod<RegisterData>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap((registerData) =>
        this.authService.registerWithEmail(registerData).pipe(
          tap((response) => {
            this.setAuthSuccess(response);
            this.storageService.saveToken(response.token);
          }),
          catchError((error) => {
            this.setError(error.message || 'Registration failed');
            return of(null);
          })
        )
      )
    )
  );

  logout = rxMethod<void>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap(() =>
        this.authService.logout().pipe(
          tap(() => {
            this.setLogoutSuccess();
            this.storageService.removeToken();
          }),
          catchError(() => {
            // Even if logout fails, clear local state
            this.setLogoutSuccess();
            this.storageService.removeToken();
            return of(null);
          })
        )
      )
    )
  );

  checkAuth = rxMethod<void>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap(() => {
        const token = this.storageService.getValidToken();
        if (token) {
          return this.authService.getCurrentUser(token).pipe(
            tap((user) => {
              if (user) {
                this.setUserLoaded(user);
              } else {
                this.setLogoutSuccess();
              }
            }),
            catchError(() => {
              this.setLogoutSuccess();
              return of(null);
            })
          );
        } else {
          this.setLogoutSuccess();
          return of(null);
        }
      })
    )
  );

  clearError = () => {
    this.state.update((state) => ({ ...state, error: null }));
  };

  // Private helper methods
  private setLoading(loading: boolean) {
    this.state.update((state) => ({ ...state, loading, error: null }));
  }

  private setAuthSuccess(response: AuthResponse) {
    this.state.update((state) => ({
      ...state,
      user: response.user,
      token: response.token,
      loading: false,
      error: null,
      isAuthenticated: true,
    }));
  }

  private setUserLoaded(user: User) {
    this.state.update((state) => ({
      ...state,
      user,
      loading: false,
      error: null,
      isAuthenticated: true,
    }));
  }

  private setLogoutSuccess() {
    this.state.update((state) => ({
      ...state,
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    }));
  }

  private setError(error: string) {
    this.state.update((state) => ({
      ...state,
      user: null,
      token: null,
      loading: false,
      error,
      isAuthenticated: false,
    }));
  }
}
