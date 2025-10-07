import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';
import { StorageService } from './storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let storageService: jasmine.SpyObj<StorageService>;

  beforeEach(() => {
    const storageSpy = jasmine.createSpyObj('StorageService', [
      'saveToken',
      'getToken',
      'removeToken',
      'decodeToken',
      'isTokenExpired',
      'getValidToken'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: StorageService, useValue: storageSpy }
      ]
    });
    
    service = TestBed.inject(AuthService);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const credentials = { email: 'admin@example.com', password: 'admin123' };
      
      try {
        const response = await firstValueFrom(service.login(credentials));
        expect(response?.user.email).toBe('admin@example.com');
        expect(response?.token).toBeTruthy();
        expect(response?.expiresIn).toBe(3600);
      } catch (error) {
        fail('Should not error with valid credentials');
      }
    });

    it('should fail with invalid email', async () => {
      const credentials = { email: 'invalid@example.com', password: 'admin123' };
      
      try {
        await firstValueFrom(service.login(credentials));
        fail('Should not succeed with invalid email');
      } catch (error: any) {
        expect(error.message).toBe('Invalid email or password');
        expect(error.status).toBe(401);
      }
    });

    it('should fail with invalid password', async () => {
      const credentials = { email: 'admin@example.com', password: 'wrongpassword' };
      
      try {
        await firstValueFrom(service.login(credentials));
        fail('Should not succeed with invalid password');
      } catch (error: any) {
        expect(error.message).toBe('Invalid email or password');
        expect(error.status).toBe(401);
      }
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'newpassword',
        name: 'New User'
      };
      
      try {
        const response = await firstValueFrom(service.register(registerData));
        expect(response?.user.email).toBe('newuser@example.com');
        expect(response?.user.name).toBe('New User');
        expect(response?.user.role).toBe(UserRole.USER);
        expect(response?.token).toBeTruthy();
      } catch (error) {
        fail('Should not error with new user');
      }
    });

    it('should fail if user already exists', async () => {
      const registerData = {
        email: 'admin@example.com', // Already exists
        password: 'password',
        name: 'Admin User'
      };
      
      try {
        await firstValueFrom(service.register(registerData));
        fail('Should not succeed with existing email');
      } catch (error: any) {
        expect(error.message).toBe('User with this email already exists');
        expect(error.status).toBe(409);
      }
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      try {
        const response = await firstValueFrom(service.logout());
        expect(response).toBeUndefined();
      } catch (error) {
        fail('Logout should not error');
      }
    });
  });

  describe('getCurrentUser', () => {
    it('should return user for valid token', async () => {
      // Mock the storage service to return a valid decoded token
      storageService.decodeToken.and.returnValue({
        sub: '2',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'USER',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      });
      
      const token = 'valid-token';
      const user = await firstValueFrom(service.getCurrentUser(token));
      expect(user?.email).toBe('user@example.com');
    });

    it('should return null for invalid token', async () => {
      // Mock the storage service to return null for invalid token
      storageService.decodeToken.and.returnValue(null);
      
      const user = await firstValueFrom(service.getCurrentUser('invalid-token'));
      expect(user).toBeNull();
    });
  });
});
