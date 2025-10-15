import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DisputeState } from './dispute.reducer';

export const selectDisputeState = createFeatureSelector<DisputeState>('dispute');

export const selectAllDisputes = createSelector(
  selectDisputeState,
  (state) => state.disputes
);

export const selectCurrentDispute = createSelector(
  selectDisputeState,
  (state) => state.currentDispute
);

export const selectDisputeLoading = createSelector(
  selectDisputeState,
  (state) => state.loading
);

export const selectDisputeError = createSelector(
  selectDisputeState,
  (state) => state.error
);

export const selectDisputeCount = createSelector(
  selectAllDisputes,
  (disputes) => disputes.length
);

export const selectOpenDisputes = createSelector(
  selectAllDisputes,
  (disputes) => disputes.filter(d => d.status === 'open')
);

export const selectResolvedDisputes = createSelector(
  selectAllDisputes,
  (disputes) => disputes.filter(d => d.status === 'resolved')
);

