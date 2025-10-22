import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom } from 'rxjs/operators';
import { DisputeService } from '../services/dispute.service';
import * as DisputeActions from './dispute.actions';
import * as MatchActions from '../../matches/store/match.actions';
import { LeagueSignalStore } from '../../leagues/store/league.signal-store';

@Injectable()
export class DisputeEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private disputeService = inject(DisputeService);
  private leagueStore = inject(LeagueSignalStore);

  createDispute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DisputeActions.createDispute),
      switchMap(({ request }) =>
        this.disputeService.createDispute(request).pipe(
          map((disputeId) => DisputeActions.createDisputeSuccess({ disputeId })),
          catchError((error) => of(DisputeActions.createDisputeFailure({ error })))
        )
      )
    )
  );

  resolveDispute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DisputeActions.resolveDispute),
      switchMap(({ request }) =>
        this.disputeService.resolveDispute(request).pipe(
          map(() => DisputeActions.resolveDisputeSuccess({ disputeId: request.dispute_id })),
          catchError((error) => of(DisputeActions.resolveDisputeFailure({ error })))
        )
      )
    )
  );

  withdrawDispute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DisputeActions.withdrawDispute),
      switchMap(({ disputeId }) =>
        this.disputeService.withdrawDispute(disputeId).pipe(
          map(() => DisputeActions.withdrawDisputeSuccess({ disputeId })),
          catchError((error) => of(DisputeActions.withdrawDisputeFailure({ error })))
        )
      )
    )
  );

  loadMatchDisputes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DisputeActions.loadMatchDisputes),
      switchMap(({ matchId }) =>
        this.disputeService.getMatchDisputes(matchId).pipe(
          map((disputes) => DisputeActions.loadMatchDisputesSuccess({ disputes })),
          catchError((error) => of(DisputeActions.loadMatchDisputesFailure({ error })))
        )
      )
    )
  );

  loadLeagueDisputes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DisputeActions.loadLeagueDisputes),
      switchMap(({ leagueId }) =>
        this.disputeService.getLeagueDisputes(leagueId).pipe(
          map((disputes) => DisputeActions.loadLeagueDisputesSuccess({ disputes })),
          catchError((error) => of(DisputeActions.loadLeagueDisputesFailure({ error })))
        )
      )
    )
  );

  loadDispute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DisputeActions.loadDispute),
      switchMap(({ disputeId }) =>
        this.disputeService.getDisputeById(disputeId).pipe(
          map((dispute) => DisputeActions.loadDisputeSuccess({ dispute })),
          catchError((error) => of(DisputeActions.loadDisputeFailure({ error })))
        )
      )
    )
  );

  // Reload matches after dispute is created/resolved/withdrawn
  reloadMatchesAfterDisputeChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        DisputeActions.createDisputeSuccess,
        DisputeActions.resolveDisputeSuccess,
        DisputeActions.withdrawDisputeSuccess
      ),
      map(() => {
        const league = this.leagueStore.selectedLeague();
        if (league?.id) {
          return MatchActions.loadLeagueMatches({ leagueId: league.id });
        }
        return { type: 'NO_OP' };
      })
    )
  );
}
