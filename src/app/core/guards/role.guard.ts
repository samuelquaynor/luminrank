import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthSignalStore } from '../../features/auth/store/auth.signal-store';
import { UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authStore = inject(AuthSignalStore);

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRoles = route.data['roles'] as UserRole[];
    
    return new Observable(observer => {
      const isAuthenticated = this.authStore.isAuthenticated();
      const userRole = this.authStore.userRole();
      
      if (!isAuthenticated) {
        this.router.navigate(['/auth'], {
          queryParams: { returnUrl: state.url }
        });
        observer.next(false);
        observer.complete();
        return;
      }

      if (!requiredRoles || requiredRoles.length === 0) {
        observer.next(true);
        observer.complete();
        return;
      }

      if (!userRole) {
        this.router.navigate(['/auth'], {
          queryParams: { returnUrl: state.url }
        });
        observer.next(false);
        observer.complete();
        return;
      }

      const hasRequiredRole = requiredRoles.includes(userRole);
      
      if (hasRequiredRole) {
        observer.next(true);
        observer.complete();
      } else {
        this.router.navigate(['/unauthorized']);
        observer.next(false);
        observer.complete();
      }
    });
  }
}
