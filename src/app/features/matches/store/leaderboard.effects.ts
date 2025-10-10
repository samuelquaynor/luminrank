import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { LeaderboardService } from '../services/leaderboard.service';
import * as LeaderboardActions from './leaderboard.actions';

/**
 * Leaderboard Effects for Phase 2: Match Recording & Leaderboard
 */
@Injectable()
export class LeaderboardEffects {
  private actions$ = inject(Actions);
  private leaderboardService = inject(LeaderboardService);

  /**
   * Load leaderboard effect
   */
  loadLeaderboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeaderboardActions.loadLeaderboard),
      switchMap(({ leagueId }) =>
        this.leaderboardService.getLeagueLeaderboard(leagueId).pipe(
          map(leaderboard => LeaderboardActions.loadLeaderboardSuccess({ leaderboard })),
          catchError(error =>
            of(LeaderboardActions.loadLeaderboardFailure({ 
              error: error.message || 'Failed to load leaderboard' 
            }))
          )
        )
      )
    )
  );

  /**
   * Load player stats effect
   */
  loadPlayerStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeaderboardActions.loadPlayerStats),
      switchMap(({ leagueId, profileId }) =>
        this.leaderboardService.getPlayerStats(leagueId, profileId).pipe(
          map(stats => LeaderboardActions.loadPlayerStatsSuccess({ stats })),
          catchError(error =>
            of(LeaderboardActions.loadPlayerStatsFailure({ 
              error: error.message || 'Failed to load player stats' 
            }))
          )
        )
      )
    )
  );

  /**
   * Load top players effect
   */
  loadTopPlayers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeaderboardActions.loadTopPlayers),
      switchMap(({ leagueId, limit }) =>
        this.leaderboardService.getTopPlayers(leagueId, limit).pipe(
          map(topPlayers => LeaderboardActions.loadTopPlayersSuccess({ topPlayers })),
          catchError(error =>
            of(LeaderboardActions.loadTopPlayersFailure({ 
              error: error.message || 'Failed to load top players' 
            }))
          )
        )
      )
    )
  );
}

