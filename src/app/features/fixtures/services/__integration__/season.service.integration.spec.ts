import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { SeasonStatus } from '../../models/season.model';
import type { Fixture } from '../../models/fixture.model';
import { SeasonService } from '../season.service';

/**
 * Integration tests for Season Service
 * Tests season management operations
 * 
 * Following best practices:
 * - Write integration tests FIRST before services
 * - Test database operations directly
 * - Create test user in beforeAll
 * - Each test creates its own league/season
 */
describe('SeasonService Integration Tests', () => {
  let supabase: SupabaseClient;
  let seasonService: SeasonService;
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

    // Add creator as league member
    await supabase.from('league_members').insert({
      league_id: league.id,
      user_id: testUserId,
      role: 'creator',
      status: 'active'
    });

    return league;
  }

  beforeAll(async () => {
    // Create Supabase client
    supabase = createClient(
      'http://127.0.0.1:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );

    // Create test user
    const timestamp = Date.now();
    testUserEmail = `season-test-${timestamp}@example.com`;
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
      .update({ name: 'Season Test User' })
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
        SeasonService,
        { provide: SupabaseClient, useValue: supabase }
      ]
    });

    seasonService = TestBed.inject(SeasonService);
  });

  afterAll(async () => {
    // Cleanup: Delete test user and related data
    if (testUserId) {
      await supabase.from('leagues').delete().eq('created_by', testUserId);
      await supabase.auth.signOut();
    }
  });

  describe('createSeason', () => {
    it('should create a season', async () => {
      const league = await createTestLeague('Season Create League');

      const result = await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 1',
        description: 'First season',
        season_number: 1,
        start_date: '2025-01-01',
        status: SeasonStatus.UPCOMING
      });

      expect(result).toBeTruthy();
      expect(result.league_id).toBe(league.id);
      expect(result.name).toBe('Season 1');
      expect(result.season_number).toBe(1);
      expect(result.status).toBe(SeasonStatus.UPCOMING);
    });

    it('should create a season with minimal data', async () => {
      const league = await createTestLeague('Minimal Season League');

      const result = await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 2',
        season_number: 2,
        start_date: '2025-02-01'
      });

      expect(result).toBeTruthy();
      expect(result.name).toBe('Season 2');
      expect(result.description).toBeNull();
    });
  });

  describe('getLeagueSeasons', () => {
    it('should get all seasons for a league', async () => {
      const league = await createTestLeague('Multi Season League');

      // Create multiple seasons
      await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 1',
        season_number: 1,
        start_date: '2025-01-01',
        status: SeasonStatus.COMPLETED
      });

      await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 2',
        season_number: 2,
        start_date: '2025-03-01',
        status: SeasonStatus.ACTIVE
      });

      await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 3',
        season_number: 3,
        start_date: '2025-06-01',
        status: SeasonStatus.UPCOMING
      });

      const seasons = await seasonService.getLeagueSeasons(league.id);

      expect(seasons.length).toBe(3);
      expect(seasons[0].season_number).toBe(3); // Ordered by season_number DESC
      expect(seasons[1].season_number).toBe(2);
      expect(seasons[2].season_number).toBe(1);
    });

    it('should return empty array for league with no seasons', async () => {
      const league = await createTestLeague('No Season League');

      const seasons = await seasonService.getLeagueSeasons(league.id);

      expect(seasons).toEqual([]);
    });
  });

  describe('getActiveSeason', () => {
    it('should get the active season for a league', async () => {
      const league = await createTestLeague('Active Season League');

      await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 1',
        season_number: 1,
        start_date: '2025-01-01',
        status: SeasonStatus.COMPLETED
      });

      const activeSeason = await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 2',
        season_number: 2,
        start_date: '2025-03-01',
        status: SeasonStatus.ACTIVE
      });

      const result = await seasonService.getActiveSeason(league.id);

      expect(result).toBeTruthy();
      expect(result!.id).toBe(activeSeason.id);
      expect(result!.status).toBe(SeasonStatus.ACTIVE);
    });

    it('should return null if no active season exists', async () => {
      const league = await createTestLeague('No Active Season League');

      await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 1',
        season_number: 1,
        start_date: '2025-01-01',
        status: SeasonStatus.COMPLETED
      });

      const result = await seasonService.getActiveSeason(league.id);

      expect(result).toBeNull();
    });
  });

  describe('getSeasonById', () => {
    it('should get a season by id', async () => {
      const league = await createTestLeague('Get Season By ID League');

      const season = await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 1',
        season_number: 1,
        start_date: '2025-01-01',
        status: SeasonStatus.ACTIVE
      });

      const result = await seasonService.getSeasonById(season.id);

      expect(result).toBeTruthy();
      expect(result!.id).toBe(season.id);
      expect(result!.name).toBe('Season 1');
    });

    it('should return null for non-existent season', async () => {
      const result = await seasonService.getSeasonById('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });

  describe('updateSeason', () => {
    it('should update a season', async () => {
      const league = await createTestLeague('Update Season League');

      const season = await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 1',
        season_number: 1,
        start_date: '2025-01-01',
        status: SeasonStatus.UPCOMING
      });

      const result = await seasonService.updateSeason(season.id, {
        name: 'Updated Season',
        description: 'Updated description',
        status: SeasonStatus.ACTIVE
      });

      expect(result).toBeTruthy();
      expect(result.name).toBe('Updated Season');
      expect(result.description).toBe('Updated description');
      expect(result.status).toBe(SeasonStatus.ACTIVE);
    });

    it('should update only specified fields', async () => {
      const league = await createTestLeague('Partial Update League');

      const season = await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 1',
        description: 'Original description',
        season_number: 1,
        start_date: '2025-01-01',
        status: SeasonStatus.UPCOMING
      });

      const result = await seasonService.updateSeason(season.id, {
        status: SeasonStatus.ACTIVE
      });

      expect(result.name).toBe('Season 1'); // Unchanged
      expect(result.description).toBe('Original description'); // Unchanged
      expect(result.status).toBe(SeasonStatus.ACTIVE); // Updated
    });
  });

  describe('endSeason', () => {
    it('should end a season', async () => {
      const league = await createTestLeague('End Season League');

      const season = await seasonService.createSeason({
        league_id: league.id,
        name: 'Season 1',
        season_number: 1,
        start_date: '2025-01-01',
        status: SeasonStatus.ACTIVE
      });

      const result = await seasonService.endSeason(season.id, '2025-03-31');

      expect(result).toBeTruthy();
      expect(result.status).toBe(SeasonStatus.COMPLETED);
      expect(result.end_date).toBe('2025-03-31');
    });
  });

  describe('deleteSeason', () => {
    it('should delete a season', async () => {
      const league = await createTestLeague('Delete Season League');

      const season = await seasonService.createSeason({
        league_id: league.id,
        name: 'Season to Delete',
        season_number: 1,
        start_date: '2025-01-01',
        status: SeasonStatus.UPCOMING
      });

      await seasonService.deleteSeason(season.id);

      // Verify season is deleted
      const result = await seasonService.getSeasonById(season.id);
      expect(result).toBeNull();
    });
  });
});

