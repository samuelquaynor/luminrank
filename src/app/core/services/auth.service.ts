import { Injectable } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { createClient, SupabaseClient, AuthResponse as SupabaseAuthResponse, User as SupabaseUser } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

import { User, UserRole, LoginCredentials, RegisterData, AuthResponse } from '../models/user.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private storageService: StorageService) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  /**
   * Login with email and password using Supabase Auth
   */
  loginWithEmail(credentials: LoginCredentials): Observable<AuthResponse> {
    return from(
      this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })
    ).pipe(
      switchMap((response: SupabaseAuthResponse) => {
        if (response.error) {
          return throwError(() => ({
            message: response.error.message || 'Login failed',
            status: 401,
            timestamp: new Date().toISOString()
          }));
        }

        if (!response.data.user) {
          return throwError(() => ({
            message: 'No user data received',
            status: 401,
            timestamp: new Date().toISOString()
          }));
        }

        // Get user profile from our profiles table
        return this.getUserProfile(response.data.user.id).pipe(
          map((profile) => ({
            user: profile,
            token: response.data.session?.access_token || '',
            expiresIn: response.data.session?.expires_in || 3600
          }))
        );
      }),
      catchError((error) => {
        if (error.status) {
          return throwError(() => error);
        }
        return throwError(() => ({
          message: error.message || 'Login failed',
          status: 401,
          timestamp: new Date().toISOString()
        }));
      })
    );
  }

  /**
   * Register a new user with email and password using Supabase Auth
   * User profile data (name, etc.) can be updated later via updateProfile
   */
  registerWithEmail(registerData: RegisterData): Observable<AuthResponse> {
    return from(
      this.supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password
      })
    ).pipe(
      switchMap((response: SupabaseAuthResponse) => {
        if (response.error) {
          return throwError(() => ({
            message: response.error.message || 'Registration failed',
            status: 409,
            timestamp: new Date().toISOString()
          }));
        }

        if (!response.data.user) {
          return throwError(() => ({
            message: 'No user data received',
            status: 409,
            timestamp: new Date().toISOString()
          }));
        }

        // The user profile will be created automatically by our database trigger
        // Get the created profile
        return this.getUserProfile(response.data.user.id).pipe(
          map((profile) => ({
            user: profile,
            token: response.data.session?.access_token || '',
            expiresIn: response.data.session?.expires_in || 3600
          }))
        );
      }),
      catchError((error) => {
        if (error.status) {
          return throwError(() => error);
        }
        return throwError(() => ({
          message: error.message || 'Registration failed',
          status: 409,
          timestamp: new Date().toISOString()
        }));
      })
    );
  }

  /**
   * Logout using Supabase Auth
   */
  logout(): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(
      map(() => undefined),
      catchError((error) => {
        // Even if logout fails on server, we should still clear local state
        console.warn('Logout error:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Get current user from Supabase session
   */
  getCurrentUser(token?: string): Observable<User | null> {
    return from(this.supabase.auth.getSession()).pipe(
      switchMap(({ data: { session }, error }) => {
        if (error) {
          console.error('Session error:', error);
          return of(null);
        }

        if (!session?.user) {
          return of(null);
        }

        return this.getUserProfile(session.user.id);
      }),
      catchError((error) => {
        console.error('Get current user error:', error);
        return of(null);
      })
    );
  }

  /**
   * Get user profile from our profiles table
   */
  private getUserProfile(userId: string): Observable<User> {
    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('Profile not found');
        }

        // Map Supabase profile to our User interface
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          createdAt: new Date(data.created_at),
          lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : null
        };
      }),
      catchError((error) => {
        console.error('Get profile error:', error);
        // Return a default user if profile doesn't exist (without a name)
        return of({
          id: userId,
          email: '',
          name: undefined,
          role: UserRole.USER,
          createdAt: new Date(),
          lastLoginAt: null
        });
      })
    );
  }

  /**
   * Update user profile in Supabase
   */
  updateProfile(userId: string, updates: Partial<User>): Observable<User> {
    const supabaseUpdates: any = {};
    
    if (updates.name) supabaseUpdates.name = updates.name;
    if (updates.role) supabaseUpdates.role = updates.role;
    if (updates.lastLoginAt) supabaseUpdates.last_login_at = updates.lastLoginAt.toISOString();

    return from(
      this.supabase
        .from('profiles')
        .update(supabaseUpdates)
        .eq('id', userId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
          createdAt: new Date(data.created_at),
          lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : null
        };
      }),
      catchError((error) => {
        console.error('Update profile error:', error);
        return throwError(() => ({
          message: error.message || 'Failed to update profile',
          status: 500,
          timestamp: new Date().toISOString()
        }));
      })
    );
  }

  /**
   * Update current user's profile
   */
  updateUserProfile(updates: { name?: string; avatarUrl?: string; phone?: string }): Observable<User> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: { user }, error }) => {
        if (error || !user) {
          return throwError(() => ({
            message: 'User not authenticated',
            status: 401,
            timestamp: new Date().toISOString()
          }));
        }

        return this.updateProfile(user.id, updates);
      })
    );
  }

  /**
   * Get Supabase client for direct access (if needed)
   */
  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const user = await this.getUserProfile(session.user.id).toPromise();
          callback(user || null);
        } catch (error) {
          console.error('Auth state change error:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    }).data.subscription.unsubscribe;
  }
}