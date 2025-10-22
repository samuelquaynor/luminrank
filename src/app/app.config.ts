import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { appReducers } from './store/app.state';
// AuthEffects and LeagueEffects removed - now using signal stores
import { MatchEffects } from './features/matches/store/match.effects';
import { LeaderboardEffects } from './features/matches/store/leaderboard.effects';
import { FixtureEffects } from './features/fixtures/store/fixture.effects';
import { SeasonEffects } from './features/fixtures/store/season.effects';
import { DisputeEffects } from './features/disputes/store/dispute.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideSupabase } from './core/providers/supabase.provider';
import { AuthSignalStore } from './features/auth/store/auth.signal-store';
import { LeagueSignalStore } from './features/leagues/store/league.signal-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideStore(appReducers),
    provideEffects([
      MatchEffects,
      LeaderboardEffects,
      FixtureEffects,
      SeasonEffects,
      DisputeEffects,
    ]),
    provideRouterStore(),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false, // Set to true in production
    }),
    provideSupabase(),
    AuthSignalStore,
    LeagueSignalStore,
  ],
};
