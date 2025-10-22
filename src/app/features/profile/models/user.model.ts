export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  lastLoginAt: Date | null;
  isActive?: boolean;
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