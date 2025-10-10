import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { FixtureService } from '../fixture.service';
import { FixtureStatus, type Fixture } from '../../models/fixture.model';

/**
 * Integration tests for Fixture Generation (Round-Robin Algorithm)
 * Tests fixture generation with various player counts
 * 
 * Following best practices:
 * - Write integration tests FIRST before implementing algorithm
 * - Test database operations
 * - Test edge cases (odd/even players, return fixtures)
 * - Create test user in beforeAll
 * - Each test creates its own league/members
 */
describe('Fixture Generation Integration Tests', () => {
  let supabase: SupabaseClient;
  let fixtureService: FixtureService;
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;

  // Helper function to create a league
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

  // Helper function to create multiple opponents
  async function createOpponents(count: number, leagueId: string) {
    const opponents = [];
    const timestamp = Date.now();

    for (let i = 1; i <= count; i++) {
      const email = `fixture-gen-opp-${timestamp}-${i}@example.com`;
      const { data: { user } } = await supabase.auth.signUp({
        email,
        password: 'TestPassword123!'
      });

      await supabase.from('profiles').update({ 
        name: `Player ${i}` 
      }).eq('id', user!.id);

      // Add as league member
      await supabase.from('league_members').insert({
        league_id: leagueId,
        user_id: user!.id,
        role: 'member',
        status: 'active'
      });

      opponents.push(user!);
    }

    // Sign back in as test user
    await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword
    });

    return opponents;
  }

  beforeAll(async () => {
    // Create Supabase client
    supabase = createClient(
      'http://127.0.0.1:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );

    // Create test user
    const timestamp = Date.now();
    testUserEmail = `fixture-gen-test-${timestamp}@example.com`;
    testUserPassword = 'TestPassword123!';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUserEmail,
      password: testUserPassword
    });

    if (authError || !authData.user) {
      throw new Error('Failed to create test user: ' + authError?.message);
    }

    testUserId = authData.user.id;

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: 'Fixture Gen Test User' })
      .eq('id', testUserId);

    if (profileError) {
      throw new Error('Failed to update profile: ' + profileError.message);
    }

    // Sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword
    });

    if (signInError) {
      throw new Error('Failed to sign in: ' + signInError.message);
    }
  });

  beforeEach(() => {
    // Configure TestBed for each test
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        FixtureService,
        { provide: SupabaseClient, useValue: supabase }
      ]
    });

    fixtureService = TestBed.inject(FixtureService);
  });

  afterAll(async () => {
    // Cleanup: Delete test user and related data
    if (testUserId) {
      await supabase.from('leagues').delete().eq('created_by', testUserId);
      await supabase.auth.signOut();
    }
  });

  describe('Round-Robin Algorithm', () => {
    it('should generate correct number of fixtures for even players (4 players)', async () => {
      const league = await createTestLeague('4 Players League');

      // Add test user as league member (creator)
      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      // Create 3 opponents (total 4 players)
      const opponents = await createOpponents(3, league.id);

      // Generate fixtures (single round-robin)
      const result = await fixtureService.generateRoundRobinFixtures({
        league_id: league.id,
        start_date: '2025-01-05T18:00:00Z',
        match_frequency_days: 7,
        include_return_fixtures: false,
        submission_window_hours: 24
      });

      // 4 players = 3 rounds, 2 fixtures per round = 6 total fixtures
      expect(result.total_rounds).toBe(3);
      expect(result.total_fixtures).toBe(6);
      expect(result.fixtures.length).toBe(6);

      // Verify all fixtures are scheduled
      result.fixtures.forEach((fixture: Fixture) => {
        expect(fixture.status).toBe(FixtureStatus.SCHEDULED);
      });

      // Cleanup
      for (const opponent of opponents) {
        await supabase.from('profiles').delete().eq('id', opponent.id);
      }
    });

    it('should generate correct number of fixtures for odd players (5 players)', async () => {
      const league = await createTestLeague('5 Players League');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      const opponents = await createOpponents(4, league.id);

      const result = await fixtureService.generateRoundRobinFixtures({
        league_id: league.id,
        start_date: '2025-01-05T18:00:00Z',
        match_frequency_days: 7,
        include_return_fixtures: false,
        submission_window_hours: 24
      });

      // 5 players = 5 rounds, 2 fixtures per round = 10 total fixtures
      expect(result.total_rounds).toBe(5);
      expect(result.total_fixtures).toBe(10);

      for (const opponent of opponents) {
        await supabase.from('profiles').delete().eq('id', opponent.id);
      }
    });

    it('should generate return fixtures when enabled', async () => {
      const league = await createTestLeague('Return Fixtures League');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      const opponents = await createOpponents(3, league.id);

      // Generate with return fixtures (home & away)
      const result = await fixtureService.generateRoundRobinFixtures({
        league_id: league.id,
        start_date: '2025-01-05T18:00:00Z',
        match_frequency_days: 7,
        include_return_fixtures: true,
        submission_window_hours: 24
      });

      // 4 players = 3 rounds * 2 (return) = 6 rounds, 2 fixtures per round = 12 total fixtures
      expect(result.total_rounds).toBe(6);
      expect(result.total_fixtures).toBe(12);

      for (const opponent of opponents) {
        await supabase.from('profiles').delete().eq('id', opponent.id);
      }
    });

    it('should schedule fixtures with correct dates', async () => {
      const league = await createTestLeague('Fixture Dates League');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      const opponents = await createOpponents(3, league.id);

      const startDate = new Date('2025-01-05T18:00:00Z');
      const result = await fixtureService.generateRoundRobinFixtures({
        league_id: league.id,
        start_date: startDate.toISOString(),
        match_frequency_days: 7,
        include_return_fixtures: false,
        submission_window_hours: 24
      });

      // Check first round fixtures (should be on start date)
      const round1Fixtures = result.fixtures.filter((f: Fixture) => f.round_number === 1);
      round1Fixtures.forEach((fixture: Fixture) => {
        const schedDate = new Date(fixture.scheduled_date);
        expect(schedDate.getTime()).toBe(startDate.getTime());
      });

      // Check second round fixtures (should be 7 days later)
      const round2Fixtures = result.fixtures.filter((f: Fixture) => f.round_number === 2);
      const expectedRound2Date = new Date(startDate);
      expectedRound2Date.setDate(expectedRound2Date.getDate() + 7);

      round2Fixtures.forEach((fixture: Fixture) => {
        const schedDate = new Date(fixture.scheduled_date);
        expect(schedDate.getTime()).toBe(expectedRound2Date.getTime());
      });

      for (const opponent of opponents) {
        await supabase.from('profiles').delete().eq('id', opponent.id);
      }
    });

    it('should calculate correct submission deadlines', async () => {
      const league = await createTestLeague('Deadline League');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      const opponents = await createOpponents(3, league.id);

      const result = await fixtureService.generateRoundRobinFixtures({
        league_id: league.id,
        start_date: '2025-01-05T18:00:00Z',
        match_frequency_days: 7,
        include_return_fixtures: false,
        submission_window_hours: 48 // 2 days
      });

      // Check that submission deadline is 48 hours after scheduled date
      result.fixtures.forEach((fixture: Fixture) => {
        const scheduledDate = new Date(fixture.scheduled_date);
        const deadline = new Date(fixture.submission_deadline);
        const diffHours = (deadline.getTime() - scheduledDate.getTime()) / (1000 * 60 * 60);

        expect(diffHours).toBe(48);
      });

      for (const opponent of opponents) {
        await supabase.from('profiles').delete().eq('id', opponent.id);
      }
    });

    it('should assign unique home and away players in each fixture', async () => {
      const league = await createTestLeague('Unique Players League');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      const opponents = await createOpponents(3, league.id);

      const result = await fixtureService.generateRoundRobinFixtures({
        league_id: league.id,
        start_date: '2025-01-05T18:00:00Z',
        match_frequency_days: 7,
        include_return_fixtures: false,
        submission_window_hours: 24
      });

      // Check that home and away players are different in each fixture
      result.fixtures.forEach((fixture: Fixture) => {
        expect(fixture.home_player_id).not.toBe(fixture.away_player_id);
      });

      for (const opponent of opponents) {
        await supabase.from('profiles').delete().eq('id', opponent.id);
      }
    });

    it('should ensure each player plays against every other player once', async () => {
      const league = await createTestLeague('Complete Round Robin League');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      const opponents = await createOpponents(3, league.id);
      const allPlayerIds = [testUserId, ...opponents.map(o => o.id)];

      const result = await fixtureService.generateRoundRobinFixtures({
        league_id: league.id,
        start_date: '2025-01-05T18:00:00Z',
        match_frequency_days: 7,
        include_return_fixtures: false,
        submission_window_hours: 24
      });

      // Create a set to track unique pairings
      const pairings = new Set<string>();

      result.fixtures.forEach((fixture: Fixture) => {
        const pair = [fixture.home_player_id, fixture.away_player_id].sort().join('-');
        pairings.add(pair);
      });

      // 4 players should have (4 * 3) / 2 = 6 unique pairings
      expect(pairings.size).toBe(6);

      for (const opponent of opponents) {
        await supabase.from('profiles').delete().eq('id', opponent.id);
      }
    });

    it('should fail with less than 2 players', async () => {
      const league = await createTestLeague('Single Player League');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      try {
        await fixtureService.generateRoundRobinFixtures({
          league_id: league.id,
          start_date: '2025-01-05T18:00:00Z',
          match_frequency_days: 7,
          include_return_fixtures: false,
          submission_window_hours: 24
        });

        fail('Should have thrown error for insufficient players');
      } catch (error: any) {
        expect(error.message).toContain('at least 2');
      }
    });

    it('should link fixtures to a season', async () => {
      const league = await createTestLeague('Season Fixture League');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      const opponents = await createOpponents(3, league.id);

      // Create a season
      const { data: season } = await supabase
        .from('seasons')
        .insert({
          league_id: league.id,
          name: 'Season 1',
          season_number: 1,
          start_date: '2025-01-01',
          status: 'active'
        })
        .select()
        .single();

      const result = await fixtureService.generateRoundRobinFixtures({
        league_id: league.id,
        season_id: season!.id,
        start_date: '2025-01-05T18:00:00Z',
        match_frequency_days: 7,
        include_return_fixtures: false,
        submission_window_hours: 24
      });

      // All fixtures should be linked to the season
      result.fixtures.forEach((fixture: Fixture) => {
        expect(fixture.season_id).toBe(season!.id);
      });

      for (const opponent of opponents) {
        await supabase.from('profiles').delete().eq('id', opponent.id);
      }
    });
  });
});

