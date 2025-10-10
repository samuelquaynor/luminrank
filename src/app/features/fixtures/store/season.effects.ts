import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { SeasonService } from '../services/season.service';
import * as SeasonActions from './season.actions';

@Injectable()
export class SeasonEffects {
  private actions$ = inject(Actions);
  private seasonService = inject(SeasonService);

  createSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonActions.createSeason),
      switchMap(({ request }) =>
        this.seasonService.createSeason$(request).pipe(
          map(season => SeasonActions.createSeasonSuccess({ season })),
          catchError(error => 
            of(SeasonActions.createSeasonFailure({ 
              error: error.message || 'Failed to create season' 
            }))
          )
        )
      )
    )
  );

  loadLeagueSeasons$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonActions.loadLeagueSeasons),
      switchMap(({ leagueId }) =>
        this.seasonService.getLeagueSeasons$(leagueId).pipe(
          map(seasons => SeasonActions.loadLeagueSeasonsSuccess({ seasons })),
          catchError(error => 
            of(SeasonActions.loadLeagueSeasonsFailure({ 
              error: error.message || 'Failed to load seasons' 
            }))
          )
        )
      )
    )
  );

  loadActiveSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonActions.loadActiveSeason),
      switchMap(({ leagueId }) =>
        this.seasonService.getActiveSeason$(leagueId).pipe(
          map(season => SeasonActions.loadActiveSeasonSuccess({ season })),
          catchError(error => 
            of(SeasonActions.loadActiveSeasonFailure({ 
              error: error.message || 'Failed to load active season' 
            }))
          )
        )
      )
    )
  );

  loadSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonActions.loadSeason),
      switchMap(({ seasonId }) =>
        this.seasonService.getSeasonById$(seasonId).pipe(
          map(season => {
            if (!season) {
              return SeasonActions.loadSeasonFailure({ error: 'Season not found' });
            }
            return SeasonActions.loadSeasonSuccess({ season });
          }),
          catchError(error => 
            of(SeasonActions.loadSeasonFailure({ 
              error: error.message || 'Failed to load season' 
            }))
          )
        )
      )
    )
  );

  updateSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonActions.updateSeason),
      switchMap(({ seasonId, request }) =>
        this.seasonService.updateSeason$(seasonId, request).pipe(
          map(season => SeasonActions.updateSeasonSuccess({ season })),
          catchError(error => 
            of(SeasonActions.updateSeasonFailure({ 
              error: error.message || 'Failed to update season' 
            }))
          )
        )
      )
    )
  );

  endSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonActions.endSeason),
      switchMap(({ seasonId, endDate }) =>
        this.seasonService.endSeason$(seasonId, endDate).pipe(
          map(season => SeasonActions.endSeasonSuccess({ season })),
          catchError(error => 
            of(SeasonActions.endSeasonFailure({ 
              error: error.message || 'Failed to end season' 
            }))
          )
        )
      )
    )
  );

  deleteSeason$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SeasonActions.deleteSeason),
      switchMap(({ seasonId }) =>
        this.seasonService.deleteSeason$(seasonId).pipe(
          map(() => SeasonActions.deleteSeasonSuccess({ seasonId })),
          catchError(error => 
            of(SeasonActions.deleteSeasonFailure({ 
              error: error.message || 'Failed to delete season' 
            }))
          )
        )
      )
    )
  );
}

