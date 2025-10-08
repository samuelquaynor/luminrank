# LuminRank Backend Logic Implementation

## Overview

Build all backend logic and business rules for the league management system. Focus on database schema, constraints, triggers, functions, and service layer implementation. No UI work until logic is solid and tested.

## Database Schema

### Tables and Constraints

**leagues table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- name (text, not null)
- description (text)
- created_by (uuid, references profiles(id), not null)
- game_type (text, not null)
- status (text, not null, default 'draft', check in ('draft', 'active', 'completed', 'archived'))
- start_date (timestamp with time zone)
- end_date (timestamp with time zone)
- invite_code (text, unique, not null) -- auto-generated on insert
- is_private (boolean, default false)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
- check: end_date is null or end_date > start_date
```

**league_settings table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- league_id (uuid, references leagues(id) on delete cascade, unique, not null)
- scoring_system (text, default 'points', check in ('win_loss', 'points', 'elo'))
- points_per_win (integer, default 3, check > 0)
- points_per_draw (integer, default 1, check >= 0)
- points_per_loss (integer, default 0, check >= 0)
- allow_draws (boolean, default false)
- allow_adhoc_matches (boolean, default true)
- match_confirmation_required (boolean, default false)
- result_submission_window_hours (integer, default 48, check > 0)
- late_submission_allowed (boolean, default false)
- default_match_frequency_days (integer, default 7, check > 0)
- auto_forfeit_enabled (boolean, default true)
- forfeit_penalty_points (integer, default -1)
- use_match_legs (boolean, default false) -- enable multi-leg matches
- default_legs_count (integer, default 1, check > 0) -- e.g., best of 3 = 3 legs
- legs_to_win (integer, default 1, check > 0) -- e.g., best of 3 = 2 to win
- min_players_per_match (integer, default 2)
- max_players_per_match (integer, default 2)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
- check: legs_to_win <= default_legs_count
- check: (legs_to_win * 2 - 1) <= default_legs_count -- ensures valid best-of format
```

**league_members table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- league_id (uuid, references leagues(id) on delete cascade, not null)
- user_id (uuid, references profiles(id) on delete cascade, not null)
- joined_at (timestamp with time zone, default now())
- status (text, default 'active', check in ('active', 'left', 'removed'))
- role (text, default 'member', check in ('creator', 'admin', 'member'))
- created_at (timestamp with time zone, default now())
- unique (league_id, user_id)
```

**league_invites table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- league_id (uuid, references leagues(id) on delete cascade, not null)
- invited_by (uuid, references profiles(id), not null)
- invited_email (text, not null)
- invited_user_id (uuid, references profiles(id), nullable)
- status (text, default 'pending', check in ('pending', 'accepted', 'declined', 'expired'))
- expires_at (timestamp with time zone, not null)
- created_at (timestamp with time zone, default now())
```

**seasons table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- league_id (uuid, references leagues(id) on delete cascade, not null)
- name (text, not null)
- start_date (timestamp with time zone, not null)
- end_date (timestamp with time zone)
- status (text, default 'upcoming', check in ('upcoming', 'active', 'completed'))
- is_current (boolean, default false)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
- check: end_date is null or end_date > start_date
- unique (league_id, is_current) where is_current = true
```

**fixtures table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- league_id (uuid, references leagues(id) on delete cascade, not null)
- season_id (uuid, references seasons(id) on delete cascade, nullable)
- home_player_id (uuid, references profiles(id), not null)
- away_player_id (uuid, references profiles(id), not null)
- scheduled_date (timestamp with time zone, not null)
- submission_deadline (timestamp with time zone, not null) -- calculated on insert
- match_id (uuid, references matches(id), nullable)
- status (text, default 'scheduled', check in ('scheduled', 'completed', 'overdue', 'forfeited', 'cancelled'))
- forfeited_by (uuid, references profiles(id), nullable)
- round_number (integer)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
- check: home_player_id != away_player_id
```

