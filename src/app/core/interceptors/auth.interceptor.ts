import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storageService = inject(StorageService);

  // Skip auth for login and register endpoints
  if (req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/auth/')) {
    return next(req);
  }

  // Get token from storage
  const token = storageService.getValidToken();

  if (token) {
    // Clone the request and add the authorization header
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  return next(req);
};
