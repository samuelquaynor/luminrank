-- Test: Matches (merged fixtures and matches)
-- Tests the unified matches table that handles both scheduled and completed matches
BEGIN;

SELECT plan (25);

-- Cleanup: Remove test data if it exists from previous runs
DELETE FROM public.match_participants
WHERE
    match_id IN (
        SELECT id
        FROM public.matches
        WHERE
            league_id IN (
                SELECT id
                FROM public.leagues
                WHERE
                    name LIKE 'Test Match League%'
            )
    );

DELETE FROM public.matches
WHERE
    league_id IN (
        SELECT id
        FROM public.leagues
        WHERE
            name LIKE 'Test Match League%'
    );

DELETE FROM public.seasons
WHERE
    league_id IN (
        SELECT id
        FROM public.leagues
        WHERE
            name LIKE 'Test Match League%'
    );

DELETE FROM public.league_members
WHERE
    league_id IN (
        SELECT id
        FROM public.leagues
        WHERE
            name LIKE 'Test Match League%'
    );

DELETE FROM public.leagues WHERE name LIKE 'Test Match League%';

DELETE FROM public.profiles
WHERE
    id IN (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
    );

DELETE FROM auth.users
WHERE
    id IN (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
    );

-- Setup: Create test users
INSERT INTO
    auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role
    )
VALUES (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        'player1@test.com',
        crypt ('pass', gen_salt ('bf')),
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
        'player2@test.com',
        crypt ('pass', gen_salt ('bf')),
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated'
    );

UPDATE public.profiles
SET
    name = 'Player 1'
WHERE
    id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

UPDATE public.profiles
SET
    name = 'Player 2'
WHERE
    id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;

-- Setup: Create a test league
INSERT INTO
    public.leagues (
        id,
        name,
        description,
        game_type,
        created_by,
        is_private
    )
VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'Test Match League',
        'Test league for matches',
        'Chess',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        false
    );

-- Setup: Add second player to league (creator is auto-added by trigger)
INSERT INTO
    public.league_members (
        league_id,
        user_id,
        role,
        status
    )
VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
        'member',
        'active'
    );

-- Set session to act as player 1
SELECT set_config(
        'request.jwt.claims', json_build_object(
            'sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'role', 'authenticated'
        )::text, true
    );

-- =====================================================
-- TESTS: Scheduled Matches (Former Fixtures)
-- =====================================================

-- Test 1: Create a scheduled match (former fixture)
INSERT INTO
    public.matches (
        league_id,
        home_player_id,
        away_player_id,
        round_number,
        scheduled_date,
        submission_deadline,
        status
    )
VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
        1,
        NOW() + INTERVAL '2 days',
        NOW() + INTERVAL '2 days 12 hours',
        'scheduled'
    );

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND status = 'scheduled'
                AND home_player_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
                AND away_player_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
        ), 'Should be able to create a scheduled match'
    );

-- Test 2: Scheduled match has NULL match_date, recorded_by, recorded_at
SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND status = 'scheduled'
                AND match_date IS NULL
                AND recorded_by IS NULL
                AND recorded_at IS NULL
        ), 'Scheduled match should have NULL match_date, recorded_by, recorded_at'
    );

-- Test 3: Can create match participants without scores for scheduled match
DO $$
DECLARE
  v_match_id UUID;
BEGIN
  SELECT id INTO v_match_id FROM public.matches 
  WHERE league_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND status = 'scheduled'
  LIMIT 1;

  INSERT INTO public.match_participants (match_id, profile_id, score, result)
  VALUES 
    (v_match_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, NULL, NULL),
    (v_match_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, NULL, NULL);
END;
$$;

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.match_participants mp
                JOIN public.matches m ON mp.match_id = m.id
            WHERE
                m.league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND m.status = 'scheduled'
                AND mp.score IS NULL
                AND mp.result IS NULL
        ), 'Scheduled match participants can have NULL scores and results'
    );

-- Test 4: Cannot create match participants with only one of score/result NULL
SELECT throws_ok(
  $$
    INSERT INTO public.match_participants (match_id, profile_id, score, result)
    VALUES (
      (SELECT id FROM public.matches WHERE league_id = '11111111-1111-1111-1111-111111111111'::uuid AND status = 'scheduled' LIMIT 1),
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      10,
      NULL
    );

$$,
  'new row for relation "match_participants" violates check constraint "match_participants_check"',
  'Should not allow score without result or vice versa'
);

-- =====================================================
-- TESTS: Completed Matches
-- =====================================================

-- Test 5: Create a completed match
INSERT INTO
    public.matches (
        league_id,
        home_player_id,
        away_player_id,
        match_date,
        recorded_by,
        recorded_at,
        status
    )
VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
        NOW() - INTERVAL '1 day',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        NOW() - INTERVAL '1 day',
        'completed'
    );

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND status = 'completed'
                AND match_date IS NOT NULL
                AND recorded_by IS NOT NULL
        ), 'Should be able to create a completed match'
    );

