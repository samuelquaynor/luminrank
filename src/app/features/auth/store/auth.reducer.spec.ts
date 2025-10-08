import { AuthState } from '../../../core/models/user.model';
import { authReducer, initialState } from './auth.reducer';
import * as AuthActions from './auth.actions';
import { UserRole } from '../../../core/models/user.model';

describe('Auth Reducer', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
    createdAt: new Date(),
    lastLoginAt: new Date()
  };

  const mockAuthResponse = {
    user: mockUser,
    token: 'mock-token',
    expiresIn: 3600
  };

  describe('unknown action', () => {
    it('should return the initial state', () => {
      const action = { type: 'Unknown' };
      const state = authReducer(initialState, action);
      expect(state).toBe(initialState);
    });
  });

  describe('login', () => {
    it('should set loading to true and clear error', () => {
      const action = AuthActions.login({ credentials: { email: 'test@example.com', password: 'password' } });
      const state = authReducer(initialState, action);
      
      expect(state.loading).toBeTruthy();
      expect(state.error).toBeNull();
    });
  });

  describe('loginSuccess', () => {
    it('should set user, token, and authenticated state', () => {
      const action = AuthActions.loginSuccess({ response: mockAuthResponse });
      const state = authReducer(initialState, action);
      
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('mock-token');
      expect(state.loading).toBeFalsy();
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBeTruthy();
    });
  });

  describe('loginFailure', () => {
    it('should set error and reset auth state', () => {
      const action = AuthActions.loginFailure({ error: 'Login failed' });
      const state = authReducer(initialState, action);
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBeFalsy();
      expect(state.error).toBe('Login failed');
      expect(state.isAuthenticated).toBeFalsy();
    });
  });

  describe('register', () => {
    it('should set loading to true and clear error', () => {
      const action = AuthActions.register({ 
        registerData: { email: 'test@example.com', password: 'password' } 
      });
      const state = authReducer(initialState, action);
      
      expect(state.loading).toBeTruthy();
      expect(state.error).toBeNull();
    });
  });

  describe('registerSuccess', () => {
    it('should set user, token, and authenticated state', () => {
      const action = AuthActions.registerSuccess({ response: mockAuthResponse });
      const state = authReducer(initialState, action);
      
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('mock-token');
      expect(state.loading).toBeFalsy();
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('should set loading to true', () => {
      const authenticatedState: AuthState = {
        ...initialState,
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true
      };
      
      const action = AuthActions.logout();
      const state = authReducer(authenticatedState, action);
      
      expect(state.loading).toBeTruthy();
    });
  });

  describe('logoutSuccess', () => {
    it('should reset auth state', () => {
      const authenticatedState: AuthState = {
        ...initialState,
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true
      };
      
      const action = AuthActions.logoutSuccess();
      const state = authReducer(authenticatedState, action);
      
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBeFalsy();
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBeFalsy();
    });
  });

  describe('loadUserSuccess', () => {
    it('should set user and authenticated state', () => {
      const action = AuthActions.loadUserSuccess({ user: mockUser });
      const state = authReducer(initialState, action);
      
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBeFalsy();
      expect(state.error).toBeNull();
      expect(state.isAuthenticated).toBeTruthy();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const stateWithError: AuthState = {
        ...initialState,
        error: 'Some error'
      };
      
      const action = AuthActions.clearError();
      const state = authReducer(stateWithError, action);
      
      expect(state.error).toBeNull();
    });
  });
});
