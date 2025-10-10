import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { appReducers } from './store/app.state';
import { AuthEffects } from './features/auth/store/auth.effects';
import { LeagueEffects } from './features/leagues/store/league.effects';
import { MatchEffects } from './features/matches/store/match.effects';
import { LeaderboardEffects } from './features/matches/store/leaderboard.effects';
import { FixtureEffects } from './features/fixtures/store/fixture.effects';
import { SeasonEffects } from './features/fixtures/store/season.effects';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideSupabase } from './core/providers/supabase.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideStore(appReducers),
    provideEffects([AuthEffects, LeagueEffects, MatchEffects, LeaderboardEffects, FixtureEffects, SeasonEffects]),
    provideRouterStore(),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false, // Set to true in production
    }),
    provideSupabase()
  ]
};
