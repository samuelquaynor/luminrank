import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { DisputeService } from '../dispute.service';
import { firstValueFrom } from 'rxjs';

/**
 * Integration tests for DisputeService
 * Tests service methods that interact with database
 * 
 * Following best practices:
 * - Write integration tests FIRST before frontend
 * - Test service layer operations
 * - Create test user in beforeAll
 * - Each test creates its own league/match/dispute
 */
describe('DisputeService Integration Tests', () => {
  let service: DisputeService;
  let supabase: SupabaseClient;
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;

  async function createTestLeague(name: string) {
    const { data: league } = await supabase
      .from('leagues')
      .insert({
        name,
        created_by: testUserId,
        game_type: 'Chess',
        status: 'active'
      })
      .select()
      .single();

    await supabase.from('league_members').insert({
      league_id: league!.id,
      user_id: testUserId,
      role: 'creator',
      status: 'active'
    });

    return league!;
  }

  async function createOpponent(email: string, name: string) {
    const { data: { user } } = await supabase.auth.signUp({
      email,
      password: 'TestPassword123!'
    });

    await supabase.from('profiles').update({ name }).eq('id', user!.id);

    await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword
    });

    return user!;
  }

  async function createTestMatch(leagueId: string, opponentId: string) {
    const { data: match } = await supabase
      .from('matches')
      .insert({
        league_id: leagueId,
        match_date: new Date().toISOString(),
        recorded_by: testUserId,
        status: 'completed'
      })
      .select()
      .single();

    await supabase.from('match_participants').insert([
      {
        match_id: match!.id,
        profile_id: testUserId,
        score: 10,
        result: 'win'
      },
      {
        match_id: match!.id,
        profile_id: opponentId,
        score: 5,
        result: 'loss'
      }
    ]);

    return match!;
  }

  beforeAll(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DisputeService,
        {
          provide: SupabaseClient,
          useFactory: () => createClient(
            'http://127.0.0.1:54321',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
          )
        }
      ]
    });

    service = TestBed.inject(DisputeService);
    supabase = TestBed.inject(SupabaseClient);

    const timestamp = Date.now();
    testUserEmail = `dispute-svc-test-${timestamp}@example.com`;
    testUserPassword = 'TestPassword123!';

    const { data: authData } = await supabase.auth.signUp({
      email: testUserEmail,
      password: testUserPassword
    });

    testUserId = authData.user!.id;

    await supabase
      .from('profiles')
      .update({ name: 'Dispute Service Test User' })
      .eq('id', testUserId);

    await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await supabase.from('leagues').delete().eq('created_by', testUserId);
      await supabase.auth.signOut();
    }
  });

  describe('createDispute', () => {
    it('should create a dispute successfully', async () => {
      const league = await createTestLeague('Create Dispute League');
      const opponent = await createOpponent(`create-disp-svc-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      const disputeId = await firstValueFrom(
        service.createDispute({
          match_id: match.id,
          reason: 'Score was incorrect',
          proposed_scores: { [testUserId]: 8, [opponent.id]: 10 }
        })
      );

      expect(disputeId).toBeTruthy();

      // Verify dispute was created
      const { data: dispute } = await supabase
        .from('match_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      expect(dispute).toBeTruthy();
      expect(dispute!.match_id).toBe(match.id);
      expect(dispute!.disputed_by).toBe(testUserId);
      expect(dispute!.status).toBe('open');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('resolveDispute', () => {
    it('should resolve dispute by accepting', async () => {
      const league = await createTestLeague('Resolve Accept League');
      const opponent = await createOpponent(`resolve-accept-svc-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      const disputeId = await firstValueFrom(
        service.createDispute({
          match_id: match.id,
          reason: 'Score incorrect',
          proposed_scores: { [testUserId]: 7, [opponent.id]: 11 }
        })
      );

      const result = await firstValueFrom(
        service.resolveDispute({
          dispute_id: disputeId,
          resolution: 'accepted',
          resolution_notes: 'Agreed'
        })
      );

      expect(result).toBe(true);

      // Verify dispute is resolved
      const { data: dispute } = await supabase
        .from('match_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      expect(dispute!.status).toBe('resolved');
      expect(dispute!.resolution).toBe('accepted');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should resolve dispute by rejecting', async () => {
      const league = await createTestLeague('Resolve Reject League');
      const opponent = await createOpponent(`resolve-reject-svc-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      const disputeId = await firstValueFrom(
        service.createDispute({
          match_id: match.id,
          reason: 'Score wrong',
          proposed_scores: { [testUserId]: 20, [opponent.id]: 0 }
        })
      );

      const result = await firstValueFrom(
        service.resolveDispute({
          dispute_id: disputeId,
          resolution: 'rejected',
          resolution_notes: 'Original scores correct'
        })
      );

      expect(result).toBe(true);

      const { data: dispute } = await supabase
        .from('match_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      expect(dispute!.status).toBe('resolved');
      expect(dispute!.resolution).toBe('rejected');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('withdrawDispute', () => {
    it('should withdraw a dispute', async () => {
      const league = await createTestLeague('Withdraw Dispute League');
      const opponent = await createOpponent(`withdraw-disp-svc-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      const disputeId = await firstValueFrom(
        service.createDispute({
          match_id: match.id,
          reason: 'Mistake'
        })
      );

      const result = await firstValueFrom(service.withdrawDispute(disputeId));

      expect(result).toBe(true);

      const { data: dispute } = await supabase
        .from('match_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      expect(dispute!.status).toBe('withdrawn');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('getMatchDisputes', () => {
    it('should fetch disputes for a match with participant names', async () => {
      const league = await createTestLeague('Get Match Disputes League');
      const opponent = await createOpponent(`get-match-disp-svc-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      const disputeId = await firstValueFrom(
        service.createDispute({
          match_id: match.id,
          reason: 'Testing fetch'
        })
      );

      const disputes = await firstValueFrom(service.getMatchDisputes(match.id));

      expect(disputes.length).toBe(1);
      expect(disputes[0].id).toBe(disputeId);
      expect(disputes[0].disputed_by_name).toBe('Dispute Service Test User');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('getLeagueDisputes', () => {
    it('should fetch all open disputes for a league', async () => {
      const league = await createTestLeague('Get League Disputes League');
      const opponent = await createOpponent(`get-league-disp-svc-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match1 = await createTestMatch(league.id, opponent.id);
      const match2 = await createTestMatch(league.id, opponent.id);

      await firstValueFrom(service.createDispute({ match_id: match1.id, reason: 'Dispute 1' }));
      await firstValueFrom(service.createDispute({ match_id: match2.id, reason: 'Dispute 2' }));

      const disputes = await firstValueFrom(service.getLeagueDisputes(league.id));

      expect(disputes.length).toBe(2);
      expect(disputes[0].disputed_by_name).toBeTruthy();
      expect(disputes[0].match_details).toBeTruthy();

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('getDisputeById', () => {
    it('should fetch a single dispute with full details', async () => {
      const league = await createTestLeague('Get Dispute By ID League');
      const opponent = await createOpponent(`get-by-id-disp-svc-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      const disputeId = await firstValueFrom(
        service.createDispute({
          match_id: match.id,
          reason: 'Testing single fetch'
        })
      );

      const dispute = await firstValueFrom(service.getDisputeById(disputeId));

      expect(dispute.id).toBe(disputeId);
      expect(dispute.disputed_by_name).toBe('Dispute Service Test User');
      expect(dispute.match_details).toBeTruthy();
      expect(dispute.match_details!.participants.length).toBe(2);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });
});

