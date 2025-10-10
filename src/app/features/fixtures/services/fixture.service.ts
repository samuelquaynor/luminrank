import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { from, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  Fixture, 
  FixtureWithDetails,
  CreateFixtureRequest,
  GenerateFixturesRequest,
  FixtureGenerationResult,
  FixtureStatus
} from '../models/fixture.model';

@Injectable({
  providedIn: 'root'
})
export class FixtureService {
  private supabase = inject(SupabaseClient);

  /**
   * Generate round-robin fixtures for a league
   * 
   * Algorithm:
   * - For N players, generates N-1 rounds (or 2(N-1) for return fixtures)
   * - Each player plays every other player once (or twice with return)
   * - Uses rotating algorithm to ensure balanced scheduling
   */
  async generateRoundRobinFixtures(request: GenerateFixturesRequest): Promise<FixtureGenerationResult> {
    // Get active league members
    const { data: members, error: membersError } = await this.supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', request.league_id)
      .eq('status', 'active');

    if (membersError) {
      throw new Error(`Failed to fetch league members: ${membersError.message}`);
    }

    if (!members || members.length < 2) {
      throw new Error('Round-robin requires at least 2 active players');
    }

    const playerIds = members.map(m => m.user_id);
    const fixtures: Fixture[] = [];

    // Generate pairings using round-robin algorithm
    const pairings = this.generateRoundRobinPairings(playerIds);

    // Calculate number of rounds
    const singleRounds = pairings.length;
    const totalRounds = request.include_return_fixtures ? singleRounds * 2 : singleRounds;

    let roundNumber = 1;

    // First round-robin (home fixtures)
    for (const roundPairings of pairings) {
      const scheduledDate = this.calculateScheduledDate(
        request.start_date,
        roundNumber - 1,
        request.match_frequency_days
      );

      const submissionDeadline = this.calculateSubmissionDeadline(
        scheduledDate,
        request.submission_window_hours
      );

      for (const [homeId, awayId] of roundPairings) {
        const fixtureData = {
          league_id: request.league_id,
          ...(request.season_id && { season_id: request.season_id }),
          home_player_id: homeId,
          away_player_id: awayId,
          round_number: roundNumber,
          scheduled_date: scheduledDate,
          submission_deadline: submissionDeadline,
          status: FixtureStatus.SCHEDULED
        };

        const { data: fixture, error } = await this.supabase
          .from('fixtures')
          .insert(fixtureData)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create fixture: ${error.message}`);
        }

        fixtures.push(fixture);
      }

      roundNumber++;
    }

    // Second round-robin (away fixtures - reverse home/away)
    if (request.include_return_fixtures) {
      for (const roundPairings of pairings) {
        const scheduledDate = this.calculateScheduledDate(
          request.start_date,
          roundNumber - 1,
          request.match_frequency_days
        );

        const submissionDeadline = this.calculateSubmissionDeadline(
          scheduledDate,
          request.submission_window_hours
        );

        for (const [homeId, awayId] of roundPairings) {
          // Reverse home and away
          const fixtureData = {
            league_id: request.league_id,
            ...(request.season_id && { season_id: request.season_id }),
            home_player_id: awayId,
            away_player_id: homeId,
            round_number: roundNumber,
            scheduled_date: scheduledDate,
            submission_deadline: submissionDeadline,
            status: FixtureStatus.SCHEDULED
          };

          const { data: fixture, error } = await this.supabase
            .from('fixtures')
            .insert(fixtureData)
            .select()
            .single();

          if (error) {
            throw new Error(`Failed to create fixture: ${error.message}`);
          }

          fixtures.push(fixture);
        }

        roundNumber++;
      }
    }

    return {
      fixtures,
      total_rounds: totalRounds,
      total_fixtures: fixtures.length
    };
  }

  /**
   * Round-robin pairing algorithm
   * For N players, generates N-1 rounds
   * Returns array of rounds, each containing pairs of player IDs
   */
  private generateRoundRobinPairings(playerIds: string[]): [string, string][][] {
    const players = [...playerIds];
    const n = players.length;

    // If odd number of players, add a "bye" (null)
    if (n % 2 !== 0) {
      players.push('BYE');
    }

    const numPlayers = players.length;
    const numRounds = numPlayers - 1;
    const rounds: [string, string][][] = [];

    for (let round = 0; round < numRounds; round++) {
      const roundPairings: [string, string][] = [];

      for (let i = 0; i < numPlayers / 2; i++) {
        const home = players[i];
        const away = players[numPlayers - 1 - i];

        // Skip if either player is "BYE"
        if (home !== 'BYE' && away !== 'BYE') {
          roundPairings.push([home, away]);
        }
      }

      rounds.push(roundPairings);

      // Rotate players (keep first player fixed, rotate others)
      const fixed = players[0];
      const rotated = players.slice(1);
      rotated.push(rotated.shift()!);
      players.splice(0, players.length, fixed, ...rotated);
    }

    return rounds;
  }

  /**
   * Calculate scheduled date for a round
   */
  private calculateScheduledDate(
    startDate: string,
    roundOffset: number,
    frequencyDays: number
  ): string {
    const date = new Date(startDate);
    date.setDate(date.getDate() + roundOffset * frequencyDays);
    return date.toISOString();
  }

  /**
   * Calculate submission deadline
   */
  private calculateSubmissionDeadline(
    scheduledDate: string,
    windowHours: number
  ): string {
    const date = new Date(scheduledDate);
    date.setHours(date.getHours() + windowHours);
    return date.toISOString();
  }

  /**
   * Get all fixtures for a league
   */
  async getLeagueFixtures(leagueId: string, seasonId?: string): Promise<FixtureWithDetails[]> {
    let query = this.supabase
      .from('fixtures')
      .select(`
        *,
        home_player:profiles!fixtures_home_player_id_fkey(name),
        away_player:profiles!fixtures_away_player_id_fkey(name)
      `)
      .eq('league_id', leagueId)
      .order('round_number', { ascending: true })
      .order('scheduled_date', { ascending: true });

    if (seasonId) {
      query = query.eq('season_id', seasonId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch fixtures: ${error.message}`);
    }

    return (data || []).map(fixture => ({
      ...fixture,
      home_player_name: fixture.home_player.name,
      away_player_name: fixture.away_player.name
    }));
  }