**matches table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- league_id (uuid, references leagues(id) on delete cascade, not null)
- season_id (uuid, references seasons(id) on delete cascade, nullable)
- fixture_id (uuid, references fixtures(id), nullable)
- recorded_by (uuid, references profiles(id), not null)
- match_date (timestamp with time zone, not null)
- status (text, default 'pending', check in ('pending', 'in_progress', 'confirmed', 'disputed', 'forfeited'))
- dispute_reason (text)
- disputed_by (uuid, references profiles(id))
- disputed_at (timestamp with time zone)
- is_adhoc (boolean, default false) -- true if not from fixture
- has_legs (boolean, default false) -- true if match uses leg system
- total_legs (integer, default 1) -- total number of legs (e.g., 3 for best of 3)
- legs_to_win (integer, default 1) -- legs needed to win (e.g., 2 for best of 3)
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
- check: legs_to_win <= total_legs
```

**match_participants table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- match_id (uuid, references matches(id) on delete cascade, not null)
- user_id (uuid, references profiles(id), not null)
- legs_won (integer, default 0, check >= 0) -- total legs won in this match
- overall_result (text, check in ('win', 'loss', 'draw', 'forfeit_win', 'forfeit_loss', 'in_progress'))
- created_at (timestamp with time zone, default now())
- updated_at (timestamp with time zone, default now())
- unique (match_id, user_id)
```

**match_legs table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- match_id (uuid, references matches(id) on delete cascade, not null)
- leg_number (integer, not null, check > 0)
- winner_id (uuid, references profiles(id), nullable) -- null if not yet played/draw
- status (text, default 'pending', check in ('pending', 'completed', 'forfeited'))
- played_at (timestamp with time zone)
- created_at (timestamp with time zone, default now())
- unique (match_id, leg_number)
```

**match_leg_participants table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- leg_id (uuid, references match_legs(id) on delete cascade, not null)
- user_id (uuid, references profiles(id), not null)
- score (integer, check >= 0)
- result (text, check in ('win', 'loss', 'draw', 'forfeit'))
- created_at (timestamp with time zone, default now())
- unique (leg_id, user_id)
```

**match_disputes table:**

```sql
- id (uuid, primary key, default uuid_generate_v4())
- match_id (uuid, references matches(id) on delete cascade, not null)
- disputed_by (uuid, references profiles(id), not null)
- reason (text, not null)
- proposed_scores (jsonb) -- {user_id: score} or {leg_id: {user_id: score}}
- status (text, default 'open', check in ('open', 'resolved', 'withdrawn'))
- resolution (text, check in ('accepted', 'rejected', 'modified'))
- resolved_by (uuid, references profiles(id))
- resolved_at (timestamp with time zone)
- created_at (timestamp with time zone, default now())
```

## Business Logic Implementation

### 1. League Lifecycle Logic

**Where: Database Trigger + Service Layer**

**Trigger: `on_league_created`**

```sql
-- Automatically create league_settings with defaults
-- Generate unique invite_code (format: LMNR-XXXXXX)
-- Add creator as league_member with role='creator'
```

**Trigger: `on_league_status_change`**

```sql
-- When status changes to 'active':
  -- Validate: start_date is set
  -- Validate: at least 2 members
-- When status changes to 'completed':
  -- End current season if exists
  -- Mark all overdue fixtures as 'cancelled'
```

**Service: `league.service.ts`**

```typescript
validateLeagueStart(leagueId): checks member count, date validity
activateLeague(leagueId): changes status to 'active', starts first season
completeLeague(leagueId): changes status to 'completed', archives data
```

### 2. Fixture Generation Logic

**Where: Service Layer (complex algorithm)**

**Service: `fixture.service.ts`**

```typescript
generateRoundRobinFixtures(leagueId, seasonId, options):
  Input:
    - leagueId: which league
    - seasonId: which season (optional)
    - options: {
        startDate: when fixtures begin
        matchFrequencyDays: days between rounds
        includeReturnFixtures: boolean (home/away)
      }
  
  Algorithm:
    1. Get all active league members
    2. Validate: at least 2 members
    3. Calculate rounds: N-1 (or 2(N-1) for return fixtures)
    4. For each round:
       - Pair players using round-robin algorithm
       - Calculate scheduled_date = startDate + (round * matchFrequencyDays)
       - Calculate submission_deadline = scheduled_date + submission_window_hours
       - Insert fixture
    5. Return all created fixtures
  
  Round-Robin Pairing Algorithm:
    - For N players (if odd, add "bye")
    - Fix player 1, rotate others clockwise
    - Round 1: 1-2, 3-8, 4-7, 5-6
    - Round 2: 1-3, 2-4, 8-5, 6-7
    - Continue for N-1 rounds
```

