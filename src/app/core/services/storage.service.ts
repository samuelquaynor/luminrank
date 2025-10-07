import { Injectable } from '@angular/core';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { JwtPayload as CustomJwtPayload } from '../models/auth.model';

/**
 * Storage Service
 * 
 * Handles JWT token storage and validation.
 * Designed to work with JWT tokens received from the backend.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly TOKEN_KEY = 'luminrank_auth_token';

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  decodeToken(token: string): CustomJwtPayload | null {
    try {
      // Use jwt-decode library for safe token decoding
      const decoded = jwtDecode<JwtPayload>(token);
      
      // Validate required fields exist
      if (!decoded.sub || !decoded.exp) {
        console.warn('JWT token missing required fields (sub or exp)');
        return null;
      }
      
      // Map to our custom payload interface
      return {
        sub: decoded.sub,
        email: (decoded as any).email || '',
        role: (decoded as any).role || 'USER',
        name: (decoded as any).name || '',
        iat: decoded.iat || Math.floor(Date.now() / 1000),
        exp: decoded.exp
      };
    } catch (error) {
      console.warn('Failed to decode JWT token:', error);
      return null;
    }
  }

  getValidToken(): string | null {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.removeToken();
      return null;
    }
    return token;
  }
}
