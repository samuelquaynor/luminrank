import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { MatchService } from '../services/match.service';
import { LeaderboardService } from '../services/leaderboard.service';
import { Match, MatchWithDetails, CreateMatchRequest } from '../models/match.model';
import { Leaderboard, LeaderboardEntry, PlayerStats } from '../models/leaderboard.model';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

/**
 * Combined Match & Leaderboard State
 * These two features are tightly coupled since leaderboard depends on matches
 */
export interface MatchState {
  // Match state
  matches: MatchWithDetails[];
  selectedMatch: MatchWithDetails | null;
  matchLoading: boolean;
  matchError: string | null;
  recordingMatch: boolean;

  // Leaderboard state
  leaderboard: Leaderboard | null;
  playerStats: PlayerStats | null;
  topPlayers: LeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
}

const initialState: MatchState = {
  // Match state
  matches: [],
  selectedMatch: null,
  matchLoading: false,
  matchError: null,
  recordingMatch: false,

  // Leaderboard state
  leaderboard: null,
  playerStats: null,
  topPlayers: [],
  leaderboardLoading: false,
  leaderboardError: null,
};

export const MatchSignalStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((state) => ({
    // Match computed signals
    matches: computed(() => state.matches()),
    selectedMatch: computed(() => state.selectedMatch()),
    matchLoading: computed(() => state.matchLoading()),
    matchError: computed(() => state.matchError()),
    recordingMatch: computed(() => state.recordingMatch()),

    // Leaderboard computed signals
    leaderboard: computed(() => state.leaderboard()),
    leaderboardEntries: computed(() => state.leaderboard()?.entries || ([] as LeaderboardEntry[])),
    playerStats: computed(() => state.playerStats()),
    topPlayers: computed(() => state.topPlayers()),
    leaderboardLoading: computed(() => state.leaderboardLoading()),
    leaderboardError: computed(() => state.leaderboardError()),

    // Derived selectors
    matchCount: computed(() => state.matches().length),
    hasMatches: computed(() => state.matches().length > 0),
  })),
  withMethods(
    (
      store,
      matchService = inject(MatchService),
      leaderboardService = inject(LeaderboardService)
    ) => ({
      // ============ Match Methods ============

      // Helper method to get match by ID
      getMatchById: (id: string) => {
        return store.matches().find((m) => m.id === id);
      },

      clearMatchError: () => {
        patchState(store, { matchError: null });
      },

      clearLeaderboardError: () => {
        patchState(store, { leaderboardError: null });
      },

      clearAllErrors: () => {
        patchState(store, { matchError: null, leaderboardError: null });
      },

      clearMatchState: () => {
        patchState(store, {
          matches: [],
          selectedMatch: null,
          matchLoading: false,
          matchError: null,
          recordingMatch: false,
        });
      },

      clearLeaderboardState: () => {
        patchState(store, {
          leaderboard: null,
          playerStats: null,
          topPlayers: [],
          leaderboardLoading: false,
          leaderboardError: null,
        });
      },

      // Record a new match
      recordMatch: rxMethod<CreateMatchRequest>(
        pipe(
          tap(() => patchState(store, { recordingMatch: true, matchError: null })),
          switchMap((request) =>
            matchService.recordMatch(request).pipe(
              tap((match) => {
                patchState(store, {
                  matches: [match, ...store.matches()],
                  recordingMatch: false,
                  matchError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  recordingMatch: false,
                  matchError: error.message || 'Failed to record match',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load all matches for a league
      loadLeagueMatches: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { matchLoading: true, matchError: null })),
          switchMap((leagueId) =>
            matchService.getLeagueMatches(leagueId).pipe(
              tap((matches) => {
                patchState(store, {
                  matches,
                  matchLoading: false,
                  matchError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  matchLoading: false,
                  matchError: error.message || 'Failed to load matches',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load a single match
      loadMatch: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { matchLoading: true, matchError: null })),
          switchMap((matchId) =>
            matchService.getMatchById(matchId).pipe(
              tap((match) => {
                patchState(store, {
                  selectedMatch: match,
                  matchLoading: false,
                  matchError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  matchLoading: false,
                  matchError: error.message || 'Failed to load match',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load player matches
      loadPlayerMatches: rxMethod<{ leagueId: string; profileId: string }>(
        pipe(
          tap(() => patchState(store, { matchLoading: true, matchError: null })),
          switchMap(({ leagueId, profileId }) =>
            matchService.getPlayerMatches(leagueId, profileId).pipe(
              tap((matches) => {
                patchState(store, {
                  matches,
                  matchLoading: false,
                  matchError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  matchLoading: false,
                  matchError: error.message || 'Failed to load player matches',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Cancel a match
      cancelMatch: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { matchLoading: true, matchError: null })),
          switchMap((matchId) =>
            matchService.cancelMatch(matchId).pipe(
              tap(() => {
                patchState(store, {
                  matches: store.matches().filter((m) => m.id !== matchId),
                  matchLoading: false,
                  matchError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  matchLoading: false,
                  matchError: error.message || 'Failed to cancel match',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // ============ Leaderboard Methods ============

      // Load leaderboard for a league
      loadLeaderboard: rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              leaderboardLoading: true,
              leaderboardError: null,
            })
          ),
          switchMap((leagueId) =>
            leaderboardService.getLeagueLeaderboard(leagueId).pipe(
              tap((leaderboard) => {
                patchState(store, {
                  leaderboard,
                  leaderboardLoading: false,
                  leaderboardError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  leaderboardLoading: false,
                  leaderboardError: error.message || 'Failed to load leaderboard',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load player stats
      loadPlayerStats: rxMethod<{ leagueId: string; profileId: string }>(
        pipe(
          tap(() =>
            patchState(store, {
              leaderboardLoading: true,
              leaderboardError: null,
            })
          ),
          switchMap(({ leagueId, profileId }) =>
            leaderboardService.getPlayerStats(leagueId, profileId).pipe(
              tap((stats) => {
                patchState(store, {
                  playerStats: stats,
                  leaderboardLoading: false,
                  leaderboardError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  leaderboardLoading: false,
                  leaderboardError: error.message || 'Failed to load player stats',
                });
                return of(null);
              })
            )
          )
        )
      ),

      // Load top players
      loadTopPlayers: rxMethod<{ leagueId: string; limit: number }>(
        pipe(
          tap(() =>
            patchState(store, {
              leaderboardLoading: true,
              leaderboardError: null,
            })
          ),
          switchMap(({ leagueId, limit }) =>
            leaderboardService.getTopPlayers(leagueId, limit).pipe(
              tap((topPlayers) => {
                patchState(store, {
                  topPlayers,
                  leaderboardLoading: false,
                  leaderboardError: null,
                });
              }),
              catchError((error) => {
                patchState(store, {
                  leaderboardLoading: false,
                  leaderboardError: error.message || 'Failed to load top players',
                });
                return of(null);
              })
            )
          )
        )
      ),
    })
  )
);
