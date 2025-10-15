import { createReducer, on } from '@ngrx/store';
import { DisputeWithDetails } from '../models/dispute.model';
import * as DisputeActions from './dispute.actions';

export interface DisputeState {
  disputes: DisputeWithDetails[];
  currentDispute: DisputeWithDetails | null;
  loading: boolean;
  error: any | null;
}

export const initialState: DisputeState = {
  disputes: [],
  currentDispute: null,
  loading: false,
  error: null
};

export const disputeReducer = createReducer(
  initialState,

  // Create Dispute
  on(DisputeActions.createDispute, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DisputeActions.createDisputeSuccess, (state) => ({
    ...state,
    loading: false
  })),
  on(DisputeActions.createDisputeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Resolve Dispute
  on(DisputeActions.resolveDispute, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DisputeActions.resolveDisputeSuccess, (state, { disputeId }) => ({
    ...state,
    loading: false,
    disputes: state.disputes.filter(d => d.id !== disputeId)
  })),
  on(DisputeActions.resolveDisputeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Withdraw Dispute
  on(DisputeActions.withdrawDispute, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DisputeActions.withdrawDisputeSuccess, (state, { disputeId }) => ({
    ...state,
    loading: false,
    disputes: state.disputes.filter(d => d.id !== disputeId)
  })),
  on(DisputeActions.withdrawDisputeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Match Disputes
  on(DisputeActions.loadMatchDisputes, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DisputeActions.loadMatchDisputesSuccess, (state, { disputes }) => ({
    ...state,
    loading: false,
    disputes
  })),
  on(DisputeActions.loadMatchDisputesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load League Disputes
  on(DisputeActions.loadLeagueDisputes, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DisputeActions.loadLeagueDisputesSuccess, (state, { disputes }) => ({
    ...state,
    loading: false,
    disputes
  })),
  on(DisputeActions.loadLeagueDisputesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Single Dispute
  on(DisputeActions.loadDispute, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DisputeActions.loadDisputeSuccess, (state, { dispute }) => ({
    ...state,
    loading: false,
    currentDispute: dispute
  })),
  on(DisputeActions.loadDisputeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Clear Disputes
  on(DisputeActions.clearDisputes, () => initialState)
);

