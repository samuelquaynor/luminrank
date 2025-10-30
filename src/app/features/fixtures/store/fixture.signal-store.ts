import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { FixtureService } from '../services/fixture.service';
import { SeasonService } from '../services/season.service';
import {
  Fixture,
  FixtureWithDetails,
  GenerateFixturesRequest,
  FixtureGenerationResult,
  FixtureStatus,
} from '../models/fixture.model';
import { Season, CreateSeasonRequest, UpdateSeasonRequest } from '../models/season.model';
import { pipe, switchMap, tap, catchError, of, from } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

/**
 * Combined Fixtures & Seasons State
 * These two features are tightly coupled since fixtures belong to seasons
 */
export interface FixtureState {
  // Fixture state
  fixtures: FixtureWithDetails[];
  selectedFixture: FixtureWithDetails | null;
  fixtureLoading: boolean;
  fixtureError: string | null;
  generatingFixtures: boolean;
  generationResult: FixtureGenerationResult | null;

  // Season state
  seasons: Season[];
  activeSeason: Season | null;
  selectedSeason: Season | null;
  seasonLoading: boolean;
  seasonError: string | null;
}

const initialState: FixtureState = {
  // Fixture state
  fixtures: [],
  selectedFixture: null,
  fixtureLoading: false,
  fixtureError: null,
  generatingFixtures: false,
  generationResult: null,

  // Season state
  seasons: [],
  activeSeason: null,
  selectedSeason: null,
  seasonLoading: false,
  seasonError: null,
};