### 3. Submission Window Logic

**Where: Database Function + Service Layer**

**Function: `check_submission_window(fixture_id, current_time)`**

```sql
-- Returns: 'before_window' | 'within_window' | 'after_window' | 'overdue'
-- Logic:
  -- If current_time < scheduled_date: 'before_window'
  -- If scheduled_date <= current_time <= submission_deadline: 'within_window'
  -- If current_time > submission_deadline AND late_submission_allowed: 'after_window'
  -- If current_time > submission_deadline AND NOT late_submission_allowed: 'overdue'
```

**Service: `match.service.ts`**

```typescript
recordMatchForFixture(fixtureId, scores):
  1. Get fixture and league_settings
  2. Check submission window status
  3. If 'before_window': throw error "Match hasn't started yet"
  4. If 'overdue': throw error "Submission deadline passed"
  5. If 'after_window': allow but flag as late
  6. Validate scores and participants
  7. Create match record
  8. Update fixture status to 'completed'
  9. Link match_id to fixture
```

### 4. Forfeit Logic

**Where: Database Trigger + Scheduled Job**

**Trigger: `on_fixture_overdue`**

```sql
-- Runs when submission_deadline passes
-- If auto_forfeit_enabled = true:
  -- Check if any participant submitted result
  -- If neither submitted: both forfeit (or mark as cancelled)
  -- If one submitted: other player forfeits
  -- Create forfeit match record
  -- Update fixture status to 'forfeited'
```

**Service: `forfeit.service.ts`**

```typescript
manualForfeit(fixtureId, forfeitingUserId):
  1. Validate: user is participant in fixture
  2. Validate: fixture is not completed
  3. Create match with status='forfeited'
  4. Set forfeiting player result='forfeit_loss'
  5. Set opponent result='forfeit_win'
  6. Apply forfeit penalty points (if configured)
  7. Update fixture status to 'forfeited'
  8. Update leaderboard

autoForfeitOverdueFixtures():
  1. Find all fixtures where:
     - status = 'overdue'
     - submission_deadline < now()
     - auto_forfeit_enabled = true
  2. For each fixture:
     - Determine who didn't submit (both or one)
     - Create forfeit match
     - Update standings
```

### 5. Match Confirmation Logic

**Where: Service Layer**

**Service: `match.service.ts`**

```typescript
recordMatch(data):
  1. Create match with status='pending' (if confirmation required)
  2. Create match_participants records
  3. Notify opponent to confirm
  4. Return match

confirmMatch(matchId, confirmingUserId):
  1. Validate: user is participant
  2. Validate: match status is 'pending'
  3. Update status to 'confirmed'
  4. Update leaderboard
  5. Update fixture status if linked

disputeMatch(matchId, disputingUserId, reason, proposedScores):
  1. Validate: user is participant
  2. Create match_dispute record
  3. Update match status to 'disputed'
  4. Remove match from leaderboard calculations
  5. Notify other participant
```

### 6. Dispute Resolution Logic

**Where: Service Layer**

**Service: `dispute.service.ts`**

```typescript
resolveDispute(disputeId, resolution, newScores?):
  Resolutions:
    - 'accepted': Accept proposed scores
      1. Update match_participants with proposed scores
      2. Recalculate results (win/loss/draw)
      3. Update match status to 'confirmed'
      4. Update leaderboard
    
    - 'rejected': Reject proposed scores
      1. Keep original scores
      2. Update match status to 'confirmed'
      3. Update leaderboard
    
    - 'modified': Both agree on new scores
      1. Update match_participants with new scores
      2. Update match status to 'confirmed'
      3. Update leaderboard
  
  4. Update dispute status to 'resolved'
  5. Notify all participants
```

### 7. Leaderboard Calculation Logic

**Where: Database Function (for performance)**

**Function: `calculate_league_standings(league_id, season_id?)`**

```sql
-- Returns table of: user_id, rank, played, won, lost, drawn, points, form
-- Logic:
  1. Get all confirmed matches for league/season
  2. Exclude disputed matches
  3. For each user:
     - Count matches played
     - Count wins, losses, draws
     - Calculate points based on scoring_system:
       * win_loss: wins only
       * points: (wins * points_per_win) + (draws * points_per_draw) + (losses * points_per_loss)
       * elo: calculate ELO rating
     - Calculate form (last 5 matches: W/L/D)
  4. Sort by: points DESC, wins DESC, head-to-head
  5. Assign ranks
  6. Return standings
```

