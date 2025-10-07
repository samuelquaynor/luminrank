import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { StorageService } from './storage.service';
import { JwtPayload } from '../models/auth.model';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(StorageService);
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('token management', () => {
    it('should save and retrieve token', () => {
      const token = 'test-token';
      service.saveToken(token);
      expect(service.getToken()).toBe(token);
    });

    it('should remove token', () => {
      const token = 'test-token';
      service.saveToken(token);
      service.removeToken();
      expect(service.getToken()).toBeNull();
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('token validation', () => {
    it('should decode valid JWT token', () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const token = createMockJWT(payload);
      const decoded = service.decodeToken(token);
      
      expect(decoded).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      expect(service.decodeToken('invalid-token')).toBeNull();
      expect(service.decodeToken('')).toBeNull();
    });

    it('should detect expired token', () => {
      const expiredPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600
      };
      
      const expiredToken = createMockJWT(expiredPayload);
      expect(service.isTokenExpired(expiredToken)).toBeTruthy();
    });

    it('should detect valid token', () => {
      const validPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const validToken = createMockJWT(validPayload);
      expect(service.isTokenExpired(validToken)).toBeFalsy();
    });

    it('should return valid token only', () => {
      const validPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      
      const validToken = createMockJWT(validPayload);
      service.saveToken(validToken);
      expect(service.getValidToken()).toBe(validToken);
    });

    it('should return null for expired token', () => {
      const expiredPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600
      };
      
      const expiredToken = createMockJWT(expiredPayload);
      service.saveToken(expiredToken);
      expect(service.getValidToken()).toBeNull();
      expect(service.getToken()).toBeNull(); // Should be removed
    });
  });

  // Helper function to create mock JWT
  function createMockJWT(payload: any): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadB64 = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';
    return `${header}.${payloadB64}.${signature}`;
  }
});