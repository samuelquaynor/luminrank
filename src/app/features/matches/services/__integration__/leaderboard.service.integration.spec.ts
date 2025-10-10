import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { LeaderboardService } from '../leaderboard.service';
import { MatchService } from '../match.service';
import { CreateMatchRequest, MatchResult } from '../../models/match.model';

/**
 * Integration tests for Leaderboard Service
 * Tests actual database operations and standings calculations
 */
describe('LeaderboardService Integration Tests', () => {
  let leaderboardService: LeaderboardService;
  let matchService: MatchService;
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
    testUserEmail = `leaderboard-integration-test-${timestamp}@example.com`;
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
      .update({ name: 'Leaderboard Integration Test User' })
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
        LeaderboardService,
        MatchService,
        { provide: SupabaseClient, useValue: supabase }
      ]
    });

    leaderboardService = TestBed.inject(LeaderboardService);
    matchService = TestBed.inject(MatchService);
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

  describe('getLeagueLeaderboard', () => {
    it('should return empty leaderboard for league with no matches', async () => {
      // Create league
      const league = await createTestLeague('Empty Leaderboard Test');

      // Create settings
      await supabase.from('league_settings').insert({
        league_id: league.id,
        scoring_system: 'points',
        points_per_win: 3
      });

      const leaderboard = await firstValueFrom(
        leaderboardService.getLeagueLeaderboard(league.id)
      );

      expect(leaderboard).toBeTruthy();
      expect(leaderboard.league_id).toBe(league.id);
      expect(leaderboard.entries).toEqual([]);
    });

    it('should calculate leaderboard correctly with one match', async () => {
      // Create league
      const league = await createTestLeague('One Match Leaderboard Test');

      // Create opponent
      const user2 = await createOpponent(`leaderboard-one-match-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' }
      ]);

      // Create settings
      await supabase.from('league_settings').insert({
        league_id: league.id,
        scoring_system: 'points',
        points_per_win: 3
      });

      // Record one match
      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      }));

      const leaderboard = await firstValueFrom(
        leaderboardService.getLeagueLeaderboard(league.id)
      );

      expect(leaderboard.entries.length).toBe(2);

      // User should be ranked 1st
      const userEntry = leaderboard.entries.find(e => e.profile_id === testUserId);
      expect(userEntry).toBeTruthy();
      expect(userEntry!.rank).toBe(1);
      expect(userEntry!.wins).toBe(1);
      expect(userEntry!.losses).toBe(0);
      expect(userEntry!.points).toBe(3);
      expect(userEntry!.win_rate).toBe(100);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });

    it('should calculate leaderboard correctly with multiple matches', async () => {
      // Create league
      const league = await createTestLeague('Multiple Matches Leaderboard Test');

      // Create two opponents
      const user2 = await createOpponent(`leaderboard-multi-user2-${Date.now()}@example.com`, 'User 2');
      const user3 = await createOpponent(`leaderboard-multi-user3-${Date.now()}@example.com`, 'User 3');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' },
        { league_id: league.id, user_id: user3.id, role: 'member', status: 'active' }
      ]);

      // Create settings
      await supabase.from('league_settings').insert({
        league_id: league.id,
        scoring_system: 'points',
        points_per_win: 3
      });

      // Record multiple matches
      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      }));

      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 8, result: MatchResult.WIN },
          { profile_id: user3.id, score: 3, result: MatchResult.LOSS }
        ]
      }));

      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: user2.id, score: 7, result: MatchResult.WIN },
          { profile_id: user3.id, score: 4, result: MatchResult.LOSS }
        ]
      }));

      const leaderboard = await firstValueFrom(
        leaderboardService.getLeagueLeaderboard(league.id)
      );

      expect(leaderboard.entries.length).toBe(3);

      // Verify rankings
      const sortedEntries = leaderboard.entries.sort((a, b) => a.rank - b.rank);

      // testUser: 2 wins, 0 losses, 6 points, 100% win rate - Rank 1
      expect(sortedEntries[0].profile_id).toBe(testUserId);
      expect(sortedEntries[0].wins).toBe(2);
      expect(sortedEntries[0].points).toBe(6);

      // user2: 1 win, 1 loss, 3 points, 50% win rate - Rank 2
      expect(sortedEntries[1].profile_id).toBe(user2.id);
      expect(sortedEntries[1].wins).toBe(1);
      expect(sortedEntries[1].points).toBe(3);

      // user3: 0 wins, 2 losses, 0 points, 0% win rate - Rank 3
      expect(sortedEntries[2].profile_id).toBe(user3.id);
      expect(sortedEntries[2].wins).toBe(0);
      expect(sortedEntries[2].points).toBe(0);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
      await supabase.from('profiles').delete().eq('id', user3.id);
    });
  });

  describe('getPlayerStats', () => {
    it('should return player stats for a player with matches', async () => {
      // Create league
      const league = await createTestLeague('Player Stats Test');

      // Create opponent
      const user2 = await createOpponent(`leaderboard-stats-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' }
      ]);

      // Create settings
      await supabase.from('league_settings').insert({
        league_id: league.id,
        scoring_system: 'points',
        points_per_win: 3
      });

      // Record matches
      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      }));

      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 8, result: MatchResult.WIN },
          { profile_id: user2.id, score: 3, result: MatchResult.LOSS }
        ]
      }));

      const stats = await firstValueFrom(
        leaderboardService.getPlayerStats(league.id, testUserId)
      );

      expect(stats).toBeTruthy();
      expect(stats!.profile_id).toBe(testUserId);
      expect(stats!.wins).toBe(2);
      expect(stats!.losses).toBe(0);
      expect(stats!.points).toBe(6);
      expect(stats!.win_rate).toBe(100);
      expect(stats!.rank).toBe(1);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });

    it('should return null for player with no matches', async () => {
      // Create league
      const league = await createTestLeague('No Stats Test');

      // Create a user who hasn't played
      const user4 = await createOpponent(`leaderboard-no-stats-${Date.now()}@example.com`, 'No Stats User');

      const stats = await firstValueFrom(
        leaderboardService.getPlayerStats(league.id, user4.id)
      );

      expect(stats).toBeNull();

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user4.id);
    });
  });

  describe('getTopPlayers', () => {
    it('should return top N players', async () => {
      // Create league
      const league = await createTestLeague('Top Players Test');

      // Create two opponents
      const user2 = await createOpponent(`leaderboard-top-user2-${Date.now()}@example.com`, 'User 2');
      const user3 = await createOpponent(`leaderboard-top-user3-${Date.now()}@example.com`, 'User 3');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' },
        { league_id: league.id, user_id: user3.id, role: 'member', status: 'active' }
      ]);

      // Create settings
      await supabase.from('league_settings').insert({
        league_id: league.id,
        scoring_system: 'points',
        points_per_win: 3
      });

      // Record matches to establish rankings
      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      }));

      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 8, result: MatchResult.WIN },
          { profile_id: user3.id, score: 3, result: MatchResult.LOSS }
        ]
      }));

      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: user2.id, score: 7, result: MatchResult.WIN },
          { profile_id: user3.id, score: 4, result: MatchResult.LOSS }
        ]
      }));

      const topPlayers = await firstValueFrom(
        leaderboardService.getTopPlayers(league.id, 2)
      );

      expect(topPlayers.length).toBe(2);
      expect(topPlayers[0].profile_id).toBe(testUserId);
      expect(topPlayers[1].profile_id).toBe(user2.id);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
      await supabase.from('profiles').delete().eq('id', user3.id);
    });

    it('should return all players if N is greater than player count', async () => {
      // Create league
      const league = await createTestLeague('All Players Test');

      // Create opponent
      const user2 = await createOpponent(`leaderboard-all-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' }
      ]);

      // Create settings
      await supabase.from('league_settings').insert({
        league_id: league.id,
        scoring_system: 'points',
        points_per_win: 3
      });

      // Record a match
      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      }));

      const topPlayers = await firstValueFrom(
        leaderboardService.getTopPlayers(league.id, 10)
      );

      expect(topPlayers.length).toBe(2);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });
  });

  describe('isPlayerInTopN', () => {
    it('should return true for player in top N', async () => {
      // Create league
      const league = await createTestLeague('Top N Test');

      // Create opponent
      const user2 = await createOpponent(`leaderboard-topn-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' }
      ]);

      // Create settings
      await supabase.from('league_settings').insert({
        league_id: league.id,
        scoring_system: 'points',
        points_per_win: 3
      });

      // Record a match
      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user2.id, score: 5, result: MatchResult.LOSS }
        ]
      }));

      const isInTop3 = await firstValueFrom(
        leaderboardService.isPlayerInTopN(league.id, testUserId, 3)
      );

      expect(isInTop3).toBe(true);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
    });

    it('should return false for player not in top N', async () => {
      // Create league
      const league = await createTestLeague('Not Top N Test');

      // Create two opponents
      const user2 = await createOpponent(`leaderboard-nottop-user2-${Date.now()}@example.com`, 'User 2');
      const user3 = await createOpponent(`leaderboard-nottop-user3-${Date.now()}@example.com`, 'User 3');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: user2.id, role: 'member', status: 'active' },
        { league_id: league.id, user_id: user3.id, role: 'member', status: 'active' }
      ]);

      // Create settings
      await supabase.from('league_settings').insert({
        league_id: league.id,
        scoring_system: 'points',
        points_per_win: 3
      });

      // Record matches - user3 loses all
      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: testUserId, score: 10, result: MatchResult.WIN },
          { profile_id: user3.id, score: 5, result: MatchResult.LOSS }
        ]
      }));

      await firstValueFrom(matchService.recordMatch({
        league_id: league.id,
        match_date: new Date().toISOString(),
        participants: [
          { profile_id: user2.id, score: 8, result: MatchResult.WIN },
          { profile_id: user3.id, score: 3, result: MatchResult.LOSS }
        ]
      }));

      const isInTop2 = await firstValueFrom(
        leaderboardService.isPlayerInTopN(league.id, user3.id, 2)
      );

      expect(isInTop2).toBe(false);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', user2.id);
      await supabase.from('profiles').delete().eq('id', user3.id);
    });
  });
});