**Service: `leaderboard.service.ts`**

```typescript
getLeagueStandings(leagueId, seasonId?):
  1. Call database function calculate_league_standings
  2. Enrich with user profile data (name, avatar)
  3. Return standings

subscribeToLeagueUpdates(leagueId):
  1. Subscribe to Supabase realtime on matches table
  2. Filter: league_id = leagueId AND status = 'confirmed'
  3. On change: reload standings
  4. Emit updated standings to subscribers
```

### 8. Season Management Logic

**Where: Service Layer + Database Trigger**

**Trigger: `on_season_status_change`**

```sql
-- When season becomes 'active':
  -- Set is_current = true
  -- Set all other seasons is_current = false
  -- Update league status to 'active' if not already

-- When season becomes 'completed':
  -- Set is_current = false
  -- Archive standings (create snapshot)
```

**Service: `season.service.ts`**

```typescript
createSeason(leagueId, data):
  1. Validate: league exists and user is creator/admin
  2. Create season with status='upcoming'
  3. Return season

startSeason(seasonId):
  1. Update status to 'active'
  2. Set is_current = true
  3. Generate fixtures if requested
  4. Return season

endSeason(seasonId):
  1. Validate: all fixtures completed or cancelled
  2. Calculate final standings
  3. Create season_archive record (snapshot)
  4. Update status to 'completed'
  5. Set is_current = false
```

### 9. Non-Participation Handling

**Where: Service Layer + Database Trigger**

**Scenarios:**

**A. Player doesn't submit result (fixture-based):**

- After submission_deadline passes → fixture becomes 'overdue'
- If auto_forfeit_enabled → player forfeits (opponent wins)
- If not enabled → requires admin intervention

**B. Player leaves league mid-season:**

```typescript
handlePlayerLeaving(leagueId, userId):
  1. Update league_member status to 'left'
  2. Find all scheduled fixtures involving user
  3. For each fixture:
     - If not started: cancel fixture
     - If in progress: mark as forfeited by leaving player
  4. Recalculate standings
```

**C. Player inactive (multiple missed fixtures):**

```typescript
checkPlayerActivity(leagueId, userId):
  1. Count consecutive forfeits
  2. If > threshold (e.g., 3):
     - Flag player as inactive
     - Notify league admin
     - Option to remove from league
```

### 10. Match Frequency Enforcement

**Where: Service Layer**

**Service: `fixture.service.ts`**

```typescript
validateFixtureSchedule(leagueId, scheduledDate):
  1. Get league settings (default_match_frequency_days)
  2. Get user's recent fixtures
  3. Check: no other fixture within frequency window
  4. If conflict: suggest next available date
  5. Return validation result

enforceMatchFrequency(leagueId):
  // When generating fixtures
  1. Get match_frequency_days from settings
  2. Distribute fixtures evenly across season
  3. Ensure each player has frequency_days between matches
  4. Handle odd number of players (byes)
```

### 11. Match Legs Logic

**Where: Service Layer + Database Trigger**

**When match uses legs (use_match_legs = true):**

**Service: `match-legs.service.ts`**

```typescript
createMatchWithLegs(matchData, legsCount, legsToWin):
  1. Create match record with:
     - has_legs = true
     - total_legs = legsCount
     - legs_to_win = legsToWin
     - status = 'in_progress'
  2. Create match_participants for each player (legs_won = 0)
  3. Create match_legs records (leg 1 to legsCount, all status='pending')
  4. Return match

recordLegResult(legId, participants):
  // participants = [{user_id, score, result}]
  1. Validate: leg exists and status='pending'
  2. Get match and validate status='in_progress'
  3. For each participant:
     - Insert match_leg_participants record
  4. Determine leg winner from results
  5. Update match_leg:
     - winner_id = winner's user_id
     - status = 'completed'
     - played_at = now()
  6. Update match_participants.legs_won for winner
  7. Check if match is complete (call checkMatchCompletion)
  8. Return updated leg

checkMatchCompletion(matchId):
  1. Get match (total_legs, legs_to_win)
  2. Get match_participants with legs_won counts
  3. Check if any player has legs_won >= legs_to_win:
     - YES: Match complete
       - Set that player's overall_result = 'win'
       - Set opponent's overall_result = 'loss'
       - Update match status = 'confirmed' (or 'pending' if confirmation required)
       - Update fixture status if linked
       - Update leaderboard
     - NO: Match continues
       - Keep match status = 'in_progress'
  4. Return match completion status

getMatchProgress(matchId):
  1. Get match with legs info
  2. Get all match_legs with results
  3. Get match_participants with legs_won
  4. Return:
     - Current score (Player A: X legs, Player B: Y legs)
     - Completed legs with results
     - Pending legs
     - Match status
```