  /**
   * Get a single fixture by ID
   */
  async getFixtureById(fixtureId: string): Promise<FixtureWithDetails | null> {
    const { data, error } = await this.supabase
      .from('fixtures')
      .select(`
        *,
        home_player:profiles!fixtures_home_player_id_fkey(name),
        away_player:profiles!fixtures_away_player_id_fkey(name)
      `)
      .eq('id', fixtureId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch fixture: ${error.message}`);
    }

    return {
      ...data,
      home_player_name: data.home_player.name,
      away_player_name: data.away_player.name
    };
  }

  /**
   * Update fixture status
   */
  async updateFixtureStatus(fixtureId: string, status: FixtureStatus): Promise<Fixture> {
    const { data, error } = await this.supabase
      .from('fixtures')
      .update({ status })
      .eq('id', fixtureId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update fixture status: ${error.message}`);
    }

    return data;
  }

  /**
   * Link a match to a fixture
   */
  async linkMatchToFixture(
    fixtureId: string,
    matchId: string,
    winnerId: string
  ): Promise<Fixture> {
    const { data, error } = await this.supabase
      .from('fixtures')
      .update({
        match_id: matchId,
        winner_id: winnerId,
        status: FixtureStatus.COMPLETED
      })
      .eq('id', fixtureId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to link match to fixture: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark overdue fixtures (wrapper for database function)
   */
  async markOverdueFixtures(): Promise<number> {
    const { data, error } = await this.supabase.rpc('mark_overdue_fixtures');

    if (error) {
      throw new Error(`Failed to mark overdue fixtures: ${error.message}`);
    }

    return data || 0;
  }

  /**
   * Get fixtures for a specific player
   */
  async getPlayerFixtures(
    profileId: string,
    leagueId: string,
    seasonId?: string
  ): Promise<FixtureWithDetails[]> {
    const { data, error } = await this.supabase.rpc('get_player_fixtures', {
      p_profile_id: profileId,
      p_league_id: leagueId,
      p_season_id: seasonId || null
    });

    if (error) {
      throw new Error(`Failed to fetch player fixtures: ${error.message}`);
    }

    return (data || []).map((fixture: any) => ({
      id: fixture.id,
      league_id: fixture.league_id,
      season_id: fixture.season_id,
      home_player_id: fixture.home_player_id,
      away_player_id: fixture.away_player_id,
      home_player_name: fixture.home_player_name,
      away_player_name: fixture.away_player_name,
      round_number: fixture.round_number,
      scheduled_date: fixture.scheduled_date,
      submission_deadline: fixture.submission_deadline,
      status: fixture.status,
      match_id: fixture.match_id,
      winner_id: fixture.winner_id,
      created_at: '',
      updated_at: ''
    }));
  }

  /**
   * Delete all fixtures for a season
   */
  async deleteSeasonFixtures(seasonId: string): Promise<void> {
    const { error } = await this.supabase
      .from('fixtures')
      .delete()
      .eq('season_id', seasonId);

    if (error) {
      throw new Error(`Failed to delete season fixtures: ${error.message}`);
    }
  }

  /**
   * Observable methods for RxJS integration
   */

  generateRoundRobinFixtures$(request: GenerateFixturesRequest): Observable<FixtureGenerationResult> {
    return from(this.generateRoundRobinFixtures(request)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getLeagueFixtures$(leagueId: string, seasonId?: string): Observable<FixtureWithDetails[]> {
    return from(this.getLeagueFixtures(leagueId, seasonId)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getFixtureById$(fixtureId: string): Observable<FixtureWithDetails | null> {
    return from(this.getFixtureById(fixtureId)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getPlayerFixtures$(profileId: string, leagueId: string, seasonId?: string): Observable<FixtureWithDetails[]> {
    return from(this.getPlayerFixtures(profileId, leagueId, seasonId)).pipe(
      catchError(err => throwError(() => err))
    );
  }

  markOverdueFixtures$(): Observable<number> {
    return from(this.markOverdueFixtures()).pipe(
      catchError(err => throwError(() => err))
    );
  }
}

