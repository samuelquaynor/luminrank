import { Injectable } from '@angular/core';
import { Observable, of, throwError, delay } from 'rxjs';
import { User, UserRole, LoginCredentials, RegisterData, AuthResponse } from '../models/user.model';
import { StorageService } from './storage.service';

/**
 * Authentication Service
 * 
 * This service simulates backend authentication for development purposes.
 * In production, this would be replaced with HTTP calls to your backend API.
 * 
 * The backend would:
 * - Verify user credentials
 * - Generate and return JWT tokens
 * - Handle user registration
 * - Manage user sessions
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private storageService: StorageService) {}

  // Mock user database - simplified for auth purposes
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date()
    },
    {
      id: '2',
      email: 'user@example.com',
      name: 'Regular User',
      role: UserRole.USER,
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date()
    },
    {
      id: '3',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.USER,
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date()
    }
  ];

  // Mock passwords (in real app, these would be hashed)
  private mockPasswords: { [email: string]: string } = {
    'admin@example.com': 'admin123',
    'user@example.com': 'user123',
    'test@example.com': 'test123'
  };

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return new Observable(observer => {
      // Simulate API delay
      setTimeout(() => {
        const user = this.mockUsers.find(u => u.email === credentials.email);
        const password = this.mockPasswords[credentials.email];

        if (!user || password !== credentials.password) {
          observer.error({
            message: 'Invalid email or password',
            status: 401,
            timestamp: new Date().toISOString()
          });
          return;
        }

        // Update last login
        user.lastLoginAt = new Date();

        // In a real application, this would be an HTTP request to your backend:
        // return this.http.post<AuthResponse>('/api/auth/login', credentials);
        // The backend would return a JWT token that you would store and use
        
        // For development/testing, we simulate receiving a token from the backend
        const token = this.simulateBackendToken(user);

        observer.next({
          user,
          token,
          expiresIn: 3600 // 1 hour
        });
        observer.complete();
      }, 1000); // Simulate network delay
    });
  }

  register(registerData: RegisterData): Observable<AuthResponse> {
    return new Observable(observer => {
      // Simulate API delay
      setTimeout(() => {
        // Check if user already exists
        const existingUser = this.mockUsers.find(u => u.email === registerData.email);
        if (existingUser) {
          observer.error({
            message: 'User with this email already exists',
            status: 409,
            timestamp: new Date().toISOString()
          });
          return;
        }

        // Create new user
        const newUser: User = {
          id: (this.mockUsers.length + 1).toString(),
          email: registerData.email,
          name: registerData.name,
          role: UserRole.USER, // Default role
          createdAt: new Date(),
          lastLoginAt: new Date()
        };

        // Add to mock database
        this.mockUsers.push(newUser);
        this.mockPasswords[registerData.email] = registerData.password;

        // In a real application, this would be an HTTP request to your backend:
        // return this.http.post<AuthResponse>('/api/auth/register', registerData);
        
        // For development/testing, we simulate receiving a token from the backend
        const token = this.simulateBackendToken(newUser);

        observer.next({
          user: newUser,
          token,
          expiresIn: 3600 // 1 hour
        });
        observer.complete();
      }, 1000); // Simulate network delay
    });
  }

  logout(): Observable<void> {
    return of(undefined).pipe(delay(500));
  }

  getCurrentUser(token: string): Observable<User | null> {
    return new Observable(observer => {
      setTimeout(() => {
        try {
          // Use the storage service's proper JWT decoding
          const payload = this.storageService.decodeToken(token);
          if (!payload) {
            observer.next(null);
            observer.complete();
            return;
          }

          const user = this.mockUsers.find(u => u.id === payload.sub);
          observer.next(user || null);
          observer.complete();
        } catch (error) {
          observer.next(null);
          observer.complete();
        }
      }, 300);
    });
  }

  /**
   * Simulates receiving a JWT token from the backend
   * In production, this would be replaced with actual HTTP calls to your backend API
   * The backend would generate and return the JWT token
   */
  private simulateBackendToken(user: User): string {
    // This simulates what your backend would return
    // In reality, your backend would:
    // 1. Verify the user credentials
    // 2. Generate a cryptographically signed JWT token
    // 3. Return the token in the response
    
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };
    
    const payloadB64 = btoa(JSON.stringify(payload));
    const signature = 'mock-signature'; // Backend would provide real cryptographic signature
    
    return `${header}.${payloadB64}.${signature}`;
  }

}
