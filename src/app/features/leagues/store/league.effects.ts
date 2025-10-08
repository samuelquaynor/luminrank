import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { LeagueService } from '../services/league.service';
import { MemberService } from '../services/member.service';
import * as LeagueActions from './league.actions';

@Injectable()
export class LeagueEffects {
  private actions$ = inject(Actions);
  private leagueService = inject(LeagueService);
  private memberService = inject(MemberService);

  loadMyLeagues$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeagueActions.loadMyLeagues),
      switchMap(() =>
        this.leagueService.getMyLeagues().pipe(
          map(leagues => LeagueActions.loadMyLeaguesSuccess({ leagues })),
          catchError(error => of(LeagueActions.loadMyLeaguesFailure({ error: error.message })))
        )
      )
    )
  );

  loadLeague$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeagueActions.loadLeague),
      switchMap(({ id }) =>
        this.leagueService.getLeagueById(id).pipe(
          map(league => LeagueActions.loadLeagueSuccess({ league })),
          catchError(error => of(LeagueActions.loadLeagueFailure({ error: error.message })))
        )
      )
    )
  );

  createLeague$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeagueActions.createLeague),
      switchMap(({ data }) =>
        this.leagueService.createLeague(data).pipe(
          map(league => LeagueActions.createLeagueSuccess({ league })),
          catchError(error => of(LeagueActions.createLeagueFailure({ error: error.message })))
        )
      )
    )
  );

  updateLeague$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeagueActions.updateLeague),
      switchMap(({ id, data }) =>
        this.leagueService.updateLeague(id, data).pipe(
          map(league => LeagueActions.updateLeagueSuccess({ league })),
          catchError(error => of(LeagueActions.updateLeagueFailure({ error: error.message })))
        )
      )
    )
  );

  deleteLeague$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeagueActions.deleteLeague),
      switchMap(({ id }) =>
        this.leagueService.deleteLeague(id).pipe(
          map(() => LeagueActions.deleteLeagueSuccess({ id })),
          catchError(error => of(LeagueActions.deleteLeagueFailure({ error: error.message })))
        )
      )
    )
  );

  joinLeague$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeagueActions.joinLeague),
      switchMap(({ code }) =>
        this.leagueService.joinLeagueByCode(code).pipe(
          map(league => LeagueActions.joinLeagueSuccess({ league })),
          catchError(error => of(LeagueActions.joinLeagueFailure({ error: error.message })))
        )
      )
    )
  );

  leaveLeague$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeagueActions.leaveLeague),
      switchMap(({ id }) =>
        this.leagueService.leaveLeague(id).pipe(
          map(() => LeagueActions.leaveLeagueSuccess({ id })),
          catchError(error => of(LeagueActions.leaveLeagueFailure({ error: error.message })))
        )
      )
    )
  );

  loadLeagueMembers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LeagueActions.loadLeagueMembers),
      switchMap(({ leagueId }) =>
        this.memberService.getLeagueMembers(leagueId).pipe(
          map(members => LeagueActions.loadLeagueMembersSuccess({ leagueId, members })),
          catchError(error => of(LeagueActions.loadLeagueMembersFailure({ error: error.message })))
        )
      )
    )
  );
}
