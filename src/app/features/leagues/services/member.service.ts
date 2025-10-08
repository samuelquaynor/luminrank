import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { LeagueMember, MemberRole } from '../models/league.model';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private supabase = inject(SupabaseClient);

  /**
   * Get all members of a league
   */
  getLeagueMembers(leagueId: string): Observable<LeagueMember[]> {
    return from(
      this.supabase
        .from('league_members')
        .select(`
          *,
          profiles(name, email)
        `)
        .eq('league_id', leagueId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(member => this.mapMemberFromDb(member));
      }),
      catchError(error => {
        console.error('Get league members error:', error);
        return throwError(() => new Error(error.message || 'Failed to fetch members'));
      })
    );
  }

  /**
   * Add a member to a league (admin only)
   */
  addMember(leagueId: string, userId: string): Observable<LeagueMember> {
    return from(
      this.supabase
        .from('league_members')
        .insert({
          league_id: leagueId,
          user_id: userId,
          role: 'member'
        })
        .select(`
          *,
          profiles(name, email)
        `)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapMemberFromDb(data);
      }),
      catchError(error => {
        console.error('Add member error:', error);
        return throwError(() => new Error(error.message || 'Failed to add member'));
      })
    );
  }

  /**
   * Remove a member from a league (admin only)
   */
  removeMember(leagueId: string, userId: string): Observable<void> {
    return from(
      this.supabase
        .from('league_members')
        .update({ status: 'removed' })
        .eq('league_id', leagueId)
        .eq('user_id', userId)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(error => {
        console.error('Remove member error:', error);
        return throwError(() => new Error(error.message || 'Failed to remove member'));
      })
    );
  }

  /**
   * Update a member's role (creator only)
   */
  updateMemberRole(leagueId: string, userId: string, role: MemberRole): Observable<LeagueMember> {
    return from(
      this.supabase
        .from('league_members')
        .update({ role })
        .eq('league_id', leagueId)
        .eq('user_id', userId)
        .select(`
          *,
          profiles(name, email)
        `)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapMemberFromDb(data);
      }),
      catchError(error => {
        console.error('Update member role error:', error);
        return throwError(() => new Error(error.message || 'Failed to update member role'));
      })
    );
  }

  /**
   * Check if a user is a member of a league
   */
  isMember(leagueId: string, userId: string): Observable<boolean> {
    return from(
      this.supabase
        .from('league_members')
        .select('id')
        .eq('league_id', leagueId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error && error.code === 'PGRST116') {
          // No rows returned
          return false;
        }
        if (error) throw error;
        return !!data;
      }),
      catchError(error => {
        console.error('Check membership error:', error);
        return throwError(() => new Error(error.message || 'Failed to check membership'));
      })
    );
  }

  /**
   * Get a user's role in a league
   */
  getUserRole(leagueId: string, userId: string): Observable<MemberRole | null> {
    return from(
      this.supabase
        .from('league_members')
        .select('role')
        .eq('league_id', leagueId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error && error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        if (error) throw error;
        return data.role as MemberRole;
      }),
      catchError(error => {
        console.error('Get user role error:', error);
        return throwError(() => new Error(error.message || 'Failed to get user role'));
      })
    );
  }

  /**
   * Map database member to domain model
   */
  private mapMemberFromDb(data: any): LeagueMember {
    return {
      id: data.id,
      leagueId: data.league_id,
      userId: data.user_id,
      joinedAt: new Date(data.joined_at),
      status: data.status,
      role: data.role,
      createdAt: new Date(data.created_at),
      userName: data.profiles?.name,
      userEmail: data.profiles?.email,
      userAvatar: undefined // avatar_url not yet implemented in profiles table
    };
  }
}
