import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LeagueService } from '../league.service';
import { CreateLeagueData, LeagueStatus } from '../../models/league.model';
import { firstValueFrom } from 'rxjs';

/**
 * Integration tests for Match Generation Functions
 * Tests the validate_league_start and generate_matches_for_league database functions
 * Run with: npm test -- --include='**\/*.integration.spec.ts'
 */
describe('Match Generation Integration Tests', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
    // Create Supabase client for test setup
    supabase = createClient(
      'http://127.0.0.1:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );

    // Create a test user
    const timestamp = Date.now();
    testUserEmail = `match-gen-test-${timestamp}@example.com`;
    testUserPassword = 'TestPassword123!';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (authError || !authData.user) {
      throw new Error('Failed to create test user: ' + authError?.message);
    }

    testUserId = authData.user.id;

    // Update profile with a name
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: 'Match Gen Test User' })
      .eq('id', testUserId);

    if (profileError) {
      throw new Error('Failed to update profile: ' + profileError.message);
    }

    // Sign in to get a valid session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (signInError) {
      throw new Error('Failed to sign in: ' + signInError.message);
    }
  });

  afterAll(async () => {
    // Cleanup: Delete test leagues (matches will cascade delete)
    if (testUserId) {
      await supabase.from('leagues').delete().eq('created_by', testUserId);

      await supabase.auth.signOut();
    }
  });

  // Helper function to create a test league
  async function createTestLeague(name: string) {
    const leagueData: CreateLeagueData = {
      name,
      description: 'Test league for match generation',
      gameType: 'Chess',
      isPrivate: false,
      settings: {
        matchFrequencyDays: 7,
        includeReturnFixtures: false,
        submissionWindowHours: 168,
      },
    };

    const service = TestBed.inject(LeagueService);
    return await firstValueFrom(service.createLeague(leagueData));
  }

  // Helper function to create an opponent
  async function createOpponent(email: string, name: string) {
    const {
      data: { user },
    } = await supabase.auth.signUp({
      email,
      password: 'TestPassword123!',
    });

    if (!user) {
      throw new Error('Failed to create opponent user');
    }

    await supabase.from('profiles').update({ name }).eq('id', user.id);

    // Sign back in as test user
    await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    return user;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        LeagueService,
        { provide: SupabaseClient, useValue: supabase },
      ],
    });
  });

  describe('validate_league_start', () => {
    it('should validate a league can be started', async () => {
      const league = await createTestLeague('Validation Test League');

      // Add one member (we need at least 2)
      const opponent = await createOpponent(`opponent-${Date.now()}@test.com`, 'Opponent User');

      // Join the league
      const { data: joinData, error: joinError } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: opponent.id,
          role: 'member',
          status: 'active',
        })
        .select()
        .single();

      expect(joinError).toBeNull();
      expect(joinData).toBeDefined();

      // Validate league can be started
      const { data: validation, error } = await supabase.rpc('validate_league_start', {
        p_league_id: league.id,
      });

      expect(error).toBeNull();
      expect(validation).toBeDefined();
      expect(validation.length).toBe(1);
      expect(validation[0].valid).toBe(true);
      expect(validation[0].message).toBe('League can be started');
    });

    it('should reject league with less than 2 members', async () => {
      const league = await createTestLeague('Single Member League');

      // Validate league (should fail - only creator is member)
      const { data: validation, error } = await supabase.rpc('validate_league_start', {
        p_league_id: league.id,
      });

      expect(error).toBeNull();
      expect(validation).toBeDefined();
      expect(validation.length).toBe(1);
      expect(validation[0].valid).toBe(false);
      expect(validation[0].message).toContain('at least 2 active members');
    });

    it('should reject league that is not in draft status', async () => {
      const league = await createTestLeague('Active League');

      // Add a member
      const opponent = await createOpponent(`opponent-${Date.now()}@test.com`, 'Opponent User');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active',
      });

      // Update league status to active
      await supabase.from('leagues').update({ status: 'active' }).eq('id', league.id);

      // Validate league (should fail - not in draft)
      const { data: validation, error } = await supabase.rpc('validate_league_start', {
        p_league_id: league.id,
      });

      expect(error).toBeNull();
      expect(validation).toBeDefined();
      expect(validation.length).toBe(1);
      expect(validation[0].valid).toBe(false);
      expect(validation[0].message).toContain('draft status');
    });

    it('should reject league that already has matches', async () => {
      const league = await createTestLeague('League With Matches');

      // Add a member
      const opponent = await createOpponent(`opponent-${Date.now()}@test.com`, 'Opponent User');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active',
      });

      // Generate matches first
      const startDate = new Date();
      const { error: genError } = await supabase.rpc('generate_matches_for_league', {
        p_league_id: league.id,
        p_start_date: startDate.toISOString(),
      });

      expect(genError).toBeNull();

      // Reset league status to draft (for testing)
      await supabase.from('leagues').update({ status: 'draft' }).eq('id', league.id);

      // Validate league (should fail - matches already exist)
      const { data: validation, error } = await supabase.rpc('validate_league_start', {
        p_league_id: league.id,
      });

      expect(error).toBeNull();
      expect(validation).toBeDefined();
      expect(validation.length).toBe(1);
      expect(validation[0].valid).toBe(false);
      expect(validation[0].message).toContain('already been generated');
    });
  });

  describe('generate_matches_for_league', () => {
    it('should generate matches for a valid league with 2 members', async () => {
      const league = await createTestLeague('Two Member League');

      // Add one member (creator already exists)
      const opponent = await createOpponent(`opponent-${Date.now()}@test.com`, 'Opponent User');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active',
      });

      // Generate matches
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow

      const { data: result, error } = await supabase.rpc('generate_matches_for_league', {
        p_league_id: league.id,
        p_start_date: startDate.toISOString(),
      });

      expect(error).toBeNull();
      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].matches_created).toBe(1); // 2 players = 1 round, 1 match

      // Verify league status was updated
      const { data: updatedLeague } = await supabase
        .from('leagues')
        .select('status, start_date')
        .eq('id', league.id)
        .single();

      expect(updatedLeague?.status).toBe('active');
      expect(updatedLeague?.start_date).toBeDefined();

      // Verify matches were created
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('league_id', league.id);

      expect(matches).toBeDefined();
      expect(matches?.length).toBe(1);
      expect(matches?.[0].status).toBe('scheduled');
      expect(matches?.[0].round_number).toBe(1);
      expect(matches?.[0].home_player_id).toBeDefined();
      expect(matches?.[0].away_player_id).toBeDefined();
      expect(matches?.[0].scheduled_date).toBeDefined();
      expect(matches?.[0].submission_deadline).toBeDefined();
    });

    it('should generate correct number of matches for 4 members (no return fixtures)', async () => {
      const league = await createTestLeague('Four Member League');

      // Add 3 members (creator already exists = 4 total)
      const opponent1 = await createOpponent(`opponent1-${Date.now()}@test.com`, 'Opponent 1');
      const opponent2 = await createOpponent(`opponent2-${Date.now()}@test.com`, 'Opponent 2');
      const opponent3 = await createOpponent(`opponent3-${Date.now()}@test.com`, 'Opponent 3');

      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: opponent1.id, role: 'member', status: 'active' },
        { league_id: league.id, user_id: opponent2.id, role: 'member', status: 'active' },
        { league_id: league.id, user_id: opponent3.id, role: 'member', status: 'active' },
      ]);

      // Update settings to disable return fixtures
      await supabase
        .from('league_settings')
        .update({ include_return_fixtures: false })
        .eq('league_id', league.id);

      // Generate matches (4 players = 3 rounds, 2 matches per round = 6 matches total)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      const { data: result, error } = await supabase.rpc('generate_matches_for_league', {
        p_league_id: league.id,
        p_start_date: startDate.toISOString(),
      });

      expect(error).toBeNull();
      expect(result).toBeDefined();
      expect(result[0].matches_created).toBe(6); // 4 players = 3 rounds * 2 matches per round

      // Verify rounds are correct
      const { data: matches } = await supabase
        .from('matches')
        .select('round_number')
        .eq('league_id', league.id)
        .order('round_number');

      expect(matches?.length).toBe(6);

      // Check round distribution
      const rounds = matches?.map((m) => m.round_number) || [];
      expect(rounds.filter((r) => r === 1).length).toBe(2);
      expect(rounds.filter((r) => r === 2).length).toBe(2);
      expect(rounds.filter((r) => r === 3).length).toBe(2);
    });

    it('should generate matches with return fixtures when enabled', async () => {
      const league = await createTestLeague('Return Fixtures League');

      // Add one member (2 total)
      const opponent = await createOpponent(`opponent-${Date.now()}@test.com`, 'Opponent User');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active',
      });

      // Enable return fixtures
      await supabase
        .from('league_settings')
        .update({ include_return_fixtures: true })
        .eq('league_id', league.id);

      // Generate matches
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      const { data: result, error } = await supabase.rpc('generate_matches_for_league', {
        p_league_id: league.id,
        p_start_date: startDate.toISOString(),
      });

      expect(error).toBeNull();
      expect(result[0].matches_created).toBe(2); // 1 forward + 1 return

      // Verify matches (one forward, one return)
      const { data: matches } = await supabase
        .from('matches')
        .select('round_number, home_player_id, away_player_id')
        .eq('league_id', league.id)
        .order('round_number');

      expect(matches?.length).toBe(2);

      // Verify return fixture has swapped home/away
      const forwardMatch = matches?.find((m) => m.round_number === 1);
      const returnMatch = matches?.find((m) => m.round_number === 2);

      expect(forwardMatch).toBeDefined();
      expect(returnMatch).toBeDefined();
      expect(forwardMatch?.home_player_id).toBe(returnMatch?.away_player_id);
      expect(forwardMatch?.away_player_id).toBe(returnMatch?.home_player_id);
    });

    it('should use custom settings from league_settings', async () => {
      const league = await createTestLeague('Custom Settings League');

      // Add one member
      const opponent = await createOpponent(`opponent-${Date.now()}@test.com`, 'Opponent User');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active',
      });

      // Update settings with custom values
      await supabase
        .from('league_settings')
        .update({
          match_frequency_days: 3,
          submission_window_hours: 72, // 3 days
        })
        .eq('league_id', league.id);

      // Generate matches
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      const { data: result, error } = await supabase.rpc('generate_matches_for_league', {
        p_league_id: league.id,
        p_start_date: startDate.toISOString(),
      });

      expect(error).toBeNull();
      expect(result[0].matches_created).toBe(1);

      // Verify match uses custom settings
      const { data: matches } = await supabase
        .from('matches')
        .select('scheduled_date, submission_deadline')
        .eq('league_id', league.id)
        .single();

      expect(matches).toBeDefined();
      expect(matches?.scheduled_date).toBeDefined();
      expect(matches?.submission_deadline).toBeDefined();

      // Calculate expected deadline (scheduled_date + 72 hours)
      const scheduledDate = new Date(matches!.scheduled_date);
      const expectedDeadline = new Date(scheduledDate.getTime() + 72 * 60 * 60 * 1000);
      const actualDeadline = new Date(matches!.submission_deadline);

      // Allow 1 second tolerance for timing
      expect(Math.abs(actualDeadline.getTime() - expectedDeadline.getTime())).toBeLessThan(1000);
    });

    it('should fail if league cannot be validated', async () => {
      const league = await createTestLeague('Invalid League');

      // Try to generate matches without enough members (should fail)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      const { error } = await supabase.rpc('generate_matches_for_league', {
        p_league_id: league.id,
        p_start_date: startDate.toISOString(),
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('cannot be started');
    });
  });
});