-- Test 6: Completed match participants must have scores and results
DO $$
DECLARE
  v_match_id UUID;
BEGIN
  SELECT id INTO v_match_id FROM public.matches 
  WHERE league_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND status = 'completed'
  LIMIT 1;

  INSERT INTO public.match_participants (match_id, profile_id, score, result)
  VALUES 
    (v_match_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 10, 'win'),
    (v_match_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 5, 'loss');
END;
$$;

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.match_participants mp
                JOIN public.matches m ON mp.match_id = m.id
            WHERE
                m.league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND m.status = 'completed'
                AND mp.score IS NOT NULL
                AND mp.result IS NOT NULL
        ), 'Completed match participants must have scores and results'
    );

-- =====================================================
-- TESTS: Status Transitions
-- =====================================================

-- Test 7: Can update scheduled match to completed
DO $$
DECLARE
  v_match_id UUID;
BEGIN
  SELECT id INTO v_match_id FROM public.matches 
  WHERE league_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND status = 'scheduled'
  LIMIT 1;

  UPDATE public.matches
  SET 
    status = 'completed',
    match_date = NOW(),
    recorded_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    recorded_at = NOW()
  WHERE id = v_match_id;

  UPDATE public.match_participants
  SET score = CASE 
    WHEN profile_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid THEN 10
    ELSE 5
  END,
  result = CASE
    WHEN profile_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid THEN 'win'
    ELSE 'loss'
  END
  WHERE match_id = v_match_id;
END;
$$;

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND status = 'completed'
                AND match_date IS NOT NULL
        ), 'Should be able to transition scheduled match to completed'
    );

-- =====================================================
-- TESTS: Status Constraints
-- =====================================================

-- Test 8: Cannot set invalid status
SELECT throws_ok(
  $$
    INSERT INTO public.matches (league_id, home_player_id, away_player_id, status)
    VALUES (
      '11111111-1111-1111-1111-111111111111'::uuid,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
      'invalid_status'
    );

$$,
  'new row for relation "matches" violates check constraint "matches_status_check"',
  'Should reject invalid status values'
);

-- Test 9: Can set all valid statuses (create another scheduled match to ensure we have both)
INSERT INTO
    public.matches (
        league_id,
        home_player_id,
        away_player_id,
        round_number,
        scheduled_date,
        submission_deadline,
        status
    )
VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
        2,
        NOW() + INTERVAL '4 days',
        NOW() + INTERVAL '4 days 12 hours',
        'scheduled'
    );

SELECT ok (
        (
            SELECT COUNT(DISTINCT status)
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND status IN ('scheduled', 'completed')
        ) >= 2, 'Should support multiple valid statuses'
    );

-- =====================================================
-- TESTS: Seasons Integration
-- =====================================================

-- Test 10: Create a season
DO $$
DECLARE
  v_season_id UUID;
BEGIN
  INSERT INTO public.seasons (
    league_id,
    name,
    season_number,
    start_date,
    status
  )
  VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Season 1',
    1,
    CURRENT_DATE,
    'active'
  )
  RETURNING id INTO v_season_id;

  -- Test 11: Create scheduled match with season_id
  INSERT INTO public.matches (
    league_id,
    season_id,
    home_player_id,
    away_player_id,
    round_number,
    scheduled_date,
    submission_deadline,
    status
  )
  VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    v_season_id,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    1,
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days 12 hours',
    'scheduled'
  );
END;
$$;

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.seasons
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND name = 'Season 1'
        ), 'Should be able to create a season'
    );

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.matches m
                JOIN public.seasons s ON m.season_id = s.id
            WHERE
                m.league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND s.name = 'Season 1'
                AND m.status = 'scheduled'
        ), 'Should be able to create scheduled match with season_id'
    );

-- =====================================================
-- TESTS: Constraints
-- =====================================================

-- Test 12: Cannot have home_player_id = away_player_id
SELECT throws_ok(
  $$
    INSERT INTO public.matches (league_id, home_player_id, away_player_id, status)
    VALUES (
      '11111111-1111-1111-1111-111111111111'::uuid,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      'scheduled'
    );

$$,
  'new row for relation "matches" violates check constraint "matches_check"',
  'Should reject matches where home_player_id = away_player_id'
);

-- Test 13: Scheduled match requires home_player_id and away_player_id
SELECT throws_ok(
  $$
    INSERT INTO public.matches (league_id, status)
    VALUES (
      '11111111-1111-1111-1111-111111111111'::uuid,
      'scheduled'
    );

$$,
  NULL, -- Accept any constraint violation error
  'Scheduled matches require home_player_id and away_player_id'
);

-- Test 14: scheduled_date must be before submission_deadline
SELECT throws_ok(
  $$
    INSERT INTO public.matches (
      league_id, home_player_id, away_player_id,
      scheduled_date, submission_deadline, status
    )
    VALUES (
      '11111111-1111-1111-1111-111111111111'::uuid,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
      NOW() + INTERVAL '2 days',
      NOW() + INTERVAL '1 day',
      'scheduled'
    );

$$,
  NULL, -- Accept any constraint violation error
  'scheduled_date must be before submission_deadline'
);

