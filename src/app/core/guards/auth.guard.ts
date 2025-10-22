import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take, filter, timeout, catchError, of } from 'rxjs';
import { AuthSignalStore } from '../../features/auth/store/auth.signal-store';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private authStore = inject(AuthSignalStore);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // First, trigger auth check if not already done
    this.authStore.checkAuth();

    // For now, we'll use a simple approach with signal store
    // In a real app, you might want to create a more sophisticated guard
    return new Observable(observer => {
      // Check authentication status
      const isAuthenticated = this.authStore.isAuthenticated();
      
      if (isAuthenticated) {
        observer.next(true);
        observer.complete();
      } else {
        // Store returnUrl in localStorage for the auth flow (only in browser)
        if (this.isBrowser) {
          localStorage.setItem('auth_return_url', state.url);
        }

        this.router.navigate(['/auth'], {
          queryParams: { returnUrl: state.url },
        });
        observer.next(false);
        observer.complete();
      }
    });
  }
}