export const FixtureSignalStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    // Fixture computed signals
    fixtures: computed(() => state.fixtures()),
    selectedFixture: computed(() => state.selectedFixture()),
    fixtureLoading: computed(() => state.fixtureLoading()),
    fixtureError: computed(() => state.fixtureError()),
    generatingFixtures: computed(() => state.generatingFixtures()),
    generationResult: computed(() => state.generationResult()),

    // Season computed signals
    seasons: computed(() => state.seasons()),
    activeSeason: computed(() => state.activeSeason()),
    selectedSeason: computed(() => state.selectedSeason()),
    seasonLoading: computed(() => state.seasonLoading()),
    seasonError: computed(() => state.seasonError()),

    // Derived selectors
    fixtureCount: computed(() => state.fixtures().length),
    hasFixtures: computed(() => state.fixtures().length > 0),
    seasonCount: computed(() => state.seasons().length),
    hasActiveSeason: computed(() => state.activeSeason() !== null),
  })),
  withMethods(
    (store, fixtureService = inject(FixtureService), seasonService = inject(SeasonService)) => ({
      // ============ Fixture Methods ============

      clearFixtureError: () => {
        patchState(store, { fixtureError: null });
      },

      clearSeasonError: () => {
        patchState(store, { seasonError: null });
      },

      clearAllErrors: () => {
        patchState(store, { fixtureError: null, seasonError: null });
      },

      clearFixtures: () => {
        patchState(store, {
          fixtures: [],
          selectedFixture: null,
          fixtureLoading: false,
          fixtureError: null,
          generatingFixtures: false,
          generationResult: null,
        });
      },

      clearSeasons: () => {
        patchState(store, {
          seasons: [],
          activeSeason: null,
          selectedSeason: null,
          seasonLoading: false,
          seasonError: null,
        });
      },

      // Generate fixtures using round-robin algorithm
      generateFixtures: rxMethod<GenerateFixturesRequest>(
        pipe(
          tap(() => patchState(store, { generatingFixtures: true, fixtureError: null })),
          switchMap((request) =>
            from(fixtureService.generateRoundRobinFixtures(request)).pipe(
              tap((result) => {
                patchState(store, {
                  generationResult: result,
                  generatingFixtures: false,
                  fixtureError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  generatingFixtures: false,
                  fixtureError: error.message || 'Failed to generate fixtures',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load all fixtures for a league (optionally filtered by season)
      loadLeagueFixtures: rxMethod<{ leagueId: string; seasonId?: string }>(
        pipe(
          tap(() => patchState(store, { fixtureLoading: true, fixtureError: null })),
          switchMap(({ leagueId, seasonId }) =>
            from(fixtureService.getLeagueFixtures(leagueId, seasonId)).pipe(
              tap((fixtures) => {
                patchState(store, {
                  fixtures,
                  fixtureLoading: false,
                  fixtureError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  fixtureLoading: false,
                  fixtureError: error.message || 'Failed to load fixtures',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load a single fixture
      loadFixture: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { fixtureLoading: true, fixtureError: null })),
          switchMap((fixtureId) =>
            from(fixtureService.getFixtureById(fixtureId)).pipe(
              tap((fixture) => {
                patchState(store, {
                  selectedFixture: fixture,
                  fixtureLoading: false,
                  fixtureError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  fixtureLoading: false,
                  fixtureError: error.message || 'Failed to load fixture',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load player fixtures
      loadPlayerFixtures: rxMethod<{
        profileId: string;
        leagueId: string;
        seasonId?: string;
      }>(
        pipe(
          tap(() => patchState(store, { fixtureLoading: true, fixtureError: null })),
          switchMap(({ profileId, leagueId, seasonId }) =>
            from(fixtureService.getPlayerFixtures(profileId, leagueId, seasonId)).pipe(
              tap((fixtures) => {
                patchState(store, {
                  fixtures,
                  fixtureLoading: false,
                  fixtureError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  fixtureLoading: false,
                  fixtureError: error.message || 'Failed to load player fixtures',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Update fixture status
      updateFixtureStatus: rxMethod<{
        fixtureId: string;
        status: FixtureStatus;
      }>(
        pipe(
          tap(() => patchState(store, { fixtureLoading: true, fixtureError: null })),
          switchMap(({ fixtureId, status }) =>
            from(fixtureService.updateFixtureStatus(fixtureId, status)).pipe(
              tap((fixture) => {
                patchState(store, {
                  fixtures: store
                    .fixtures()
                    .map((f) => (f.id === fixture.id ? { ...f, status: fixture.status } : f)),
                  fixtureLoading: false,
                  fixtureError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  fixtureLoading: false,
                  fixtureError: error.message || 'Failed to update fixture status',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Link match to fixture
      linkMatchToFixture: rxMethod<{
        fixtureId: string;
        matchId: string;
        winnerId: string;
      }>(
        pipe(
          tap(() => patchState(store, { fixtureLoading: true, fixtureError: null })),
          switchMap(({ fixtureId, matchId, winnerId }) =>
            from(fixtureService.linkMatchToFixture(fixtureId, matchId, winnerId)).pipe(
              tap((fixture) => {
                patchState(store, {
                  fixtures: store.fixtures().map((f) =>
                    f.id === fixture.id
                      ? {
                          ...f,
                          match_id: fixture.match_id,
                          winner_id: fixture.winner_id,
                          status: fixture.status,
                        }
                      : f
                  ),
                  fixtureLoading: false,
                  fixtureError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  fixtureLoading: false,
                  fixtureError: error.message || 'Failed to link match to fixture',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Mark overdue fixtures
      markOverdueFixtures: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { fixtureLoading: true, fixtureError: null })),
          switchMap(() =>
            from(fixtureService.markOverdueFixtures()).pipe(
              tap(() => {
                patchState(store, {
                  fixtureLoading: false,
                  fixtureError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  fixtureLoading: false,
                  fixtureError: error.message || 'Failed to mark overdue fixtures',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // ============ Season Methods ============

      // Create a new season
      createSeason: rxMethod<CreateSeasonRequest>(
        pipe(
          tap(() => patchState(store, { seasonLoading: true, seasonError: null })),
          switchMap((request) =>
            seasonService.createSeason$(request).pipe(
              tap((season) => {
                patchState(store, {
                  seasons: [season, ...store.seasons()],
                  seasonLoading: false,
                  seasonError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  seasonLoading: false,
                  seasonError: error.message || 'Failed to create season',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load all seasons for a league
      loadLeagueSeasons: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { seasonLoading: true, seasonError: null })),
          switchMap((leagueId) =>
            seasonService.getLeagueSeasons$(leagueId).pipe(
              tap((seasons) => {
                patchState(store, {
                  seasons,
                  seasonLoading: false,
                  seasonError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  seasonLoading: false,
                  seasonError: error.message || 'Failed to load seasons',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load active season
      loadActiveSeason: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { seasonLoading: true, seasonError: null })),
          switchMap((leagueId) =>
            seasonService.getActiveSeason$(leagueId).pipe(
              tap((season) => {
                patchState(store, {
                  activeSeason: season,
                  seasonLoading: false,
                  seasonError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  seasonLoading: false,
                  seasonError: error.message || 'Failed to load active season',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load season by ID
      loadSeason: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { seasonLoading: true, seasonError: null })),
          switchMap((seasonId) =>
            seasonService.getSeasonById$(seasonId).pipe(
              tap((season) => {
                patchState(store, {
                  selectedSeason: season,
                  seasonLoading: false,
                  seasonError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  seasonLoading: false,
                  seasonError: error.message || 'Failed to load season',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Update season
      updateSeason: rxMethod<{
        seasonId: string;
        request: UpdateSeasonRequest;
      }>(
        pipe(
          tap(() => patchState(store, { seasonLoading: true, seasonError: null })),
          switchMap(({ seasonId, request }) =>
            seasonService.updateSeason$(seasonId, request).pipe(
              tap((season) => {
                patchState(store, {
                  seasons: store.seasons().map((s) => (s.id === season.id ? season : s)),
                  selectedSeason:
                    store.selectedSeason()?.id === season.id ? season : store.selectedSeason(),
                  activeSeason:
                    store.activeSeason()?.id === season.id ? season : store.activeSeason(),
                  seasonLoading: false,
                  seasonError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  seasonLoading: false,
                  seasonError: error.message || 'Failed to update season',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // End season
      endSeason: rxMethod<{ seasonId: string; endDate: string }>(
        pipe(
          tap(() => patchState(store, { seasonLoading: true, seasonError: null })),
          switchMap(({ seasonId, endDate }) =>
            seasonService.endSeason$(seasonId, endDate).pipe(
              tap((season) => {
                patchState(store, {
                  seasons: store.seasons().map((s) => (s.id === season.id ? season : s)),
                  activeSeason:
                    store.activeSeason()?.id === season.id ? null : store.activeSeason(),
                  seasonLoading: false,
                  seasonError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  seasonLoading: false,
                  seasonError: error.message || 'Failed to end season',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Delete season
      deleteSeason: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { seasonLoading: true, seasonError: null })),
          switchMap((seasonId) =>
            seasonService.deleteSeason$(seasonId).pipe(
              tap(() => {
                patchState(store, {
                  seasons: store.seasons().filter((s) => s.id !== seasonId),
                  selectedSeason:
                    store.selectedSeason()?.id === seasonId ? null : store.selectedSeason(),
                  activeSeason: store.activeSeason()?.id === seasonId ? null : store.activeSeason(),
                  seasonLoading: false,
                  seasonError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  seasonLoading: false,
                  seasonError: error.message || 'Failed to delete season',
                });
                return of(null);
              })
            )
          )
        )
      ),
    })
  )
);