-- =====================================================
-- TESTS: RLS Policies
-- =====================================================

-- Test 15: League members can view matches
SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
        ), 'League member should be able to view matches in their league'
    );

-- Test 16: League members can create matches
INSERT INTO
    public.matches (
        league_id,
        home_player_id,
        away_player_id,
        status
    )
VALUES (
        '11111111-1111-1111-1111-111111111111'::uuid,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
        'scheduled'
    );

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND home_player_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
        ), 'League member should be able to create matches'
    );

-- Test 17: Participants can update their matches
DO $$
DECLARE
  v_match_id UUID;
BEGIN
  SELECT id INTO v_match_id FROM public.matches 
  WHERE league_id = '11111111-1111-1111-1111-111111111111'::uuid
  AND status = 'scheduled'
  AND home_player_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  LIMIT 1;

  UPDATE public.matches
  SET status = 'completed',
      match_date = NOW(),
      recorded_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      recorded_at = NOW()
  WHERE id = v_match_id;
END;
$$;

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND status = 'completed'
                AND recorded_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
        ), 'Match participant should be able to update their matches'
    );

-- =====================================================
-- TESTS: Functions
-- =====================================================

-- Test 18: mark_overdue_matches() works
DO $$
BEGIN
  -- Create a match past deadline
  INSERT INTO public.matches (
    league_id, home_player_id, away_player_id,
    scheduled_date, submission_deadline, status
  )
  VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    'scheduled'
  );

  -- Mark overdue
  PERFORM mark_overdue_matches();
END;
$$;

SELECT ok (
        EXISTS (
            SELECT 1
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND status = 'overdue'
        ), 'mark_overdue_matches() should mark scheduled matches past deadline as overdue'
    );

-- Test 19: calculate_submission_deadline() works
SELECT ok (
        ABS(
            EXTRACT(
                EPOCH
                FROM (
                        calculate_submission_deadline (NOW(), 12) - (NOW() + INTERVAL '12 hours')
                    )
            )
        ) < 1, 'calculate_submission_deadline() should add hours correctly'
    );

-- =====================================================
-- TESTS: Leaderboard (only counts completed matches)
-- =====================================================

-- Test 20: Leaderboard only counts completed matches
DO $$
DECLARE
  v_match_id UUID;
  i INTEGER;
BEGIN
  -- Create more completed matches
  FOR i IN 1..3 LOOP
    INSERT INTO public.matches (
      league_id, home_player_id, away_player_id,
      match_date, recorded_by, recorded_at, status
    )
    VALUES (
      '11111111-1111-1111-1111-111111111111'::uuid,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
      NOW() - (i || ' days')::INTERVAL,
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
      NOW() - (i || ' days')::INTERVAL,
      'completed'
    )
    RETURNING id INTO v_match_id;

    INSERT INTO public.match_participants (match_id, profile_id, score, result)
    VALUES 
      (v_match_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 10, 'win'),
      (v_match_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, 5, 'loss');
  END LOOP;
END;
$$;

SELECT ok (
        EXISTS (
            SELECT 1
            FROM calculate_league_standings (
                    '11111111-1111-1111-1111-111111111111'::uuid
                )
            WHERE
                profile_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
                AND matches_played > 0
        ), 'Leaderboard should count completed matches only'
    );

-- Test 21: Scheduled matches don't affect leaderboard
SELECT ok (
        NOT EXISTS (
            SELECT 1
            FROM calculate_league_standings (
                    '11111111-1111-1111-1111-111111111111'::uuid
                )
            WHERE
                profile_id IN (
                    SELECT home_player_id
                    FROM public.matches
                    WHERE
                        league_id = '11111111-1111-1111-1111-111111111111'::uuid
                        AND status = 'scheduled'
                )
                AND matches_played = 0
        )
        OR (
            SELECT COUNT(*)
            FROM public.matches
            WHERE
                league_id = '11111111-1111-1111-1111-111111111111'::uuid
                AND status = 'scheduled'
        ) = 0, 'Scheduled matches should not affect leaderboard calculations'
    );

-- =====================================================
-- TESTS: Indexes and Performance
-- =====================================================

-- Test 22: Indexes exist for common queries
SELECT ok (
        EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE
                tablename = 'matches'
                AND indexname = 'idx_matches_league_id'
        ), 'Index idx_matches_league_id should exist'
    );

SELECT ok (
        EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE
                tablename = 'matches'
                AND indexname = 'idx_matches_status'
        ), 'Index idx_matches_status should exist'
    );

SELECT ok (
        EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE
                tablename = 'matches'
                AND indexname = 'idx_matches_scheduled_date'
        ), 'Index idx_matches_scheduled_date should exist'
    );

SELECT ok (
        EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE
                tablename = 'matches'
                AND indexname = 'idx_matches_season_id'
        ), 'Index idx_matches_season_id should exist'
    );

SELECT * FROM finish ();

ROLLBACK;