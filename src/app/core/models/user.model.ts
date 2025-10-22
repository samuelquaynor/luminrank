export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date | null;
  isActive?: boolean;
  avatarUrl?: string;
  phone?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  role?: UserRole;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  avatarUrl?: string;
  phone?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  currentPage: number;
  totalCount: number;
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
