import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, firstValueFrom } from 'rxjs';

import { AuthGuard } from './auth.guard';
import * as AuthSelectors from '../../features/auth/store/auth.selectors';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let store: jasmine.SpyObj<Store>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const storeSpy = jasmine.createSpyObj('Store', ['select', 'dispatch']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AuthGuard,
        { provide: Store, useValue: storeSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated', async () => {
    // Mock loading state (false) and authenticated state (true)
    store.select.and.callFake((selector: any) => {
      if (selector === AuthSelectors.selectIsLoading) {
        return of(false);
      }
      if (selector === AuthSelectors.selectIsAuthenticated) {
        return of(true);
      }
      return of(null);
    });

    const result = await firstValueFrom(guard.canActivate({} as any, { url: '/dashboard' } as any));
    expect(result).toBeTruthy();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalled(); // checkAuth is dispatched
  });

  it('should deny access and redirect to login when user is not authenticated', async () => {
    // Mock loading state (false) and authenticated state (false)
    store.select.and.callFake((selector: any) => {
      if (selector === AuthSelectors.selectIsLoading) {
        return of(false);
      }
      if (selector === AuthSelectors.selectIsAuthenticated) {
        return of(false);
      }
      return of(null);
    });

    const result = await firstValueFrom(guard.canActivate({} as any, { url: '/dashboard' } as any));
    expect(result).toBeFalsy();
    expect(router.navigate).toHaveBeenCalledWith(['/auth'], {
      queryParams: { returnUrl: '/dashboard' }
    });
    expect(store.dispatch).toHaveBeenCalled(); // checkAuth is dispatched
  });
});
