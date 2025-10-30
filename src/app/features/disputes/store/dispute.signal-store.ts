import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { DisputeService } from '../services/dispute.service';
import {
  Dispute,
  DisputeWithDetails,
  CreateDisputeRequest,
  ResolveDisputeRequest,
} from '../models/dispute.model';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

export interface DisputeState {
  disputes: DisputeWithDetails[];
  currentDispute: DisputeWithDetails | null;
  loading: boolean;
  error: any | null;
}

const initialState: DisputeState = {
  disputes: [],
  currentDispute: null,
  loading: false,
  error: null,
};

export const DisputeSignalStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    // Computed signals
    disputes: computed(() => state.disputes()),
    currentDispute: computed(() => state.currentDispute()),
    loading: computed(() => state.loading()),
    error: computed(() => state.error()),

    // Derived selectors
    disputeCount: computed(() => state.disputes().length),
    hasDisputes: computed(() => state.disputes().length > 0),
    openDisputes: computed(() => state.disputes().filter((d) => d.status === 'open')),
    resolvedDisputes: computed(() => state.disputes().filter((d) => d.status === 'resolved')),
  })),
  withMethods((store, disputeService = inject(DisputeService)) => ({
    // Clear error
    clearError: () => {
      patchState(store, { error: null });
    },

    // Clear all state
    clearDisputes: () => {
      patchState(store, initialState);
    },

    // Create a new dispute
    createDispute: rxMethod<CreateDisputeRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((request) =>
          disputeService.createDispute(request).pipe(
            tap(() => {
              patchState(store, {
                loading: false,
                error: null,
              });
            }),
            catchError((error) => {
              patchState(store, {
                loading: false,
                error: error.message || 'Failed to create dispute',
              });
              return of(null);
            })
          )
        )
      )
    ),

    // Resolve a dispute
    resolveDispute: rxMethod<ResolveDisputeRequest>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((request) =>
          disputeService.resolveDispute(request).pipe(
            tap(() => {
              patchState(store, {
                disputes: store.disputes().filter((d) => d.id !== request.dispute_id),
                loading: false,
                error: null,
              });
            }),
            catchError((error) => {
              patchState(store, {
                loading: false,
                error: error.message || 'Failed to resolve dispute',
              });
              return of(null);
            })
          )
        )
      )
    ),

    // Withdraw a dispute
    withdrawDispute: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((disputeId) =>
          disputeService.withdrawDispute(disputeId).pipe(
            tap(() => {
              patchState(store, {
                disputes: store.disputes().filter((d) => d.id !== disputeId),
                loading: false,
                error: null,
              });
            }),
            catchError((error) => {
              patchState(store, {
                loading: false,
                error: error.message || 'Failed to withdraw dispute',
              });
              return of(null);
            })
          )
        )
      )
    ),

    // Load disputes for a specific match
    loadMatchDisputes: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((matchId) =>
          disputeService.getMatchDisputes(matchId).pipe(
            tap((disputes) => {
              patchState(store, {
                disputes,
                loading: false,
                error: null,
              });
            }),
            catchError((error) => {
              patchState(store, {
                loading: false,
                error: error.message || 'Failed to load match disputes',
              });
              return of(null);
            })
          )
        )
      )
    ),

    // Load disputes for a league
    loadLeagueDisputes: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((leagueId) =>
          disputeService.getLeagueDisputes(leagueId).pipe(
            tap((disputes) => {
              patchState(store, {
                disputes,
                loading: false,
                error: null,
              });
            }),
            catchError((error) => {
              patchState(store, {
                loading: false,
                error: error.message || 'Failed to load league disputes',
              });
              return of(null);
            })
          )
        )
      )
    ),

    // Load a single dispute
    loadDispute: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((disputeId) =>
          disputeService.getDisputeById(disputeId).pipe(
            tap((dispute) => {
              patchState(store, {
                currentDispute: dispute,
                loading: false,
                error: null,
              });
            }),
            catchError((error) => {
              patchState(store, {
                loading: false,
                error: error.message || 'Failed to load dispute',
              });
              return of(null);
            })
          )
        )
      )
    ),
  }))
);
