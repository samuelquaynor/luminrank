import { createAction, props } from '@ngrx/store';
import { Dispute, DisputeWithDetails, CreateDisputeRequest, ResolveDisputeRequest } from '../models/dispute.model';

// Create Dispute
export const createDispute = createAction(
  '[Dispute] Create Dispute',
  props<{ request: CreateDisputeRequest }>()
);

export const createDisputeSuccess = createAction(
  '[Dispute] Create Dispute Success',
  props<{ disputeId: string }>()
);

export const createDisputeFailure = createAction(
  '[Dispute] Create Dispute Failure',
  props<{ error: any }>()
);

// Resolve Dispute
export const resolveDispute = createAction(
  '[Dispute] Resolve Dispute',
  props<{ request: ResolveDisputeRequest }>()
);

export const resolveDisputeSuccess = createAction(
  '[Dispute] Resolve Dispute Success',
  props<{ disputeId: string }>()
);

export const resolveDisputeFailure = createAction(
  '[Dispute] Resolve Dispute Failure',
  props<{ error: any }>()
);

// Withdraw Dispute
export const withdrawDispute = createAction(
  '[Dispute] Withdraw Dispute',
  props<{ disputeId: string }>()
);

export const withdrawDisputeSuccess = createAction(
  '[Dispute] Withdraw Dispute Success',
  props<{ disputeId: string }>()
);

export const withdrawDisputeFailure = createAction(
  '[Dispute] Withdraw Dispute Failure',
  props<{ error: any }>()
);

// Load Match Disputes
export const loadMatchDisputes = createAction(
  '[Dispute] Load Match Disputes',
  props<{ matchId: string }>()
);

export const loadMatchDisputesSuccess = createAction(
  '[Dispute] Load Match Disputes Success',
  props<{ disputes: DisputeWithDetails[] }>()
);

export const loadMatchDisputesFailure = createAction(
  '[Dispute] Load Match Disputes Failure',
  props<{ error: any }>()
);

// Load League Disputes
export const loadLeagueDisputes = createAction(
  '[Dispute] Load League Disputes',
  props<{ leagueId: string }>()
);

export const loadLeagueDisputesSuccess = createAction(
  '[Dispute] Load League Disputes Success',
  props<{ disputes: DisputeWithDetails[] }>()
);

export const loadLeagueDisputesFailure = createAction(
  '[Dispute] Load League Disputes Failure',
  props<{ error: any }>()
);

// Load Single Dispute
export const loadDispute = createAction(
  '[Dispute] Load Dispute',
  props<{ disputeId: string }>()
);

export const loadDisputeSuccess = createAction(
  '[Dispute] Load Dispute Success',
  props<{ dispute: DisputeWithDetails }>()
);

export const loadDisputeFailure = createAction(
  '[Dispute] Load Dispute Failure',
  props<{ error: any }>()
);

// Clear Disputes
export const clearDisputes = createAction('[Dispute] Clear Disputes');