**Trigger: `on_leg_completed`**

```sql
-- Runs after match_leg status changes to 'completed'
-- 1. Update match_participants.legs_won for winner
-- 2. Check if any player reached legs_to_win
-- 3. If yes: update match status and overall_result
-- 4. If match confirmed: trigger leaderboard recalculation
```

**Database Function: `calculate_match_winner_from_legs(match_id)`**

```sql
-- Returns: winner_user_id or NULL if match not complete
-- Logic:
  1. Get match (legs_to_win)
  2. Count completed legs per player
  3. If any player has legs >= legs_to_win:
     - Return that player's user_id
  4. Else:
     - Return NULL (match in progress)
```

**Example Flow (Best of 3):**

```
Match created: total_legs=3, legs_to_win=2
Initial state: Player A: 0, Player B: 0

Leg 1 completed: Player A wins
State: Player A: 1, Player B: 0
Status: in_progress

Leg 2 completed: Player A wins
State: Player A: 2, Player B: 0
Status: confirmed (Player A wins match)
Leg 3: Not needed (match already decided)

OR

Leg 1: Player A wins (A:1, B:0)
Leg 2: Player B wins (A:1, B:1)
Leg 3: Player A wins (A:2, B:1)
Status: confirmed (Player A wins match)
```

**Handling Forfeits with Legs:**

```typescript
forfeitMatchWithLegs(matchId, forfeitingUserId):
  1. Get match and current leg progress
  2. Mark all pending legs as 'forfeited'
  3. Award all remaining legs to opponent
  4. Update match_participants:
     - Forfeiting player: overall_result = 'forfeit_loss'
     - Opponent: overall_result = 'forfeit_win'
  5. Update match status = 'forfeited'
  6. Apply forfeit penalty
  7. Update leaderboard
```

**Disputing Legs:**

```typescript
disputeLeg(legId, disputingUserId, reason):
  1. Validate: user participated in this leg
  2. Create match_dispute linked to match (not leg directly)
  3. Reference specific leg_number in dispute
  4. Match status = 'disputed'
  5. Pause match (can't record more legs until resolved)

resolveLegDispute(disputeId, resolution):
  1. If 'accepted': update leg results
  2. Recalculate legs_won for participants
  3. Check if match completion status changed
  4. Update match status = 'in_progress' or 'confirmed'
  5. Allow recording of next legs if match continues
```

## Database Functions & Triggers Summary

**Functions:**

1. `generate_invite_code()` - Creates unique LMNR-XXXXXX codes
2. `calculate_submission_deadline(scheduled_date, window_hours)` - Calculates deadline
3. `check_submission_window(fixture_id)` - Returns window status
4. `calculate_league_standings(league_id, season_id)` - Computes leaderboard
5. `determine_match_result(scores)` - Determines win/loss/draw from scores
6. `apply_forfeit_penalty(user_id, league_id, penalty_points)` - Applies penalty
7. `validate_league_activation(league_id)` - Checks if league can start
8. `calculate_match_winner_from_legs(match_id)` - Determines match winner from leg results

**Triggers:**

1. `on_league_created` - Auto-create settings, add creator as member
2. `on_league_status_change` - Validate and cascade status changes
3. `on_fixture_created` - Calculate submission_deadline
4. `on_fixture_overdue` - Auto-forfeit if enabled
5. `on_match_confirmed` - Update fixture status, recalculate standings
6. `on_season_status_change` - Manage is_current flag
7. `on_member_left` - Handle player leaving (cancel/forfeit fixtures)
8. `on_leg_completed` - Update match status when leg completes, check match winner

