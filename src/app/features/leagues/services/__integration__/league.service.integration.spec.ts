import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { LeagueService } from '../league.service';
import { MemberService } from '../member.service';
import { LeagueSettingsService } from '../league-settings.service';
import { CreateLeagueData, LeagueStatus, ScoringSystem, MemberRole } from '../../models/league.model';
import { firstValueFrom } from 'rxjs';

/**
 * Integration tests for LeagueService
 * These tests interact with a real Supabase instance
 * Run with: npm test -- --include='**\/*.integration.spec.ts'
 */
describe('LeagueService Integration Tests', () => {
  let service: LeagueService;
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
    testUserEmail = `integration-test-${timestamp}@example.com`;
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
      .update({ name: 'Integration Test User' })
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
        LeagueService,
        { provide: SupabaseClient, useValue: supabase }
      ]
    });

    service = TestBed.inject(LeagueService);
  });

  afterAll(async () => {
    // Cleanup: Delete test user and related data
    if (testUserId) {
      // Delete leagues created by test user
      await supabase
        .from('leagues')
        .delete()
        .eq('created_by', testUserId);

      // Sign out
      await supabase.auth.signOut();
    }
  });

  describe('createLeague', () => {
    it('should create a league with all required fields', async () => {
      const leagueData: CreateLeagueData = {
        name: 'Integration Test League',
        description: 'Testing league creation',
        gameType: 'Chess',
        isPrivate: false,
        settings: {
          scoringSystem: ScoringSystem.POINTS,
          pointsPerWin: 3,
          pointsPerDraw: 1,
          pointsPerLoss: 0,
          allowDraws: true
        }
      };

      const league = await firstValueFrom(service.createLeague(leagueData));

      expect(league).toBeDefined();
      expect(league.name).toBe('Integration Test League');
      expect(league.description).toBe('Testing league creation');
      expect(league.gameType).toBe('Chess');
      expect(league.isPrivate).toBe(false);
      expect(league.status).toBe(LeagueStatus.DRAFT);
      expect(league.createdBy).toBe(testUserId);
      expect(league.inviteCode).toMatch(/^LMNR-[A-Z0-9]{6}$/);
      expect(league.id).toBeDefined();
    });

    it('should auto-generate invite code if not provided', async () => {
      const leagueData: CreateLeagueData = {
        name: 'Auto Code League',
        gameType: 'Pool',
        isPrivate: false,
        settings: {
          scoringSystem: ScoringSystem.WIN_LOSS,
          pointsPerWin: 1,
          pointsPerDraw: 0,
          pointsPerLoss: 0,
          allowDraws: false
        }
      };

      const league = await firstValueFrom(service.createLeague(leagueData));

      expect(league.inviteCode).toMatch(/^LMNR-[A-Z0-9]{6}$/);
    });

    it('should create league settings automatically', async () => {
      const leagueData: CreateLeagueData = {
        name: 'Settings Test League',
        gameType: 'Darts',
        isPrivate: false,
        settings: {
          scoringSystem: ScoringSystem.WIN_LOSS,
          pointsPerWin: 5,
          pointsPerDraw: 2,
          pointsPerLoss: 0,
          allowDraws: true
        }
      };

      const league = await firstValueFrom(service.createLeague(leagueData));

      // Verify settings were created by checking the database
      const { data: settings, error } = await supabase
        .from('league_settings')
        .select('*')
        .eq('league_id', league.id)
        .single();

      expect(error).toBeNull();
      expect(settings).toBeDefined();
      expect(settings?.scoring_system).toBe('elo');
    });

    it('should add creator as member automatically', async () => {
      const leagueData: CreateLeagueData = {
        name: 'Member Test League',
        gameType: 'Trivia',
        isPrivate: false,
        settings: {
          scoringSystem: ScoringSystem.POINTS,
          pointsPerWin: 3,
          pointsPerDraw: 1,
          pointsPerLoss: 0,
          allowDraws: false
        }
      };

      const league = await firstValueFrom(service.createLeague(leagueData));

      // Verify creator was added as member
      const { data: members, error } = await supabase
        .from('league_members')
        .select('*')
        .eq('league_id', league.id)
        .eq('user_id', testUserId);

      expect(error).toBeNull();
      expect(members).toBeDefined();
      expect(members?.length).toBe(1);
      expect(members?.[0].role).toBe('creator');
      expect(members?.[0].status).toBe('active');
    });
  });

  describe('getMyLeagues', () => {
    it('should fetch leagues created by the user', async () => {
      // Create a league first
      const leagueData: CreateLeagueData = {
        name: 'My Leagues Test',
        gameType: 'GamePigeon',
        isPrivate: false,
        settings: {
          scoringSystem: ScoringSystem.POINTS,
          pointsPerWin: 3,
          pointsPerDraw: 1,
          pointsPerLoss: 0,
          allowDraws: false
        }
      };

      await firstValueFrom(service.createLeague(leagueData));

      // Fetch leagues
      const leagues = await firstValueFrom(service.getMyLeagues());

      expect(leagues).toBeDefined();
      expect(leagues.length).toBeGreaterThan(0);
      expect(leagues.some(l => l.name === 'My Leagues Test')).toBe(true);
    });
  });

  describe('getLeagueById', () => {
    it('should fetch a specific league with details', async () => {
      // Create a league first
      const leagueData: CreateLeagueData = {
        name: 'Get By ID Test',
        gameType: 'Chess',
        isPrivate: false,
        settings: {
          scoringSystem: ScoringSystem.POINTS,
          pointsPerWin: 3,
          pointsPerDraw: 1,
          pointsPerLoss: 0,
          allowDraws: false
        }
      };

      const createdLeague = await firstValueFrom(service.createLeague(leagueData));

      // Fetch the league by ID
      const league = await firstValueFrom(service.getLeagueById(createdLeague.id));

      expect(league).toBeDefined();
      expect(league.id).toBe(createdLeague.id);
      expect(league.name).toBe('Get By ID Test');
      expect(league.settings).toBeDefined();
      expect(league.settings.scoringSystem).toBe(ScoringSystem.POINTS);
      expect(league.memberCount).toBe(1); // Creator is automatically added
    });
  });

  describe('joinLeagueByCode', () => {
    it('should join a league using invite code', async () => {
      // Create a league first
      const leagueData: CreateLeagueData = {
        name: 'Join Code Test',
        gameType: 'Pool',
        isPrivate: false,
        settings: {
          scoringSystem: ScoringSystem.POINTS,
          pointsPerWin: 3,
          pointsPerDraw: 1,
          pointsPerLoss: 0,
          allowDraws: false
        }
      };

      const createdLeague = await firstValueFrom(service.createLeague(leagueData));
      const inviteCode = createdLeague.inviteCode;

      // Create a second user to join the league
      const timestamp = Date.now();
      const secondUserEmail = `join-test-${timestamp}@example.com`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: secondUserEmail,
        password: 'TestPassword123!'
      });

      if (authError || !authData.user) {
        throw new Error('Failed to create second user');
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({ name: 'Second User' })
        .eq('id', authData.user.id);

      // Sign in as second user
      await supabase.auth.signInWithPassword({
        email: secondUserEmail,
        password: 'TestPassword123!'
      });

      // Join the league
      const joinedLeague = await firstValueFrom(service.joinLeagueByCode(inviteCode));

      expect(joinedLeague).toBeDefined();
      expect(joinedLeague.id).toBe(createdLeague.id);
      expect(joinedLeague.name).toBe('Join Code Test');

      // Verify membership was created
      const { data: members } = await supabase
        .from('league_members')
        .select('*')
        .eq('league_id', createdLeague.id)
        .eq('user_id', authData.user.id);

      expect(members?.length).toBe(1);
      expect(members?.[0].role).toBe('member');

      // Sign back in as original user
      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword
      });
    });

    it('should allow joined member to see all league members', async () => {
      // Create a league as first user
      const leagueData: CreateLeagueData = {
        name: 'Member Visibility Test',
        gameType: 'Chess',
        description: 'Testing member visibility'
      };

      const createdLeague = await firstValueFrom(service.createLeague(leagueData));
      const inviteCode = createdLeague.inviteCode!;

      // Create and sign in as second user
      const secondUserEmail = `seconduser${Date.now()}@test.com`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: secondUserEmail,
        password: 'TestPassword123!'
      });

      if (authError || !authData.user) {
        throw new Error('Failed to create second user');
      }

      // Update profile with name
      await supabase
        .from('profiles')
        .update({ name: 'Second Test User' })
        .eq('id', authData.user.id);

      // Sign in as second user
      await supabase.auth.signInWithPassword({
        email: secondUserEmail,
        password: 'TestPassword123!'
      });

      // Join the league as second user
      await firstValueFrom(service.joinLeagueByCode(inviteCode));

      // Now fetch members using MemberService
      const memberService = TestBed.inject(MemberService);
      const members = await firstValueFrom(memberService.getLeagueMembers(createdLeague.id));

      // Second user should see both members (creator and themselves)
      expect(members.length).toBe(2);
      
      // Verify creator is in the list
      const creator = members.find(m => m.role === MemberRole.CREATOR);
      expect(creator).toBeDefined();
      expect(creator?.userName).toBe('Integration Test User'); // First user's name from setup
      expect(creator?.userEmail).toBe(testUserEmail);

      // Verify second user is in the list
      const member = members.find(m => m.role === MemberRole.MEMBER);
      expect(member).toBeDefined();
      expect(member?.userName).toBe('Second Test User');
      expect(member?.userEmail).toBe(secondUserEmail);
      expect(member?.userId).toBe(authData.user.id);

      // Sign back in as original user
      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword
      });
    });
  });

  describe('League Settings', () => {
    it('should update league settings', async () => {
      // Create a league
      const leagueData: CreateLeagueData = {
        name: 'Settings Test League',
        gameType: 'Chess'
      };

      const createdLeague = await firstValueFrom(service.createLeague(leagueData));

      // Update settings
      const settingsService = TestBed.inject(LeagueSettingsService);
      const updatedSettings = await firstValueFrom(
        settingsService.updateSettings(createdLeague.id, {
          pointsPerWin: 5,
          pointsPerDraw: 2,
          allowDraws: true
        })
      );

      expect(updatedSettings.pointsPerWin).toBe(5);
      expect(updatedSettings.pointsPerDraw).toBe(2);
      expect(updatedSettings.allowDraws).toBe(true);
    });

    it('should get league settings', async () => {
      // Create a league
      const leagueData: CreateLeagueData = {
        name: 'Get Settings Test',
        gameType: 'Pool'
      };

      const createdLeague = await firstValueFrom(service.createLeague(leagueData));

      // Get settings
      const settingsService = TestBed.inject(LeagueSettingsService);
      const settings = await firstValueFrom(
        settingsService.getSettings(createdLeague.id)
      );

      expect(settings).toBeDefined();
      expect(settings.leagueId).toBe(createdLeague.id);
      expect(settings.pointsPerWin).toBe(3); // Default value
      expect(settings.scoringSystem).toBe(ScoringSystem.POINTS);
    });
  });

  describe('Member Management', () => {
    it('should remove member from league', async () => {
      // Create a league
      const leagueData: CreateLeagueData = {
        name: 'Remove Member Test',
        gameType: 'Chess'
      };

      const createdLeague = await firstValueFrom(service.createLeague(leagueData));
      const inviteCode = createdLeague.inviteCode!;

      // Create and add second user
      const secondUserEmail = `removemember${Date.now()}@test.com`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: secondUserEmail,
        password: 'TestPassword123!'
      });

      if (authError || !authData.user) {
        throw new Error('Failed to create second user');
      }

      await supabase
        .from('profiles')
        .update({ name: 'Member To Remove' })
        .eq('id', authData.user.id);

      await supabase.auth.signInWithPassword({
        email: secondUserEmail,
        password: 'TestPassword123!'
      });

      await firstValueFrom(service.joinLeagueByCode(inviteCode));

      // Sign back in as creator
      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword
      });

      // Remove the member
      const memberService = TestBed.inject(MemberService);
      await firstValueFrom(
        memberService.removeMember(createdLeague.id, authData.user.id)
      );

      // Verify member was removed
      const members = await firstValueFrom(
        memberService.getLeagueMembers(createdLeague.id)
      );

      expect(members.length).toBe(1); // Only creator remains
      expect(members[0].role).toBe(MemberRole.CREATOR);
    });

    it('should update member role', async () => {
      // Create a league
      const leagueData: CreateLeagueData = {
        name: 'Update Role Test',
        gameType: 'Pool'
      };

      const createdLeague = await firstValueFrom(service.createLeague(leagueData));
      const inviteCode = createdLeague.inviteCode!;

      // Create and add second user
      const secondUserEmail = `updaterole${Date.now()}@test.com`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: secondUserEmail,
        password: 'TestPassword123!'
      });

      if (authError || !authData.user) {
        throw new Error('Failed to create second user');
      }

      await supabase
        .from('profiles')
        .update({ name: 'Role Update User' })
        .eq('id', authData.user.id);

      await supabase.auth.signInWithPassword({
        email: secondUserEmail,
        password: 'TestPassword123!'
      });

      await firstValueFrom(service.joinLeagueByCode(inviteCode));

      // Sign back in as creator
      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword
      });

      // Update member role to admin
      const memberService = TestBed.inject(MemberService);
      const updatedMember = await firstValueFrom(
        memberService.updateMemberRole(createdLeague.id, authData.user.id, MemberRole.ADMIN)
      );

      expect(updatedMember.role).toBe(MemberRole.ADMIN);
      expect(updatedMember.userId).toBe(authData.user.id);
    });

    it('should check if user is member of league', async () => {
      // Create a league
      const leagueData: CreateLeagueData = {
        name: 'Is Member Test',
        gameType: 'Chess'
      };

      const createdLeague = await firstValueFrom(service.createLeague(leagueData));

      // Check if creator is member
      const memberService = TestBed.inject(MemberService);
      const { data: { user } } = await supabase.auth.getUser();
      
      const isMember = await firstValueFrom(
        memberService.isMember(createdLeague.id, user!.id)
      );

      expect(isMember).toBe(true);

      // Create a second user who is not a member
      const nonMemberEmail = `nonmember${Date.now()}@test.com`;
      const { data: authData } = await supabase.auth.signUp({
        email: nonMemberEmail,
        password: 'TestPassword123!'
      });

      await supabase.auth.signInWithPassword({
        email: nonMemberEmail,
        password: 'TestPassword123!'
      });

      const isNotMember = await firstValueFrom(
        memberService.isMember(createdLeague.id, authData!.user!.id)
      );

      expect(isNotMember).toBe(false);

      // Sign back in as original user
      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword
      });
    });

    it('should get member role', async () => {
      // Create a league
      const leagueData: CreateLeagueData = {
        name: 'Get Role Test',
        gameType: 'Pool'
      };

      const createdLeague = await firstValueFrom(service.createLeague(leagueData));

      // Get creator's role
      const memberService = TestBed.inject(MemberService);
      const { data: { user } } = await supabase.auth.getUser();
      
      const role = await firstValueFrom(
        memberService.getUserRole(createdLeague.id, user!.id)
      );

      expect(role).toBe(MemberRole.CREATOR);
    });
  });
});
