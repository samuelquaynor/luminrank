import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import {
  Match,
  MatchWithDetails,
  CreateMatchRequest,
  MatchStatus,
  MatchParticipant,
} from '../models/match.model';

/**
 * Match Service - Handles match recording and retrieval
 * Phase 2: Match Recording & Leaderboard
 */
@Injectable({
  providedIn: 'root',
})
export class MatchService {
  private supabase: SupabaseClient;

  constructor() {
    // Inject Supabase client (will be provided by app config)
    this.supabase = inject(SupabaseClient);
  }

  /**
   * Record a new match
   * Creates a match and its participants in a transaction
   */
  recordMatch(request: CreateMatchRequest): Observable<MatchWithDetails> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: { user }, error: authError }) => {
        if (authError || !user) {
          return throwError(() => new Error('User not authenticated'));
        }

        // Validate request
        if (request.participants.length !== 2) {
          return throwError(() => new Error('Match must have exactly 2 participants'));
        }

        // Validate scores and results
        const [p1, p2] = request.participants;
        const hasWinner = p1.result === 'win' || p2.result === 'win';
        const hasLoser = p1.result === 'loss' || p2.result === 'loss';

        if (!hasWinner || !hasLoser) {
          return throwError(() => new Error('Match must have exactly one winner and one loser'));
        }

        if (p1.result === p2.result) {
          return throwError(() => new Error('Participants cannot have the same result'));
        }

        // Create match
        return from(
          this.supabase
            .from('matches')
            .insert({
              league_id: request.league_id,
              match_date: request.match_date,
              recorded_by: user.id,
              status: MatchStatus.COMPLETED,
            })
            .select()
            .single()
        ).pipe(
          switchMap(({ data: match, error: matchError }) => {
            if (matchError || !match) {
              return throwError(() => new Error(matchError?.message || 'Failed to create match'));
            }

            // Create participants
            const participantsData = request.participants.map((p) => ({
              match_id: match.id,
              profile_id: p.profile_id,
              score: p.score,
              result: p.result,
            }));

            return from(
              this.supabase
                .from('match_participants')
                .insert(participantsData)
                .select('*, profiles!match_participants_profile_id_fkey(name)')
            ).pipe(
              map(({ data: participants, error: participantsError }) => {
                if (participantsError || !participants) {
                  throw new Error(participantsError?.message || 'Failed to create participants');
                }

                // Map participants with display names
                const mappedParticipants: MatchParticipant[] = participants.map((p: any) => ({
                  id: p.id,
                  match_id: p.match_id,
                  profile_id: p.profile_id,
                  score: p.score,
                  result: p.result,
                  created_at: p.created_at,
                  display_name: p.profiles?.name,
                }));

                return {
                  ...match,
                  participants: mappedParticipants,
                } as MatchWithDetails;
              })
            );
          })
        );
      }),
      catchError((error) => {
        console.error('Error recording match:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all matches for a league
   */
  getLeagueMatches(leagueId: string): Observable<MatchWithDetails[]> {
    return from(
      this.supabase
        .from('matches')
        .select(
          `
          *,
          match_participants!inner(
            id,
            profile_id,
            score,
            result,
            created_at,
            profiles!match_participants_profile_id_fkey(name)
          )
        `
        )
        .eq('league_id', leagueId)
        .order('match_date', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }

        return (data || []).map((match: any) => ({
          ...match,
          participants: match.match_participants.map((p: any) => ({
            id: p.id,
            match_id: match.id,
            profile_id: p.profile_id,
            score: p.score,
            result: p.result,
            created_at: p.created_at,
            display_name: p.profiles?.name,
          })),
        })) as MatchWithDetails[];
      }),
      catchError((error) => {
        console.error('Error fetching league matches:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single match by ID
   */
  getMatchById(matchId: string): Observable<MatchWithDetails> {
    return from(
      this.supabase
        .from('matches')
        .select(
          `
          *,
          match_participants!inner(
            id,
            profile_id,
            score,
            result,
            created_at,
            profiles!match_participants_profile_id_fkey(name)
          )
        `
        )
        .eq('id', matchId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          throw new Error(error?.message || 'Match not found');
        }

        return {
          ...data,
          participants: data.match_participants.map((p: any) => ({
            id: p.id,
            match_id: data.id,
            profile_id: p.profile_id,
            score: p.score,
            result: p.result,
            created_at: p.created_at,
            display_name: p.profiles?.name,
          })),
        } as MatchWithDetails;
      }),
      catchError((error) => {
        console.error('Error fetching match:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get matches for a specific player in a league
   */
  getPlayerMatches(leagueId: string, profileId: string): Observable<MatchWithDetails[]> {
    return from(
      this.supabase
        .from('matches')
        .select(
          `
          *,
          match_participants!inner(
            id,
            profile_id,
            score,
            result,
            created_at,
            profiles!match_participants_profile_id_fkey(name)
          )
        `
        )
        .eq('league_id', leagueId)
        .eq('status', MatchStatus.COMPLETED)
        .eq('match_participants.profile_id', profileId)
        .order('match_date', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }

        return (data || []).map((match: any) => ({
          ...match,
          participants: match.match_participants.map((p: any) => ({
            id: p.id,
            match_id: match.id,
            profile_id: p.profile_id,
            score: p.score,
            result: p.result,
            created_at: p.created_at,
            display_name: p.profiles?.name,
          })),
        })) as MatchWithDetails[];
      }),
      catchError((error) => {
        console.error('Error fetching player matches:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel a match (only by the recorder)
   */
  cancelMatch(matchId: string): Observable<Match> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data: { user }, error: authError }) => {
        if (authError || !user) {
          return throwError(() => new Error('User not authenticated'));
        }

        return from(
          this.supabase
            .from('matches')
            .update({ status: MatchStatus.CANCELLED })
            .eq('id', matchId)
            .eq('recorded_by', user.id)
            .select()
            .single()
        ).pipe(
          map(({ data, error }) => {
            if (error || !data) {
              throw new Error(error?.message || 'Failed to cancel match');
            }
            return data as Match;
          })
        );
      }),
      catchError((error) => {
        console.error('Error cancelling match:', error);
        return throwError(() => error);
      })
    );
  }
}