## Service Layer Architecture

**Core Services:**

1. `league.service.ts` - League CRUD, activation, completion
2. `league-settings.service.ts` - Settings management
3. `member.service.ts` - Member management, roles
4. `invite.service.ts` - Invite generation, acceptance
5. `season.service.ts` - Season lifecycle
6. `fixture.service.ts` - Fixture generation, scheduling
7. `match.service.ts` - Match recording, confirmation
8. `match-legs.service.ts` - Leg recording, match winner calculation
9. `forfeit.service.ts` - Forfeit handling (manual + auto)
10. `dispute.service.ts` - Dispute creation, resolution
11. `leaderboard.service.ts` - Standings calculation, real-time updates

**Service Responsibilities:**

- **Database operations** → Services call Supabase
- **Complex algorithms** → Services (round-robin, ELO, leg winner calculation)
- **Business validation** → Services (submission windows, eligibility)
- **Side effects** → NgRx Effects (notifications, real-time)

## Testing Strategy

**Unit Tests (Services):**

- Test each service method in isolation
- Mock Supabase client
- Test business logic edge cases:
  - Odd number of players in round-robin
  - Submission window boundaries
  - Forfeit scenarios
  - Dispute resolution outcomes
  - Leaderboard tie-breaking
  - Match legs winner calculation
  - Best-of-X scenarios

**Database Tests:**

- Test triggers fire correctly
- Test constraints prevent invalid data
- Test RLS policies enforce security
- Test functions return correct results
- Test leg completion triggers match winner calculation

**Integration Tests:**

- Test complete flows:
  - Create league → add members → generate fixtures → record matches → view standings
  - Fixture overdue → auto-forfeit → standings update
  - Match disputed → resolved → standings update
  - Season end → new season → fixtures regenerated
  - Multi-leg match → record legs → automatic winner determination

## Implementation Phases

See [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md) for detailed breakdown of the 8 implementation phases.

**Quick Summary:**
- **Phase 1 + 2 = MVP** (Core league management + match recording)
- **Phase 3** = Fixtures & scheduling (most complex)
- **Phase 4 & 5** = Disputes & forfeits (can parallelize)
- **Phase 6** = Match legs (optional)
- **Phase 7 & 8** = Real-time & UI polish

## Implementation Order (Backend First)

1. **Database Migration** - All tables, constraints, indexes
2. **Database Functions** - All helper functions
3. **Database Triggers** - All automated logic
4. **RLS Policies** - Security rules
5. **TypeScript Models** - All interfaces
6. **Core Services** - League, Member, Settings
7. **Fixture Service** - Round-robin algorithm
8. **Match Service** - Recording, confirmation
9. **Match Legs Service** - Leg recording, winner calculation
10. **Forfeit Service** - Manual and auto-forfeit
11. **Dispute Service** - Dispute resolution
12. **Leaderboard Service** - Standings calculation
13. **Season Service** - Season lifecycle
14. **NgRx Store** - Actions, reducers, effects, selectors
15. **Service Unit Tests** - Test all business logic
16. **Database Tests** - Test triggers and functions
17. **Integration Tests** - Test complete flows
18. **Real-time Subscriptions** - Supabase realtime setup
19. **Performance Optimization** - Indexes, query optimization

## Key Decision Points

**1. Where to implement forfeit logic?**

- **Database Trigger**: Auto-forfeit when deadline passes
- **Scheduled Job**: Check overdue fixtures periodically
- **Decision**: Use scheduled job (more control, easier to test)

**2. Where to calculate leaderboard?**

- **Database Function**: Fast, can use SQL aggregations
- **Service Layer**: More flexible, easier to modify
- **Decision**: Database function for calculation, service for enrichment

**3. Where to validate submission windows?**

- **Database Constraint**: Enforce at data level
- **Service Layer**: More flexible error messages
- **Decision**: Both - constraint for safety, service for UX

**4. Where to handle disputes?**

- **Service Layer**: Complex state machine
- **Database Trigger**: Simple status updates
- **Decision**: Service layer (too complex for triggers)

**5. Where to calculate match winner from legs?**

- **Database Trigger**: Automatic on leg completion
- **Service Layer**: More control over logic
- **Decision**: Trigger for automatic updates, service for manual checks
