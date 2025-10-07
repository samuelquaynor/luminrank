import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthService } from './auth.service';
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

  it('should have login method', () => {
    expect(service.login).toBeDefined();
  });

  it('should have register method', () => {
    expect(service.register).toBeDefined();
  });

  it('should have logout method', () => {
    expect(service.logout).toBeDefined();
  });

  it('should have getCurrentUser method', () => {
    expect(service.getCurrentUser).toBeDefined();
  });
});