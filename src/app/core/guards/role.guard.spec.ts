import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, firstValueFrom } from 'rxjs';

import { RoleGuard } from './role.guard';
import { UserRole } from '../models/user.model';
import * as AuthSelectors from '../../features/auth/store/auth.selectors';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let router: jasmine.SpyObj<Router>;
  let store: jasmine.SpyObj<Store>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const storeSpy = jasmine.createSpyObj('Store', ['select']);

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        provideZonelessChangeDetection(),
        { provide: Router, useValue: routerSpy },
        { provide: Store, useValue: storeSpy },
      ],
    });

    guard = TestBed.inject(RoleGuard);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user has required role', async () => {
    // Arrange
    const route = {
      data: { roles: [UserRole.ADMIN] }
    };
    const state = {} as any;

    store.select.and.returnValue(of(UserRole.ADMIN));

    // Act & Assert
    const result = await firstValueFrom(guard.canActivate(route as any, state));
    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', async () => {
    // Arrange
    const route = {
      data: { roles: [UserRole.ADMIN] }
    };
    const state = {} as any;

    store.select.and.returnValue(of(UserRole.USER));

    // Act & Assert
    const result = await firstValueFrom(guard.canActivate(route as any, state));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });

  it('should deny access when user is not authenticated', async () => {
    // Arrange
    const route = {
      data: { roles: [UserRole.ADMIN] }
    };
    const state = {} as any;

    store.select.and.returnValue(of(null));

    // Act & Assert
    const result = await firstValueFrom(guard.canActivate(route as any, state));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: undefined }
    });
  });

  it('should allow access when user has one of multiple required roles', async () => {
    // Arrange
    const route = {
      data: { roles: [UserRole.ADMIN, UserRole.USER] }
    };
    const state = {} as any;

    store.select.and.returnValue(of(UserRole.USER));

    // Act & Assert
    const result = await firstValueFrom(guard.canActivate(route as any, state));
    expect(result).toBe(true);
  });

  it('should deny access when user role is not in the required roles list', async () => {
    // Arrange
    const route = {
      data: { roles: [UserRole.ADMIN] }
    };
    const state = {} as any;

    store.select.and.returnValue(of(UserRole.USER));

    // Act & Assert
    const result = await firstValueFrom(guard.canActivate(route as any, state));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });

  it('should allow access when no roles are specified in route data', async () => {
    // Arrange
    const route = {
      data: {}
    };
    const state = {} as any;

    // Mock selectIsAuthenticated for this scenario
    store.select.and.callFake((selector: any) => {
      if (selector === AuthSelectors.selectIsAuthenticated) {
        return of(true);
      }
      return of(UserRole.USER);
    });

    // Act & Assert
    const result = await firstValueFrom(guard.canActivate(route as any, state));
    expect(result).toBe(true);
  });

  it('should handle null user gracefully', async () => {
    // Arrange
    const route = {
      data: { roles: [UserRole.ADMIN] }
    };
    const state = {} as any;

    store.select.and.returnValue(of(null));

    // Act & Assert
    const result = await firstValueFrom(guard.canActivate(route as any, state));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: undefined }
    });
  });

  it('should handle undefined user role gracefully', async () => {
    // Arrange
    const route = {
      data: { roles: [UserRole.ADMIN] }
    };
    const state = {} as any;

    store.select.and.returnValue(of(undefined));

    // Act & Assert
    const result = await firstValueFrom(guard.canActivate(route as any, state));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: undefined }
    });
  });
});