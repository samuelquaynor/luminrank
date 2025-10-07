import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { User, CreateUserData, UpdateUserData, UserListResponse, UserRole } from '../models/user.model';

/**
 * User Service
 * 
 * Handles user-related operations including CRUD operations,
 * user profile management, and user administration.
 * 
 * In production, this would make HTTP calls to your backend API.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Mock user database
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date(),
      isActive: true,
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }
      }
    },
    {
      id: '2',
      email: 'user@example.com',
      name: 'Regular User',
      role: UserRole.USER,
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date(),
      isActive: true,
      profile: {
        firstName: 'Regular',
        lastName: 'User',
        preferences: {
          theme: 'auto',
          language: 'en',
          notifications: {
            email: true,
            push: false,
            sms: false
          }
        }
      }
    },
    {
      id: '3',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.USER,
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date(),
      isActive: false,
      profile: {
        firstName: 'Test',
        lastName: 'User',
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: false,
            push: false,
            sms: false
          }
        }
      }
    }
  ];

  constructor() {}

  /**
   * Get all users with pagination
   * In production: GET /api/users?page=1&limit=10
   */
  getUsers(page: number = 1, limit: number = 10): Observable<UserListResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = this.mockUsers.slice(startIndex, endIndex);

        observer.next({
          users: paginatedUsers,
          total: this.mockUsers.length,
          page,
          limit
        });
        observer.complete();
      }, 500);
    });
  }

  /**
   * Get user by ID
   * In production: GET /api/users/:id
   */
  getUserById(id: string): Observable<User | null> {
    return new Observable(observer => {
      setTimeout(() => {
        const user = this.mockUsers.find(u => u.id === id);
        observer.next(user || null);
        observer.complete();
      }, 300);
    });
  }

  /**
   * Create a new user
   * In production: POST /api/users
   */
  createUser(userData: CreateUserData): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        // Check if user already exists
        const existingUser = this.mockUsers.find(u => u.email === userData.email);
        if (existingUser) {
          observer.error({
            message: 'User with this email already exists',
            status: 409
          });
          return;
        }

        const newUser: User = {
          id: (this.mockUsers.length + 1).toString(),
          email: userData.email,
          name: userData.name,
          role: userData.role || UserRole.USER,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true,
          profile: {
            preferences: {
              theme: 'light',
              language: 'en',
              notifications: {
                email: true,
                push: true,
                sms: false
              }
            }
          }
        };

        this.mockUsers.push(newUser);
        observer.next(newUser);
        observer.complete();
      }, 800);
    });
  }

  /**
   * Update user
   * In production: PUT /api/users/:id
   */
  updateUser(id: string, userData: UpdateUserData): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        const userIndex = this.mockUsers.findIndex(u => u.id === id);
        if (userIndex === -1) {
          observer.error({
            message: 'User not found',
            status: 404
          });
          return;
        }

        // Check if email is being changed and if it already exists
        if (userData.email && userData.email !== this.mockUsers[userIndex].email) {
          const existingUser = this.mockUsers.find(u => u.email === userData.email && u.id !== id);
          if (existingUser) {
            observer.error({
              message: 'User with this email already exists',
              status: 409
            });
            return;
          }
        }

        // Update user
        this.mockUsers[userIndex] = {
          ...this.mockUsers[userIndex],
          ...userData,
          profile: {
            ...this.mockUsers[userIndex].profile,
            ...userData.profile
          }
        };

        observer.next(this.mockUsers[userIndex]);
        observer.complete();
      }, 600);
    });
  }

  /**
   * Delete user
   * In production: DELETE /api/users/:id
   */
  deleteUser(id: string): Observable<void> {
    return new Observable(observer => {
      setTimeout(() => {
        const userIndex = this.mockUsers.findIndex(u => u.id === id);
        if (userIndex === -1) {
          observer.error({
            message: 'User not found',
            status: 404
          });
          return;
        }

        this.mockUsers.splice(userIndex, 1);
        observer.next();
        observer.complete();
      }, 500);
    });
  }

  /**
   * Get current user profile
   * In production: GET /api/users/me
   */
  getCurrentUserProfile(userId: string): Observable<User | null> {
    return this.getUserById(userId);
  }

  /**
   * Update current user profile
   * In production: PUT /api/users/me
   */
  updateCurrentUserProfile(userId: string, profileData: Partial<User['profile']>): Observable<User> {
    return new Observable(observer => {
      setTimeout(() => {
        const userIndex = this.mockUsers.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          observer.error({
            message: 'User not found',
            status: 404
          });
          return;
        }

        this.mockUsers[userIndex] = {
          ...this.mockUsers[userIndex],
          profile: {
            ...this.mockUsers[userIndex].profile,
            ...profileData
          }
        };

        observer.next(this.mockUsers[userIndex]);
        observer.complete();
      }, 400);
    });
  }

  /**
   * Search users
   * In production: GET /api/users/search?q=searchTerm
   */
  searchUsers(searchTerm: string): Observable<User[]> {
    return new Observable(observer => {
      setTimeout(() => {
        const filteredUsers = this.mockUsers.filter(user =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        observer.next(filteredUsers);
        observer.complete();
      }, 300);
    });
  }
}
