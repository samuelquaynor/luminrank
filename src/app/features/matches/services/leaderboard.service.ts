import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LeaderboardEntry, Leaderboard, PlayerStats } from '../models/leaderboard.model';

/**
 * Leaderboard Service - Handles standings calculation and retrieval
 * Phase 2: Match Recording & Leaderboard
 */
@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private supabase: SupabaseClient;

  constructor() {
    // Inject Supabase client (will be provided by app config)
    this.supabase = inject(SupabaseClient);
  }

  /**
   * Get leaderboard for a league
   * Calls the database function to calculate standings
   */
  getLeagueLeaderboard(leagueId: string): Observable<Leaderboard> {
    return from(
      this.supabase.rpc('calculate_league_standings', {
        p_league_id: leagueId
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }

        const entries: LeaderboardEntry[] = (data || []).map((entry: any) => ({
          rank: entry.rank,
          profile_id: entry.profile_id,
          display_name: entry.name,
          matches_played: entry.matches_played,
          wins: entry.wins,
          losses: entry.losses,
          points: entry.points,
          win_rate: entry.win_rate
        }));

        return {
          league_id: leagueId,
          entries,
          updated_at: new Date().toISOString()
        } as Leaderboard;
      }),
      catchError(error => {
        console.error('Error fetching leaderboard:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get player stats for a specific player in a league
   */
  getPlayerStats(leagueId: string, profileId: string): Observable<PlayerStats | null> {
    return this.getLeagueLeaderboard(leagueId).pipe(
      map(leaderboard => {
        const entry = leaderboard.entries.find(e => e.profile_id === profileId);
        
        if (!entry) {
          return null;
        }

        return {
          profile_id: entry.profile_id,
          display_name: entry.display_name,
          matches_played: entry.matches_played,
          wins: entry.wins,
          losses: entry.losses,
          points: entry.points,
          win_rate: entry.win_rate,
          rank: entry.rank
        } as PlayerStats;
      }),
      catchError(error => {
        console.error('Error fetching player stats:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get top N players from leaderboard
   */
  getTopPlayers(leagueId: string, limit: number = 10): Observable<LeaderboardEntry[]> {
    return this.getLeagueLeaderboard(leagueId).pipe(
      map(leaderboard => leaderboard.entries.slice(0, limit)),
      catchError(error => {
        console.error('Error fetching top players:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if a player is in the top N
   */
  isPlayerInTopN(leagueId: string, profileId: string, n: number = 3): Observable<boolean> {
    return this.getLeagueLeaderboard(leagueId).pipe(
      map(leaderboard => {
        const entry = leaderboard.entries.find(e => e.profile_id === profileId);
        return entry ? entry.rank <= n : false;
      }),
      catchError(error => {
        console.error('Error checking player rank:', error);
        return throwError(() => error);
      })
    );
  }
}

