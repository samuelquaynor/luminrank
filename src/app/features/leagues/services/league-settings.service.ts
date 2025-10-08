import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseClient } from '@supabase/supabase-js';
import { LeagueSettings } from '../models/league.model';

@Injectable({
  providedIn: 'root'
})
export class LeagueSettingsService {
  private supabase = inject(SupabaseClient);

  /**
   * Get league settings
   */
  getSettings(leagueId: string): Observable<LeagueSettings> {
    return from(
      this.supabase
        .from('league_settings')
        .select('*')
        .eq('league_id', leagueId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapSettingsFromDb(data);
      }),
      catchError(error => {
        console.error('Get settings error:', error);
        return throwError(() => new Error(error.message || 'Failed to fetch settings'));
      })
    );
  }

  /**
   * Update league settings (creator/admin only)
   */
  updateSettings(leagueId: string, settings: Partial<LeagueSettings>): Observable<LeagueSettings> {
    const updateData: any = {};
    if (settings.scoringSystem !== undefined) updateData.scoring_system = settings.scoringSystem;
    if (settings.pointsPerWin !== undefined) updateData.points_per_win = settings.pointsPerWin;
    if (settings.pointsPerDraw !== undefined) updateData.points_per_draw = settings.pointsPerDraw;
    if (settings.pointsPerLoss !== undefined) updateData.points_per_loss = settings.pointsPerLoss;
    if (settings.allowDraws !== undefined) updateData.allow_draws = settings.allowDraws;
    updateData.updated_at = new Date().toISOString();

    return from(
      this.supabase
        .from('league_settings')
        .update(updateData)
        .eq('league_id', leagueId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapSettingsFromDb(data);
      }),
      catchError(error => {
        console.error('Update settings error:', error);
        return throwError(() => new Error(error.message || 'Failed to update settings'));
      })
    );
  }

  /**
   * Map database settings to domain model
   */
  private mapSettingsFromDb(data: any): LeagueSettings {
    return {
      id: data.id,
      leagueId: data.league_id,
      scoringSystem: data.scoring_system,
      pointsPerWin: data.points_per_win,
      pointsPerDraw: data.points_per_draw,
      pointsPerLoss: data.points_per_loss,
      allowDraws: data.allow_draws,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
