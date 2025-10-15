import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { 
  Dispute, 
  DisputeWithDetails, 
  CreateDisputeRequest, 
  ResolveDisputeRequest 
} from '../models/dispute.model';

@Injectable({
  providedIn: 'root'
})
export class DisputeService {
  private supabase = inject(SupabaseClient);

  /**
   * Create a new dispute for a match
   */
  createDispute(request: CreateDisputeRequest): Observable<string> {
    return from(
      this.supabase.auth.getUser()
    ).pipe(
      switchMap(({ data: { user }, error: authError }) => {
        if (authError || !user) {
          throw new Error('Not authenticated');
        }

        return from(
          this.supabase.rpc('create_match_dispute', {
            p_match_id: request.match_id,
            p_disputed_by: user.id,
            p_reason: request.reason,
            p_proposed_scores: request.proposed_scores || null
          })
        );
      }),
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data as string;
      }),
      catchError((error) => {
        console.error('Error creating dispute:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Resolve a dispute
   */
  resolveDispute(request: ResolveDisputeRequest): Observable<boolean> {
    return from(
      this.supabase.auth.getUser()
    ).pipe(
      switchMap(({ data: { user }, error: authError }) => {
        if (authError || !user) {
          throw new Error('Not authenticated');
        }

        return from(
          this.supabase.rpc('resolve_match_dispute', {
            p_dispute_id: request.dispute_id,
            p_resolved_by: user.id,
            p_resolution: request.resolution,
            p_resolution_notes: request.resolution_notes || null,
            p_new_scores: request.new_scores || null
          })
        );
      }),
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data as boolean;
      }),
      catchError((error) => {
        console.error('Error resolving dispute:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Withdraw a dispute (only by the person who created it)
   */
  withdrawDispute(disputeId: string): Observable<boolean> {
    return from(
      this.supabase.auth.getUser()
    ).pipe(
      switchMap(({ data: { user }, error: authError }) => {
        if (authError || !user) {
          throw new Error('Not authenticated');
        }

        return from(
          this.supabase.rpc('withdraw_match_dispute', {
            p_dispute_id: disputeId,
            p_user_id: user.id
          })
        );
      }),
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data as boolean;
      }),
      catchError((error) => {
        console.error('Error withdrawing dispute:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get disputes for a specific match
   */
  getMatchDisputes(matchId: string): Observable<DisputeWithDetails[]> {
    return from(
      this.supabase
        .from('match_disputes')
        .select(`
          *,
          disputed_by_profile:profiles!match_disputes_disputed_by_fkey(id, name),
          resolved_by_profile:profiles!match_disputes_resolved_by_fkey(id, name)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        return (data || []).map((dispute: any) => ({
          ...dispute,
          disputed_by_name: dispute.disputed_by_profile?.name,
          resolved_by_name: dispute.resolved_by_profile?.name
        }));
      }),
      catchError((error) => {
        console.error('Error fetching match disputes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all open disputes for a league
   */
  getLeagueDisputes(leagueId: string): Observable<DisputeWithDetails[]> {
    return from(
      this.supabase
        .from('match_disputes')
        .select(`
          *,
          disputed_by_profile:profiles!match_disputes_disputed_by_fkey(id, name),
          resolved_by_profile:profiles!match_disputes_resolved_by_fkey(id, name),
          match:matches!inner(
            id,
            match_date,
            league_id,
            match_participants(
              profile_id,
              score,
              result,
              profile:profiles(id, name)
            )
          )
        `)
        .eq('match.league_id', leagueId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        return (data || []).map((dispute: any) => ({
          ...dispute,
          disputed_by_name: dispute.disputed_by_profile?.name,
          resolved_by_name: dispute.resolved_by_profile?.name,
          match_details: dispute.match ? {
            match_date: dispute.match.match_date,
            participants: (dispute.match.match_participants || []).map((p: any) => ({
              profile_id: p.profile_id,
              display_name: p.profile?.name || 'Unknown',
              score: p.score,
              result: p.result
            }))
          } : undefined
        }));
      }),
      catchError((error) => {
        console.error('Error fetching league disputes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single dispute by ID
   */
  getDisputeById(disputeId: string): Observable<DisputeWithDetails> {
    return from(
      this.supabase
        .from('match_disputes')
        .select(`
          *,
          disputed_by_profile:profiles!match_disputes_disputed_by_fkey(id, name),
          resolved_by_profile:profiles!match_disputes_resolved_by_fkey(id, name),
          match:matches(
            id,
            match_date,
            match_participants(
              profile_id,
              score,
              result,
              profile:profiles(id, name)
            )
          )
        `)
        .eq('id', disputeId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        return {
          ...data,
          disputed_by_name: data.disputed_by_profile?.name,
          resolved_by_name: data.resolved_by_profile?.name,
          match_details: data.match ? {
            match_date: data.match.match_date,
            participants: (data.match.match_participants || []).map((p: any) => ({
              profile_id: p.profile_id,
              display_name: p.profile?.name || 'Unknown',
              score: p.score,
              result: p.result
            }))
          } : undefined
        } as DisputeWithDetails;
      }),
      catchError((error) => {
        console.error('Error fetching dispute:', error);
        return throwError(() => error);
      })
    );
  }
}

