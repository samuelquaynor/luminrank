import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
// All features now using signal stores - traditional NgRx fully removed!
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideSupabase } from './core/providers/supabase.provider';
import { AuthSignalStore } from './features/auth/store/auth.signal-store';
import { LeagueSignalStore } from './features/leagues/store/league.signal-store';
import { MatchSignalStore } from './features/matches/store/match.signal-store';
import { DisputeSignalStore } from './features/disputes/store/dispute.signal-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // Empty store for router store compatibility
    provideStore({}),
    provideRouterStore(),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false, // Set to true in production
    }),
    provideSupabase(),
    // Signal stores
    AuthSignalStore,
    LeagueSignalStore,
    MatchSignalStore,
    DisputeSignalStore,
  ],
};
