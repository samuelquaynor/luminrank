import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

/**
 * Integration tests for Fixture Database Operations
 * Tests database tables, functions, and RLS policies for Phase 3
 * 
 * Following best practices:
 * - Write integration tests FIRST before services
 * - Test database directly to verify schema and policies
 * - Create test user in beforeAll
 * - Each test creates its own league/season/fixtures
 */
describe('Fixture Database Integration Tests', () => {
  let supabase: SupabaseClient;
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

  // Helper function to create an opponent
  async function createOpponent(email: string, name: string) {
    const { data: { user } } = await supabase.auth.signUp({
      email,
      password: 'TestPassword123!'
    });
    await supabase.from('profiles').update({ name }).eq('id', user!.id);

    // Sign back in as test user
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

    // Create test user
    const timestamp = Date.now();
    testUserEmail = `fixture-test-${timestamp}@example.com`;
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
      .update({ name: 'Fixture Test User' })
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

  afterAll(async () => {
    // Cleanup: Delete test user and related data
    if (testUserId) {
      await supabase.from('leagues').delete().eq('created_by', testUserId);
      await supabase.auth.signOut();
    }
  });

  describe('Seasons Table', () => {
    it('should create a season', async () => {
      const league = await createTestLeague('Season Test League');

      const { data: season, error } = await supabase
        .from('seasons')
        .insert({
          league_id: league.id,
          name: 'Season 1',
          description: 'First season',
          season_number: 1,
          start_date: '2025-01-01',
          status: 'upcoming'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(season).toBeTruthy();
      expect(season!.league_id).toBe(league.id);
      expect(season!.season_number).toBe(1);
      expect(season!.status).toBe('upcoming');
    });

    it('should enforce unique season numbers per league', async () => {
      const league = await createTestLeague('Unique Season League');

      // Create season 1
      await supabase.from('seasons').insert({
        league_id: league.id,
        name: 'Season 1',
        season_number: 1,
        start_date: '2025-01-01',
        status: 'active'
      });

      // Try to create another season 1 (should fail)
      const { error } = await supabase.from('seasons').insert({
        league_id: league.id,
        name: 'Season 1 Duplicate',
        season_number: 1,
        start_date: '2025-02-01',
        status: 'upcoming'
      });

      expect(error).toBeTruthy();
      expect(error!.message).toContain('duplicate');
    });

    it('should allow same season number in different leagues', async () => {
      const league1 = await createTestLeague('League 1');
      const league2 = await createTestLeague('League 2');

      // Create season 1 in league 1
      const { error: error1 } = await supabase.from('seasons').insert({
        league_id: league1.id,
        name: 'Season 1',
        season_number: 1,
        start_date: '2025-01-01',
        status: 'active'
      });

      // Create season 1 in league 2 (should succeed)
      const { error: error2 } = await supabase.from('seasons').insert({
        league_id: league2.id,
        name: 'Season 1',
        season_number: 1,
        start_date: '2025-01-01',
        status: 'active'
      });

      expect(error1).toBeNull();
      expect(error2).toBeNull();
    });

    it('should validate season status values', async () => {
      const league = await createTestLeague('Status Validation League');

      const { error } = await supabase.from('seasons').insert({
        league_id: league.id,
        name: 'Invalid Status Season',
        season_number: 1,
        start_date: '2025-01-01',
        status: 'invalid_status' as any
      });

      expect(error).toBeTruthy();
      expect(error!.message).toContain('check constraint');
    });
  });

  describe('Fixtures Table', () => {
    it('should create a fixture', async () => {
      const league = await createTestLeague('Fixture Test League');
      const opponent = await createOpponent(`fixture-opp-${Date.now()}@example.com`, 'Opponent');

      // Add both as league members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: opponent.id, role: 'member', status: 'active' }
      ]);

      // Create season
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

      // Create fixture
      const scheduledDate = new Date('2025-01-05T18:00:00Z');
      const deadline = new Date('2025-01-06T18:00:00Z');

      const { data: fixture, error } = await supabase
        .from('fixtures')
        .insert({
          league_id: league.id,
          season_id: season!.id,
          home_player_id: testUserId,
          away_player_id: opponent.id,
          round_number: 1,
          scheduled_date: scheduledDate.toISOString(),
          submission_deadline: deadline.toISOString(),
          status: 'scheduled'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(fixture).toBeTruthy();
      expect(fixture!.home_player_id).toBe(testUserId);
      expect(fixture!.away_player_id).toBe(opponent.id);
      expect(fixture!.round_number).toBe(1);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should prevent fixture with same home and away player', async () => {
      const league = await createTestLeague('Same Player League');

      const { error } = await supabase.from('fixtures').insert({
        league_id: league.id,
        home_player_id: testUserId,
        away_player_id: testUserId, // Same as home
        round_number: 1,
        scheduled_date: '2025-01-05T18:00:00Z',
        submission_deadline: '2025-01-06T18:00:00Z',
        status: 'scheduled'
      });

      expect(error).toBeTruthy();
      expect(error!.message).toContain('check constraint');
    });

    it('should prevent deadline before scheduled date', async () => {
      const league = await createTestLeague('Invalid Deadline League');
      const opponent = await createOpponent(`invalid-deadline-${Date.now()}@example.com`, 'Opponent');

      const { error } = await supabase.from('fixtures').insert({
        league_id: league.id,
        home_player_id: testUserId,
        away_player_id: opponent.id,
        round_number: 1,
        scheduled_date: '2025-01-06T18:00:00Z',
        submission_deadline: '2025-01-05T18:00:00Z', // Before scheduled date
        status: 'scheduled'
      });

      expect(error).toBeTruthy();
      expect(error!.message).toContain('check constraint');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should validate fixture status values', async () => {
      const league = await createTestLeague('Status Validation Fixture League');
      const opponent = await createOpponent(`status-val-${Date.now()}@example.com`, 'Opponent');

      const { error } = await supabase.from('fixtures').insert({
        league_id: league.id,
        home_player_id: testUserId,
        away_player_id: opponent.id,
        round_number: 1,
        scheduled_date: '2025-01-05T18:00:00Z',
        submission_deadline: '2025-01-06T18:00:00Z',
        status: 'invalid_status' as any
      });

      expect(error).toBeTruthy();
      expect(error!.message).toContain('check constraint');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('Database Functions', () => {
    it('should calculate submission deadline correctly', async () => {
      const scheduledDate = new Date('2025-01-05T18:00:00Z');
      const windowHours = 24;

      const { data, error } = await supabase.rpc('calculate_submission_deadline', {
        p_scheduled_date: scheduledDate.toISOString(),
        p_submission_window_hours: windowHours
      });

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      
      const expectedDeadline = new Date('2025-01-06T18:00:00Z');
      expect(new Date(data).getTime()).toBe(expectedDeadline.getTime());
    });

    it('should check if submission is within window', async () => {
      const league = await createTestLeague('Window Check League');
      const opponent = await createOpponent(`window-check-${Date.now()}@example.com`, 'Opponent');

      // Create fixture with deadline in the future
      const scheduledDate = new Date(Date.now() + 86400000); // Tomorrow
      const deadline = new Date(Date.now() + 172800000); // Day after tomorrow

      const { data: fixture } = await supabase
        .from('fixtures')
        .insert({
          league_id: league.id,
          home_player_id: testUserId,
          away_player_id: opponent.id,
          round_number: 1,
          scheduled_date: scheduledDate.toISOString(),
          submission_deadline: deadline.toISOString(),
          status: 'scheduled'
        })
        .select()
        .single();

      // Check if current time is within window (should be true)
      const { data: isWithinWindow, error } = await supabase.rpc('check_submission_window', {
        p_fixture_id: fixture!.id,
        p_submission_time: new Date().toISOString()
      });

      expect(error).toBeNull();
      expect(isWithinWindow).toBe(true);

      // Check if time after deadline is within window (should be false)
      const futureTime = new Date(Date.now() + 259200000); // 3 days from now
      const { data: isNotWithinWindow } = await supabase.rpc('check_submission_window', {
        p_fixture_id: fixture!.id,
        p_submission_time: futureTime.toISOString()
      });

      expect(isNotWithinWindow).toBe(false);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should mark overdue fixtures', async () => {
      const league = await createTestLeague('Overdue Fixtures League');
      const opponent = await createOpponent(`overdue-${Date.now()}@example.com`, 'Opponent');

      // Create a fixture with past deadline
      const pastDate = new Date(Date.now() - 172800000); // 2 days ago
      const pastDeadline = new Date(Date.now() - 86400000); // 1 day ago

      const { data: fixture } = await supabase
        .from('fixtures')
        .insert({
          league_id: league.id,
          home_player_id: testUserId,
          away_player_id: opponent.id,
          round_number: 1,
          scheduled_date: pastDate.toISOString(),
          submission_deadline: pastDeadline.toISOString(),
          status: 'scheduled'
        })
        .select()
        .single();

      // Mark overdue fixtures
      const { data: updatedCount, error } = await supabase.rpc('mark_overdue_fixtures');

      expect(error).toBeNull();
      expect(updatedCount).toBeGreaterThan(0);

      // Verify fixture is now overdue
      const { data: updatedFixture } = await supabase
        .from('fixtures')
        .select('status')
        .eq('id', fixture!.id)
        .single();

      expect(updatedFixture!.status).toBe('overdue');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should get player fixtures', async () => {
      const league = await createTestLeague('Player Fixtures League');
      const opponent = await createOpponent(`player-fix-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: opponent.id, role: 'member', status: 'active' }
      ]);

      // Create season
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

      // Create fixtures
      await supabase.from('fixtures').insert([
        {
          league_id: league.id,
          season_id: season!.id,
          home_player_id: testUserId,
          away_player_id: opponent.id,
          round_number: 1,
          scheduled_date: '2025-01-05T18:00:00Z',
          submission_deadline: '2025-01-06T18:00:00Z',
          status: 'scheduled'
        },
        {
          league_id: league.id,
          season_id: season!.id,
          home_player_id: opponent.id,
          away_player_id: testUserId,
          round_number: 2,
          scheduled_date: '2025-01-12T18:00:00Z',
          submission_deadline: '2025-01-13T18:00:00Z',
          status: 'scheduled'
        }
      ]);

      // Get player fixtures
      const { data: fixtures, error } = await supabase.rpc('get_player_fixtures', {
        p_profile_id: testUserId,
        p_league_id: league.id,
        p_season_id: season!.id
      });

      expect(error).toBeNull();
      expect(fixtures).toBeTruthy();
      expect(fixtures!.length).toBe(2);
      
      // Verify fixture data includes player names
      expect(fixtures![0].home_player_name).toBeTruthy();
      expect(fixtures![0].away_player_name).toBeTruthy();

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('RLS Policies', () => {
    it('should allow league members to view seasons', async () => {
      const league = await createTestLeague('RLS Season View League');

      const { data: season, error } = await supabase
        .from('seasons')
        .insert({
          league_id: league.id,
          name: 'Season 1',
          season_number: 1,
          start_date: '2025-01-01',
          status: 'upcoming'
        })
        .select()
        .single();

      expect(error).toBeNull();

      // Verify we can read it back (as creator/member)
      const { data: seasons } = await supabase
        .from('seasons')
        .select('*')
        .eq('league_id', league.id);

      expect(seasons).toBeTruthy();
      expect(seasons!.length).toBe(1);
    });

    it('should allow league members to view fixtures', async () => {
      const league = await createTestLeague('RLS Fixture View League');
      const opponent = await createOpponent(`rls-fix-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: opponent.id, role: 'member', status: 'active' }
      ]);

      const { data: fixture, error } = await supabase
        .from('fixtures')
        .insert({
          league_id: league.id,
          home_player_id: testUserId,
          away_player_id: opponent.id,
          round_number: 1,
          scheduled_date: '2025-01-05T18:00:00Z',
          submission_deadline: '2025-01-06T18:00:00Z',
          status: 'scheduled'
        })
        .select()
        .single();

      expect(error).toBeNull();

      // Verify we can read it back
      const { data: fixtures } = await supabase
        .from('fixtures')
        .select('*')
        .eq('league_id', league.id);

      expect(fixtures).toBeTruthy();
      expect(fixtures!.length).toBe(1);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should prevent non-members from viewing fixtures', async () => {
      const league = await createTestLeague('RLS Non-Member League');
      const opponentEmail = `rls-non-${Date.now()}@example.com`;
      
      // Create opponent (this will sign back in as test user)
      const opponent = await createOpponent(opponentEmail, 'Opponent');

      // Add only test user as member (not opponent)
      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active'
      });

      // Create fixture (while signed in as test user)
      await supabase.from('fixtures').insert({
        league_id: league.id,
        home_player_id: testUserId,
        away_player_id: opponent.id,
        round_number: 1,
        scheduled_date: '2025-01-05T18:00:00Z',
        submission_deadline: '2025-01-06T18:00:00Z',
        status: 'scheduled'
      });

      // Sign in as opponent (not a league member)
      await supabase.auth.signInWithPassword({
        email: opponentEmail,
        password: 'TestPassword123!'
      });

      // Try to view fixtures (should return empty due to RLS)
      const { data: fixtures } = await supabase
        .from('fixtures')
        .select('*')
        .eq('league_id', league.id);

      expect(fixtures).toEqual([]);

      // Sign back in as test user for cleanup
      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword
      });

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('Matches Integration with Fixtures', () => {
    it('should link match to fixture', async () => {
      const league = await createTestLeague('Match Fixture Link League');
      const opponent = await createOpponent(`match-fix-link-${Date.now()}@example.com`, 'Opponent');

      // Add members
      await supabase.from('league_members').insert([
        { league_id: league.id, user_id: testUserId, role: 'creator', status: 'active' },
        { league_id: league.id, user_id: opponent.id, role: 'member', status: 'active' }
      ]);

      // Create season
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

      // Create fixture
      const { data: fixture } = await supabase
        .from('fixtures')
        .insert({
          league_id: league.id,
          season_id: season!.id,
          home_player_id: testUserId,
          away_player_id: opponent.id,
          round_number: 1,
          scheduled_date: '2025-01-05T18:00:00Z',
          submission_deadline: '2025-01-06T18:00:00Z',
          status: 'scheduled'
        })
        .select()
        .single();

      // Create match linked to fixture
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          league_id: league.id,
          season_id: season!.id,
          fixture_id: fixture!.id,
          match_date: new Date().toISOString(),
          recorded_by: testUserId,
          status: 'completed'
        })
        .select()
        .single();

      expect(matchError).toBeNull();
      expect(match).toBeTruthy();
      expect(match!.fixture_id).toBe(fixture!.id);
      expect(match!.season_id).toBe(season!.id);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });
});

