import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take, filter, timeout, catchError, of } from 'rxjs';
import { Store } from '@ngrx/store';

import * as AuthSelectors from '../../features/auth/store/auth.selectors';
import * as AuthActions from '../../features/auth/store/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(
    private store: Store,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // First, trigger auth check if not already done
    this.store.dispatch(AuthActions.checkAuth());
    
    // Wait for loading to complete, then check auth status
    return this.store.select(AuthSelectors.selectIsLoading).pipe(
      filter(loading => !loading), // Wait until loading is false
      take(1),
      timeout(5000), // Timeout after 5 seconds
      catchError(() => of(false)), // If timeout, treat as not authenticated
      map(() => {
        // Now check if authenticated
        let isAuthenticated = false;
        this.store.select(AuthSelectors.selectIsAuthenticated).pipe(take(1)).subscribe(auth => {
          isAuthenticated = auth;
        });
        
        if (isAuthenticated) {
          return true;
        } else {
          // Store returnUrl in localStorage for the auth flow (only in browser)
          if (this.isBrowser) {
            localStorage.setItem('auth_return_url', state.url);
          }
          
          this.router.navigate(['/auth'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
      })
    );
  }
}
