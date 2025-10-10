import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FixtureState } from './fixture.reducer';

export const selectFixtureState = createFeatureSelector<FixtureState>('fixture');

export const selectAllFixtures = createSelector(
  selectFixtureState,
  (state) => state.fixtures
);

export const selectSelectedFixture = createSelector(
  selectFixtureState,
  (state) => state.selectedFixture
);

export const selectGenerationResult = createSelector(
  selectFixtureState,
  (state) => state.generationResult
);

export const selectFixtureLoading = createSelector(
  selectFixtureState,
  (state) => state.loading
);

export const selectFixtureError = createSelector(
  selectFixtureState,
  (state) => state.error
);

// Derived selectors
export const selectScheduledFixtures = createSelector(
  selectAllFixtures,
  (fixtures) => fixtures.filter(f => f.status === 'scheduled')
);

export const selectCompletedFixtures = createSelector(
  selectAllFixtures,
  (fixtures) => fixtures.filter(f => f.status === 'completed')
);

export const selectOverdueFixtures = createSelector(
  selectAllFixtures,
  (fixtures) => fixtures.filter(f => f.status === 'overdue')
);

export const selectFixturesByRound = createSelector(
  selectAllFixtures,
  (fixtures) => {
    const byRound = new Map<number, typeof fixtures>();
    fixtures.forEach(fixture => {
      const round = fixture.round_number;
      if (!byRound.has(round)) {
        byRound.set(round, []);
      }
      byRound.get(round)!.push(fixture);
    });
    return byRound;
  }
);

export const selectUpcomingFixtures = createSelector(
  selectAllFixtures,
  (fixtures) => {
    const now = new Date();
    return fixtures
      .filter(f => f.status === 'scheduled' && new Date(f.scheduled_date) > now)
      .sort((a, b) => 
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      );
  }
);

