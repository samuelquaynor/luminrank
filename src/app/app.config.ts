import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
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
    provideSupabase(),
    // Signal stores
    AuthSignalStore,
    LeagueSignalStore,
    MatchSignalStore,
    DisputeSignalStore,
  ],
};
