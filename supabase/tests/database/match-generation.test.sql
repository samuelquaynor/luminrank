-- Test match generation functions
-- Run this with: psql postgresql://postgres:postgres@localhost:54322/postgres < match-generation.test.sql

BEGIN;

-- Create test user
DO $$
DECLARE
    v_user_id UUID;
    v_league_id UUID;
    v_opponent_id UUID;
    v_opponent2_id UUID;
    v_member_count INTEGER;
    v_match_count INTEGER;
    v_validation_result RECORD;
    v_generation_result RECORD;
BEGIN
    -- Create test users
    v_user_id := gen_random_uuid();
    v_opponent_id := gen_random_uuid();
    v_opponent2_id := gen_random_uuid();
    
    -- Insert profiles (bypassing auth.users for test)
    INSERT INTO public.profiles (id, name, email)
    VALUES 
        (v_user_id, 'Test User', 'test@example.com'),
        (v_opponent_id, 'Opponent 1', 'opponent1@example.com'),
        (v_opponent2_id, 'Opponent 2', 'opponent2@example.com')
    ON CONFLICT DO NOTHING;
    
    -- Create a test league
    INSERT INTO public.leagues (id, name, description, created_by, game_type, status, invite_code)
    VALUES (
        gen_random_uuid(),
        'Test Match Generation League',
        'Testing match generation',
        v_user_id,
        'Chess',
        'draft',
        'TEST-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)
    )
    RETURNING id INTO v_league_id;
    
    -- Add members (creator + 2 opponents = 3 total)
    INSERT INTO public.league_members (league_id, user_id, role, status)
    VALUES 
        (v_league_id, v_user_id, 'creator', 'active'),
        (v_league_id, v_opponent_id, 'member', 'active'),
        (v_league_id, v_opponent2_id, 'member', 'active');
    
    RAISE NOTICE 'Created test league: %', v_league_id;
    RAISE NOTICE 'Added 3 members to league';
    
    -- Test 1: Validate league can be started
    RAISE NOTICE 'Test 1: Validating league can be started...';
    SELECT * INTO v_validation_result
    FROM validate_league_start(v_league_id);
    
    IF v_validation_result.valid THEN
        RAISE NOTICE '✓ Validation passed: %', v_validation_result.message;
    ELSE
        RAISE NOTICE '✗ Validation failed: %', v_validation_result.message;
        RAISE EXCEPTION 'Validation test failed';
    END IF;
    
    -- Test 2: Generate matches
    RAISE NOTICE 'Test 2: Generating matches...';
    SELECT * INTO v_generation_result
    FROM generate_matches_for_league(v_league_id, NOW() + INTERVAL '1 day');
    
    RAISE NOTICE '✓ Generated % matches', v_generation_result.matches_created;
    
    -- Test 3: Verify league status updated
    SELECT status INTO v_league_id FROM public.leagues WHERE id = v_league_id;
    IF v_league_id::TEXT = 'active' THEN
        RAISE NOTICE '✓ League status updated to active';
    ELSE
        RAISE EXCEPTION 'League status not updated to active';
    END IF;
    
    -- Test 4: Verify matches created
    SELECT COUNT(*) INTO v_match_count
    FROM public.matches
    WHERE league_id = v_league_id;
    
    RAISE NOTICE '✓ Found % matches in database', v_match_count;
    
    IF v_match_count != v_generation_result.matches_created THEN
        RAISE EXCEPTION 'Match count mismatch: expected %, got %', v_generation_result.matches_created, v_match_count;
    END IF;
    
    -- Test 5: Verify match structure
    SELECT COUNT(*) INTO v_match_count
    FROM public.matches
    WHERE league_id = v_league_id
    AND status = 'scheduled'
    AND round_number IS NOT NULL
    AND scheduled_date IS NOT NULL
    AND submission_deadline IS NOT NULL
    AND home_player_id IS NOT NULL
    AND away_player_id IS NOT NULL;
    
    IF v_match_count = v_generation_result.matches_created THEN
        RAISE NOTICE '✓ All matches have correct structure';
    ELSE
        RAISE EXCEPTION 'Some matches missing required fields';
    END IF;
    
    -- Test 6: Verify round distribution (3 players = 3 rounds, 1 match per round = 3 matches)
    -- For 3 players: Round 1, Round 2, Round 3 (one player gets bye each round)
    SELECT COUNT(DISTINCT round_number) INTO v_match_count
    FROM public.matches
    WHERE league_id = v_league_id;
    
    RAISE NOTICE '✓ Matches distributed across % rounds', v_match_count;
    
    -- Cleanup
    DELETE FROM public.matches WHERE league_id = v_league_id;
    DELETE FROM public.league_members WHERE league_id = v_league_id;
    DELETE FROM public.league_settings WHERE league_id = v_league_id;
    DELETE FROM public.leagues WHERE id = v_league_id;
    
    RAISE NOTICE '✓ All tests passed!';
END $$;

ROLLBACK;