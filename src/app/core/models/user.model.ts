// Re-export user models from the user feature module
export type { User } from '../../features/user/models/user.model';
export { UserRole } from '../../features/user/models/user.model';
import type { User } from '../../features/user/models/user.model';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
