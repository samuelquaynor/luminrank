import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

/**
 * Integration tests for Dispute Database Operations
 * Tests database tables, functions, and RLS policies for Phase 4
 * 
 * Following best practices:
 * - Write integration tests FIRST before services
 * - Test database directly to verify schema and policies
 * - Create test user in beforeAll
 * - Each test creates its own league/match/dispute
 */
describe('Dispute Database Integration Tests', () => {
  let supabase: SupabaseClient;
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;

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

    // Add creator as member
    await supabase.from('league_members').insert({
      league_id: league.id,
      user_id: testUserId,
      role: 'creator',
      status: 'active'
    });

    return league;
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
    // Create match
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

    // Add participants
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
    supabase = createClient(
      'http://127.0.0.1:54321',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );

    const timestamp = Date.now();
    testUserEmail = `dispute-test-${timestamp}@example.com`;
    testUserPassword = 'TestPassword123!';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUserEmail,
      password: testUserPassword
    });

    if (authError || !authData.user) {
      throw new Error('Failed to create test user: ' + authError?.message);
    }

    testUserId = authData.user.id;

    await supabase
      .from('profiles')
      .update({ name: 'Dispute Test User' })
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

  describe('Match Disputes Table', () => {
    it('should create a dispute via function', async () => {
      const league = await createTestLeague('Dispute Test League');
      const opponent = await createOpponent(`dispute-opp-${Date.now()}@example.com`, 'Opponent');
      
      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      // Create dispute using function
      const { data: disputeId, error } = await supabase.rpc('create_match_dispute', {
        p_match_id: match.id,
        p_disputed_by: testUserId,
        p_reason: 'Wrong score recorded',
        p_proposed_scores: { [testUserId]: 8, [opponent.id]: 10 }
      });

      expect(error).toBeNull();
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

      // Verify match was updated
      const { data: updatedMatch } = await supabase
        .from('matches')
        .select('is_disputed, disputed_by')
        .eq('id', match.id)
        .single();

      expect(updatedMatch!.is_disputed).toBe(true);
      expect(updatedMatch!.disputed_by).toBe(testUserId);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should prevent dispute from non-participant', async () => {
      const league = await createTestLeague('Non-Participant Dispute League');
      const opponent = await createOpponent(`non-part-${Date.now()}@example.com`, 'Opponent');
      const thirdUser = await createOpponent(`third-user-${Date.now()}@example.com`, 'Third User');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      // Try to create dispute as third user (not a participant)
      const { error } = await supabase.rpc('create_match_dispute', {
        p_match_id: match.id,
        p_disputed_by: thirdUser.id,
        p_reason: 'I was not in this match'
      });

      expect(error).toBeTruthy();
      expect(error!.message).toContain('not a participant');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
      await supabase.from('profiles').delete().eq('id', thirdUser.id);
    });

    it('should prevent duplicate disputes for same match', async () => {
      const league = await createTestLeague('Duplicate Dispute League');
      const opponent = await createOpponent(`dup-disp-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      // Create first dispute
      await supabase.rpc('create_match_dispute', {
        p_match_id: match.id,
        p_disputed_by: testUserId,
        p_reason: 'First dispute'
      });

      // Try to create second dispute
      const { error } = await supabase.rpc('create_match_dispute', {
        p_match_id: match.id,
        p_disputed_by: testUserId,
        p_reason: 'Second dispute'
      });

      expect(error).toBeTruthy();
      expect(error!.message).toContain('already disputed');

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('Dispute Resolution', () => {
    it('should resolve dispute by accepting proposed scores', async () => {
      const league = await createTestLeague('Accept Dispute League');
      const opponent = await createOpponent(`accept-disp-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      // Create dispute
      const { data: disputeId } = await supabase.rpc('create_match_dispute', {
        p_match_id: match.id,
        p_disputed_by: testUserId,
        p_reason: 'Score was incorrect',
        p_proposed_scores: { [testUserId]: 8, [opponent.id]: 10 }
      });

      // Resolve by accepting
      const { data: resolved, error } = await supabase.rpc('resolve_match_dispute', {
        p_dispute_id: disputeId,
        p_resolved_by: opponent.id,
        p_resolution: 'accepted',
        p_resolution_notes: 'Scores corrected'
      });

      expect(error).toBeNull();
      expect(resolved).toBe(true);

      // Verify dispute is resolved
      const { data: dispute } = await supabase
        .from('match_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      expect(dispute!.status).toBe('resolved');
      expect(dispute!.resolution).toBe('accepted');

      // Verify match is no longer disputed
      const { data: updatedMatch } = await supabase
        .from('matches')
        .select('is_disputed')
        .eq('id', match.id)
        .single();

      expect(updatedMatch!.is_disputed).toBe(false);

      // Verify scores were updated
      const { data: participants } = await supabase
        .from('match_participants')
        .select('profile_id, score')
        .eq('match_id', match.id);

      const testUserParticipant = participants!.find(p => p.profile_id === testUserId);
      const opponentParticipant = participants!.find(p => p.profile_id === opponent.id);

      expect(testUserParticipant!.score).toBe(8);
      expect(opponentParticipant!.score).toBe(10);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should resolve dispute by rejecting (keep original scores)', async () => {
      const league = await createTestLeague('Reject Dispute League');
      const opponent = await createOpponent(`reject-disp-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      // Get original scores
      const { data: originalParticipants } = await supabase
        .from('match_participants')
        .select('profile_id, score')
        .eq('match_id', match.id);

      // Create dispute
      const { data: disputeId } = await supabase.rpc('create_match_dispute', {
        p_match_id: match.id,
        p_disputed_by: testUserId,
        p_reason: 'Scores incorrect',
        p_proposed_scores: { [testUserId]: 20, [opponent.id]: 0 }
      });

      // Resolve by rejecting
      await supabase.rpc('resolve_match_dispute', {
        p_dispute_id: disputeId,
        p_resolved_by: opponent.id,
        p_resolution: 'rejected',
        p_resolution_notes: 'Original scores are correct'
      });

      // Verify scores remained unchanged
      const { data: finalParticipants } = await supabase
        .from('match_participants')
        .select('profile_id, score')
        .eq('match_id', match.id);

      expect(finalParticipants).toEqual(originalParticipants);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should withdraw a dispute', async () => {
      const league = await createTestLeague('Withdraw Dispute League');
      const opponent = await createOpponent(`withdraw-disp-${Date.now()}@example.com`, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      // Create dispute
      const { data: disputeId } = await supabase.rpc('create_match_dispute', {
        p_match_id: match.id,
        p_disputed_by: testUserId,
        p_reason: 'Never mind, scores are correct'
      });

      // Withdraw dispute
      const { data: withdrawn, error } = await supabase.rpc('withdraw_match_dispute', {
        p_dispute_id: disputeId,
        p_user_id: testUserId
      });

      expect(error).toBeNull();
      expect(withdrawn).toBe(true);

      // Verify dispute is withdrawn
      const { data: dispute } = await supabase
        .from('match_disputes')
        .select('status')
        .eq('id', disputeId)
        .single();

      expect(dispute!.status).toBe('withdrawn');

      // Verify match is no longer disputed
      const { data: updatedMatch } = await supabase
        .from('matches')
        .select('is_disputed')
        .eq('id', match.id)
        .single();

      expect(updatedMatch!.is_disputed).toBe(false);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });
  });

  describe('RLS Policies', () => {
    it('should allow match participants to view disputes', async () => {
      const league = await createTestLeague('RLS View Dispute League');
      const timestamp = Date.now();
      const opponentEmail = `rls-view-${timestamp}@example.com`;
      const opponent = await createOpponent(opponentEmail, 'Opponent');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      // Create dispute as test user
      const { data: disputeId } = await supabase.rpc('create_match_dispute', {
        p_match_id: match.id,
        p_disputed_by: testUserId,
        p_reason: 'Testing RLS'
      });

      // Verify test user can view it
      const { data: dispute1 } = await supabase
        .from('match_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      expect(dispute1).toBeTruthy();

      // Sign in as opponent
      await supabase.auth.signInWithPassword({
        email: opponentEmail,
        password: 'TestPassword123!'
      });

      // Verify opponent can also view it (they're a participant)
      const { data: dispute2 } = await supabase
        .from('match_disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      expect(dispute2).toBeTruthy();

      // Cleanup
      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword
      });
      await supabase.from('profiles').delete().eq('id', opponent.id);
    });

    it('should prevent non-participants from viewing disputes', async () => {
      const league = await createTestLeague('RLS Non-Participant Dispute League');
      const timestamp = Date.now();
      const opponentEmail = `rls-non-part-${timestamp}@example.com`;
      const thirdUserEmail = `rls-third-${timestamp}@example.com`;
      
      const opponent = await createOpponent(opponentEmail, 'Opponent');
      const thirdUser = await createOpponent(thirdUserEmail, 'Third User');

      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: opponent.id,
        role: 'member',
        status: 'active'
      });

      const match = await createTestMatch(league.id, opponent.id);

      // Create dispute as test user
      const { data: disputeId } = await supabase.rpc('create_match_dispute', {
        p_match_id: match.id,
        p_disputed_by: testUserId,
        p_reason: 'RLS test'
      });

      // Sign in as third user (not a participant in this match)
      await supabase.auth.signInWithPassword({
        email: thirdUserEmail,
        password: 'TestPassword123!'
      });

      // Try to view dispute (should return nothing due to RLS)
      const { data: disputes, error: selectError } = await supabase
        .from('match_disputes')
        .select('*')
        .eq('id', disputeId);

      // Third user should not see any disputes
      expect(disputes).toEqual([]);

      // Cleanup - sign back in as test user
      await supabase.auth.signInWithPassword({
        email: testUserEmail,
        password: testUserPassword
      });
      await supabase.from('profiles').delete().eq('id', opponent.id);
      await supabase.from('profiles').delete().eq('id', thirdUser.id);
    });
  });
});

