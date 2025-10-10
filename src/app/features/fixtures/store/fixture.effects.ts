import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { FixtureService } from '../services/fixture.service';
import * as FixtureActions from './fixture.actions';

@Injectable()
export class FixtureEffects {
  private actions$ = inject(Actions);
  private fixtureService = inject(FixtureService);

  generateFixtures$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FixtureActions.generateFixtures),
      switchMap(({ request }) =>
        this.fixtureService.generateRoundRobinFixtures$(request).pipe(
          map(result => FixtureActions.generateFixturesSuccess({ result })),
          catchError(error => 
            of(FixtureActions.generateFixturesFailure({ 
              error: error.message || 'Failed to generate fixtures' 
            }))
          )
        )
      )
    )
  );

  loadLeagueFixtures$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FixtureActions.loadLeagueFixtures),
      switchMap(({ leagueId, seasonId }) =>
        this.fixtureService.getLeagueFixtures$(leagueId, seasonId).pipe(
          map(fixtures => FixtureActions.loadLeagueFixturesSuccess({ fixtures })),
          catchError(error => 
            of(FixtureActions.loadLeagueFixturesFailure({ 
              error: error.message || 'Failed to load fixtures' 
            }))
          )
        )
      )
    )
  );

  loadFixture$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FixtureActions.loadFixture),
      switchMap(({ fixtureId }) =>
        this.fixtureService.getFixtureById$(fixtureId).pipe(
          map(fixture => {
            if (!fixture) {
              return FixtureActions.loadFixtureFailure({ error: 'Fixture not found' });
            }
            return FixtureActions.loadFixtureSuccess({ fixture });
          }),
          catchError(error => 
            of(FixtureActions.loadFixtureFailure({ 
              error: error.message || 'Failed to load fixture' 
            }))
          )
        )
      )
    )
  );

  loadPlayerFixtures$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FixtureActions.loadPlayerFixtures),
      switchMap(({ profileId, leagueId, seasonId }) =>
        this.fixtureService.getPlayerFixtures$(profileId, leagueId, seasonId).pipe(
          map(fixtures => FixtureActions.loadPlayerFixturesSuccess({ fixtures })),
          catchError(error => 
            of(FixtureActions.loadPlayerFixturesFailure({ 
              error: error.message || 'Failed to load player fixtures' 
            }))
          )
        )
      )
    )
  );

  markOverdueFixtures$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FixtureActions.markOverdueFixtures),
      switchMap(() =>
        this.fixtureService.markOverdueFixtures$().pipe(
          map(count => FixtureActions.markOverdueFixturesSuccess({ count })),
          catchError(error => 
            of(FixtureActions.markOverdueFixturesFailure({ 
              error: error.message || 'Failed to mark overdue fixtures' 
            }))
          )
        )
      )
    )
  );
}

