import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { MatchService } from '../services/match.service';
import * as MatchActions from './match.actions';

/**
 * Match Effects for Phase 2: Match Recording & Leaderboard
 */
@Injectable()
export class MatchEffects {
  private actions$ = inject(Actions);
  private matchService = inject(MatchService);

  /**
   * Record match effect
   */
  recordMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.recordMatch),
      switchMap(({ request }) =>
        this.matchService.recordMatch(request).pipe(
          map(match => MatchActions.recordMatchSuccess({ match })),
          catchError(error =>
            of(MatchActions.recordMatchFailure({ error: error.message || 'Failed to record match' }))
          )
        )
      )
    )
  );

  /**
   * Load league matches effect
   */
  loadLeagueMatches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.loadLeagueMatches),
      switchMap(({ leagueId }) =>
        this.matchService.getLeagueMatches(leagueId).pipe(
          map(matches => MatchActions.loadLeagueMatchesSuccess({ matches })),
          catchError(error =>
            of(MatchActions.loadLeagueMatchesFailure({ error: error.message || 'Failed to load matches' }))
          )
        )
      )
    )
  );

  /**
   * Load single match effect
   */
  loadMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.loadMatch),
      switchMap(({ matchId }) =>
        this.matchService.getMatchById(matchId).pipe(
          map(match => MatchActions.loadMatchSuccess({ match })),
          catchError(error =>
            of(MatchActions.loadMatchFailure({ error: error.message || 'Failed to load match' }))
          )
        )
      )
    )
  );

  /**
   * Load player matches effect
   */
  loadPlayerMatches$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.loadPlayerMatches),
      switchMap(({ leagueId, profileId }) =>
        this.matchService.getPlayerMatches(leagueId, profileId).pipe(
          map(matches => MatchActions.loadPlayerMatchesSuccess({ matches })),
          catchError(error =>
            of(MatchActions.loadPlayerMatchesFailure({ error: error.message || 'Failed to load player matches' }))
          )
        )
      )
    )
  );

  /**
   * Cancel match effect
   */
  cancelMatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.cancelMatch),
      switchMap(({ matchId }) =>
        this.matchService.cancelMatch(matchId).pipe(
          map(match => MatchActions.cancelMatchSuccess({ match })),
          catchError(error =>
            of(MatchActions.cancelMatchFailure({ error: error.message || 'Failed to cancel match' }))
          )
        )
      )
    )
  );
}

