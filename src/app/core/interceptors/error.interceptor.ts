import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthSignalStore } from '../../features/auth/store/auth.signal-store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authStore = inject(AuthSignalStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - token expired or invalid
        authStore.logout();
        router.navigate(['/auth']);
      } else if (error.status === 403) {
        // Forbidden - user doesn't have permission
        router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    })
  );
};
