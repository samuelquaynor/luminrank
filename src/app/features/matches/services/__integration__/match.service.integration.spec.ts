import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { MatchService } from '../match.service';
import { CreateMatchRequest, MatchStatus, MatchResult } from '../../models/match.model';

/**
 * Integration tests for Match Service
 * Tests actual database operations with Supabase
 */
describe('MatchService Integration Tests', () => {
  let service: MatchService;
  let supabase: SupabaseClient;
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;

  // Helper function to create a league with error handling
  async function createTestLeague(name: string) {
    const { data: league, error } = await supabase
      .from('leagues')
      .insert({
        name,
        created_by: testUserId,
        game_type: 'Chess',
        status: 'active'
      })
      .select()
      .single();

    if (error || !league) {
      throw new Error(`Failed to create league: ${error?.message}`);
    }

    return league;
  }

  // Helper function to create a user and sign back in as test user
  async function createOpponent(email: string, name: string) {
    const { data: { user } } = await supabase.auth.signUp({
      email,
      password: 'TestPassword123!'
    });
    await supabase.from('profiles').update({ name }).eq('id', user!.id);

    // Sign back in as main test user (signUp auto-signs in the new user)
    await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword
    });

    return user!;
  }

  beforeAll(async () => {
    // Create Supabase client
    supabase = createClient(
      'http://127.0.0.1:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );

    // Create a test user
    const timestamp = Date.now();
    testUserEmail = `match-integration-test-${timestamp}@example.com`;
    testUserPassword = 'TestPassword123!';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUserEmail,
      password: testUserPassword
    });

    if (authError || !authData.user) {
      throw new Error('Failed to create test user: ' + authError?.message);
    }

    testUserId = authData.user.id;

    // Update profile with a name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: 'Match Integration Test User' })
      .eq('id', testUserId);

    if (profileError) {
      throw new Error('Failed to update profile: ' + profileError.message);
    }

    // Sign in to get a valid session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword
    });

    if (signInError) {
      throw new Error('Failed to sign in: ' + signInError.message);
    }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MatchService,
        { provide: SupabaseClient, useValue: supabase }
      ]
    });

    service = TestBed.inject(MatchService);
  });

  afterAll(async () => {
    // Cleanup: Delete test user and related data
    if (testUserId) {
      // Delete leagues created by test user (cascades to matches, members, settings)
      await supabase
        .from('leagues')
        .delete()
        .eq('created_by', testUserId);

      // Sign out
      await supabase.auth.signOut();
    }
  });

  describe('recordMatch', () => {
    it('should record a match with 2 participants', async () => {
      // Create a test league
      const league = await createTestLeague('Record Match Test League');

      // Create a second user for the match
      const user2 = await createOpponent(`match-opponent-${Date.now()}@example.com`, 'Opponent');

      // Add both as league members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' }
      ]);

      // Create league settings
      await supabase.from('league_settings').insert({
        league_id: league.id,
        scoring_system: 'points',
        points_per_win: 3
      });

      const request: CreateMatchRequest = {
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      };

      const match = await firstValueFrom(service.recordMatch(request));

      expect(match).toBeTruthy();
      expect(match.id).toBeTruthy();
      expect(match.league_id).toBe(league.id);
      expect(match.status).toBe(MatchStatus.COMPLETED);
      expect(match.participants.length).toBe(2);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });

    it('should fail to record match with only 1 participant', async () => {
      const league = await createTestLeague('Single Participant Test');

      const request: CreateMatchRequest = {
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN }
        ]
      };

      try {
        await firstValueFrom(service.recordMatch(request));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('exactly 2 participants');
      }
    });

    it('should fail to record match with same result for both players', async () => {
      const league = await createTestLeague('Same Result Test');

      const user2 = await createOpponent(`match-same-result-${Date.now()}@example.com`, 'Opponent');

      const request: CreateMatchRequest = {
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 10, result: MatchResult.WIN }
        ]
      };

      try {
        await firstValueFrom(service.recordMatch(request));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('one winner and one loser');
      }

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });

    it('should fail to record match without a winner', async () => {
      const league = await createTestLeague('No Winner Test');

      const user2 = await createOpponent(`match-no-winner-${Date.now()}@example.com`, 'Opponent');

      const request: CreateMatchRequest = {
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.LOSS },
          { profile_id: user2.id, score: 10, result: MatchResult.LOSS }
        ]
      };

      try {
        await firstValueFrom(service.recordMatch(request));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('one winner and one loser');
      }

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });
  });

  describe('getLeagueMatches', () => {
    it('should retrieve all matches for a league', async () => {
      // Create league
      const league = await createTestLeague('Get Matches Test League');

      // Create opponent
      const user2 = await createOpponent(`match-get-matches-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' }
      ]);

      // Record a match
      const request: CreateMatchRequest = {
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      };
      await firstValueFrom(service.recordMatch(request));

      // Get matches
      const matches = await firstValueFrom(service.getLeagueMatches(league.id));

      expect(matches).toBeTruthy();
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].league_id).toBe(league.id);
      expect(matches[0].participants.length).toBe(2);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });

    it('should return empty array for league with no matches', async () => {
      const emptyLeague = await createTestLeague('Empty League');

      const matches = await firstValueFrom(service.getLeagueMatches(emptyLeague.id));

      expect(matches).toEqual([]);
    });
  });

  describe('getMatchById', () => {
    it('should retrieve a match by ID', async () => {
      // Create league
      const league = await createTestLeague('Get Match By ID Test');

      // Create opponent
      const user2 = await createOpponent(`match-get-by-id-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' }
      ]);

      // Record a match
      const request: CreateMatchRequest = {
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      };
      const createdMatch = await firstValueFrom(service.recordMatch(request));

      // Get match by ID
      const match = await firstValueFrom(service.getMatchById(createdMatch.id));

      expect(match).toBeTruthy();
      expect(match.id).toBe(createdMatch.id);
      expect(match.participants.length).toBe(2);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });

    it('should fail to retrieve non-existent match', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      try {
        await firstValueFrom(service.getMatchById(fakeId));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBeTruthy();
      }
    });
  });

  describe('getPlayerMatches', () => {
    it('should retrieve all matches for a player', async () => {
      // Create league
      const league = await createTestLeague('Player Matches Test');

      // Create opponent
      const user2 = await createOpponent(`match-player-matches-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' }
      ]);

      // Record multiple matches
      await firstValueFrom(service.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      }));

      await firstValueFrom(service.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: user2.id, score: 8, result: MatchResult.WIN },
          { profile_id: testUserId, score: 3, result: MatchResult.LOSS }
        ]
      }));

      // Get player matches
      const matches = await firstValueFrom(
        service.getPlayerMatches(league.id, testUserId)
      );

      expect(matches).toBeTruthy();
      expect(matches.length).toBe(2);

      // Verify all matches include the player
      matches.forEach(match => {
        const hasPlayer = match.participants.some(p => p.profile_id === testUserId);
        expect(hasPlayer).toBe(true);
      });

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });

    it('should return empty array for player with no matches', async () => {
      // Create league
      const league = await createTestLeague('No Matches Test');

      // Create a user who hasn't played
      const user3 = await createOpponent(`match-no-matches-${Date.now()}@example.com`, 'No Matches User');

      const matches = await firstValueFrom(
        service.getPlayerMatches(league.id, user3.id)
      );

      expect(matches).toEqual([]);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user3.id);
    });
  });

  describe('cancelMatch', () => {
    it('should cancel a match by the recorder', async () => {
      // Create league
      const league = await createTestLeague('Cancel Match Test');

      // Create opponent
      const user2 = await createOpponent(`match-cancel-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' }
      ]);

      // Record a match
      const request: CreateMatchRequest = {
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      };
      const match = await firstValueFrom(service.recordMatch(request));

      // Cancel the match
      const cancelledMatch = await firstValueFrom(service.cancelMatch(match.id));

      expect(cancelledMatch).toBeTruthy();
      expect(cancelledMatch.id).toBe(match.id);
      expect(cancelledMatch.status).toBe(MatchStatus.CANCELLED);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });
  });
});
