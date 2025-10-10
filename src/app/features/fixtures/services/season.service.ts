import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  Season, 
  CreateSeasonRequest, 
  UpdateSeasonRequest, 
  SeasonStatus 
} from '../models/season.model';

@Injectable({
  providedIn: 'root'
})
export class SeasonService {
  private supabase = inject(SupabaseClient);

  /**
   * Create a new season
   */
  async createSeason(request: CreateSeasonRequest): Promise<Season> {
    const { data, error } = await this.supabase
      .from('seasons')
      .insert({
        league_id: request.league_id,
        name: request.name,
        description: request.description ?? null,
        season_number: request.season_number,
        start_date: request.start_date,
        end_date: request.end_date ?? null,
        status: request.status ?? SeasonStatus.UPCOMING
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create season: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all seasons for a league (ordered by season_number DESC)
   */
  async getLeagueSeasons(leagueId: string): Promise<Season[]> {
    const { data, error } = await this.supabase
      .from('seasons')
      .select('*')
      .eq('league_id', leagueId)
      .order('season_number', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch league seasons: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get the active season for a league
   */
  async getActiveSeason(leagueId: string): Promise<Season | null> {
    const { data, error } = await this.supabase
      .from('seasons')
      .select('*')
      .eq('league_id', leagueId)
      .eq('status', SeasonStatus.ACTIVE)
      .single();

    if (error) {
      // If no active season, return null (not an error)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch active season: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a season by ID
   */
  async getSeasonById(seasonId: string): Promise<Season | null> {
    const { data, error } = await this.supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single();

    if (error) {
      // If not found, return null (not an error)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch season: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a season
   */
  async updateSeason(seasonId: string, request: UpdateSeasonRequest): Promise<Season> {
    const { data, error } = await this.supabase
      .from('seasons')
      .update({
        ...(request.name !== undefined && { name: request.name }),
        ...(request.description !== undefined && { description: request.description }),
        ...(request.start_date !== undefined && { start_date: request.start_date }),
        ...(request.end_date !== undefined && { end_date: request.end_date }),
        ...(request.status !== undefined && { status: request.status })
      })
      .eq('id', seasonId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update season: ${error.message}`);
    }

    return data;
  }

  /**
   * End a season (set status to completed and end_date)
   */
  async endSeason(seasonId: string, endDate: string): Promise<Season> {
    return this.updateSeason(seasonId, {
      status: SeasonStatus.COMPLETED,
      end_date: endDate
    });
  }

  /**
   * Delete a season
   */
  async deleteSeason(seasonId: string): Promise<void> {
    const { error } = await this.supabase
      .from('seasons')
      .delete()
      .eq('id', seasonId);

    if (error) {
      throw new Error(`Failed to delete season: ${error.message}`);
    }
  }

  /**
   * Get upcoming seasons for a league
   */
  async getUpcomingSeasons(leagueId: string): Promise<Season[]> {
    const { data, error } = await this.supabase
      .from('seasons')
      .select('*')
      .eq('league_id', leagueId)
      .eq('status', SeasonStatus.UPCOMING)
      .order('start_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch upcoming seasons: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get completed seasons for a league
   */
  async getCompletedSeasons(leagueId: string): Promise<Season[]> {
    const { data, error } = await this.supabase
      .from('seasons')
      .select('*')
      .eq('league_id', leagueId)
      .eq('status', SeasonStatus.COMPLETED)
      .order('end_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch completed seasons: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Observable methods for RxJS integration
   */

  createSeason$(request: CreateSeasonRequest): Observable<Season> {
    return from(this.createSeason(request)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getLeagueSeasons$(leagueId: string): Observable<Season[]> {
    return from(this.getLeagueSeasons(leagueId)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getActiveSeason$(leagueId: string): Observable<Season | null> {
    return from(this.getActiveSeason(leagueId)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getSeasonById$(seasonId: string): Observable<Season | null> {
    return from(this.getSeasonById(seasonId)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  updateSeason$(seasonId: string, request: UpdateSeasonRequest): Observable<Season> {
    return from(this.updateSeason(seasonId, request)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  endSeason$(seasonId: string, endDate: string): Observable<Season> {
    return from(this.endSeason(seasonId, endDate)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  deleteSeason$(seasonId: string): Observable<void> {
    return from(this.deleteSeason(seasonId)).pipe(
      catchError(err => throwError(() => err))
    );
  }
}

