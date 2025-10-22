import { Injectable, inject, signal, computed } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, catchError, tap, map } from 'rxjs';
import { of } from 'rxjs';
import { LeagueService } from '../services/league.service';
import { MemberService } from '../services/member.service';
import {
  League,
  LeagueWithDetails,
  CreateLeagueData,
  UpdateLeagueData,
  LeagueMember,
} from '../models/league.model';

export interface LeagueState {
  leagues: League[];
  selectedLeague: LeagueWithDetails | null;
  members: { [leagueId: string]: LeagueMember[] };
  loading: boolean;
  error: string | null;
}

@Injectable()
export class LeagueSignalStore {
  private leagueService = inject(LeagueService);
  private memberService = inject(MemberService);

  // State signals
  private state = signal<LeagueState>({
    leagues: [],
    selectedLeague: null,
    members: {},
    loading: false,
    error: null,
  });

  // Selectors (computed signals)
  leagues = computed(() => this.state().leagues);
  selectedLeague = computed(() => this.state().selectedLeague);
  members = computed(() => this.state().members);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);

  // Derived selectors
  myLeaguesCount = computed(() => this.leagues().length);
  leagueById = (id: string) => computed(() => this.leagues().find((l) => l.id === id));
  leagueMembers = (leagueId: string) => computed(() => this.members()[leagueId] || []);

  // Actions
  loadMyLeagues = rxMethod<void>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap(() =>
        this.leagueService.getMyLeagues().pipe(
          tap((leagues) => {
            this.setLeagues(leagues);
          }),
          catchError((error) => {
            this.setError(error.message || 'Failed to load leagues');
            return of(null);
          })
        )
      )
    )
  );

  loadLeague = rxMethod<string>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap((id) =>
        this.leagueService.getLeagueById(id).pipe(
          tap((league) => {
            this.setSelectedLeague(league);
          }),
          catchError((error) => {
            this.setError(error.message || 'Failed to load league');
            return of(null);
          })
        )
      )
    )
  );

  createLeague = rxMethod<CreateLeagueData>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap((data) =>
        this.leagueService.createLeague(data).pipe(
          tap((league) => {
            this.addLeague(league);
          }),
          catchError((error) => {
            this.setError(error.message || 'Failed to create league');
            return of(null);
          })
        )
      )
    )
  );

  updateLeague = rxMethod<{ id: string; data: UpdateLeagueData }>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap(({ id, data }) =>
        this.leagueService.updateLeague(id, data).pipe(
          tap((league) => {
            this.updateLeagueInState(league);
          }),
          catchError((error) => {
            this.setError(error.message || 'Failed to update league');
            return of(null);
          })
        )
      )
    )
  );

  deleteLeague = rxMethod<string>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap((id) =>
        this.leagueService.deleteLeague(id).pipe(
          tap(() => {
            this.removeLeague(id);
          }),
          catchError((error) => {
            this.setError(error.message || 'Failed to delete league');
            return of(null);
          })
        )
      )
    )
  );

  joinLeague = rxMethod<string>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap((code) =>
        this.leagueService.joinLeagueByCode(code).pipe(
          tap((league) => {
            this.addLeague(league);
          }),
          catchError((error) => {
            this.setError(error.message || 'Failed to join league');
            return of(null);
          })
        )
      )
    )
  );

  leaveLeague = rxMethod<string>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap((id) =>
        this.leagueService.leaveLeague(id).pipe(
          tap(() => {
            this.removeLeague(id);
          }),
          catchError((error) => {
            this.setError(error.message || 'Failed to leave league');
            return of(null);
          })
        )
      )
    )
  );

  loadLeagueMembers = rxMethod<string>(
    pipe(
      tap(() => this.setLoading(true)),
      switchMap((leagueId) =>
        this.memberService.getLeagueMembers(leagueId).pipe(
          tap((members) => {
            this.setLeagueMembers(leagueId, members);
          }),
          catchError((error) => {
            this.setError(error.message || 'Failed to load league members');
            return of(null);
          })
        )
      )
    )
  );

  clearError = () => {
    this.state.update((state) => ({ ...state, error: null }));
  };

  clearSelectedLeague = () => {
    this.state.update((state) => ({ ...state, selectedLeague: null }));
  };

  // Private helper methods
  private setLoading(loading: boolean) {
    this.state.update((state) => ({ ...state, loading, error: null }));
  }

  private setLeagues(leagues: League[]) {
    this.state.update((state) => ({
      ...state,
      leagues,
      loading: false,
      error: null,
    }));
  }

  private setSelectedLeague(league: LeagueWithDetails) {
    this.state.update((state) => ({
      ...state,
      selectedLeague: league,
      loading: false,
      error: null,
    }));
  }

  private addLeague(league: League) {
    this.state.update((state) => ({
      ...state,
      leagues: [league, ...state.leagues],
      loading: false,
      error: null,
    }));
  }

  private updateLeagueInState(league: League) {
    this.state.update((state) => ({
      ...state,
      leagues: state.leagues.map((l) => (l.id === league.id ? league : l)),
      selectedLeague:
        state.selectedLeague?.id === league.id
          ? { ...state.selectedLeague, ...league }
          : state.selectedLeague,
      loading: false,
      error: null,
    }));
  }

  private removeLeague(id: string) {
    this.state.update((state) => ({
      ...state,
      leagues: state.leagues.filter((l) => l.id !== id),
      selectedLeague: state.selectedLeague?.id === id ? null : state.selectedLeague,
      loading: false,
      error: null,
    }));
  }

  private setLeagueMembers(leagueId: string, members: LeagueMember[]) {
    this.state.update((state) => ({
      ...state,
      members: {
        ...state.members,
        [leagueId]: members,
      },
      loading: false,
      error: null,
    }));
  }

  private setError(error: string) {
    this.state.update((state) => ({
      ...state,
      loading: false,
      error,
    }));
  }
}
