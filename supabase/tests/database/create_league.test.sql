-- Test: User can create a league with auto-generated settings and membership
BEGIN;
SELECT plan(10);

-- Cleanup: Remove test data if it exists from previous runs
DELETE FROM public.profiles WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;
DELETE FROM auth.users WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

-- Setup: Create a test user (profile will be auto-created by trigger)
INSERT INTO auth.users (
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
  'leaguetest@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
);

-- Update profile with a name (trigger creates it without name)
UPDATE public.profiles 
SET name = 'League Test User'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

-- Set session to act as this user
SELECT set_config('request.jwt.claims', json_build_object(
  'sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'role', 'authenticated'
)::text, true);

-- Create a league as the test user
INSERT INTO public.leagues (
  name, 
  description, 
  game_type, 
  created_by, 
  is_private
)
VALUES (
  'Test Championship League',
  'A league for testing database functionality',
  'Chess',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  false
);

-- Test 1: League was created
SELECT ok(
  EXISTS(
    SELECT 1 FROM public.leagues 
    WHERE name = 'Test Championship League'
  ),
  'League should be created successfully'
);

-- Test 2: League has correct creator
SELECT ok(
  EXISTS(
    SELECT 1 FROM public.leagues 
    WHERE name = 'Test Championship League'
    AND created_by = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  ),
  'League should have correct creator'
);

-- Test 3: Invite code was auto-generated
SELECT ok(
  EXISTS(
    SELECT 1 FROM public.leagues 
    WHERE name = 'Test Championship League'
    AND invite_code LIKE 'LMNR-%'
    AND length(invite_code) = 11
  ),
  'Invite code should be auto-generated with format LMNR-XXXXXX'
);

-- Test 4: League settings were auto-created
SELECT ok(
  EXISTS(
    SELECT 1 FROM public.league_settings ls
    JOIN public.leagues l ON l.id = ls.league_id
    WHERE l.name = 'Test Championship League'
  ),
  'League settings should be auto-created by trigger'
);

-- Test 5: Default scoring system is points
SELECT is(
  (SELECT ls.scoring_system 
   FROM public.league_settings ls
   JOIN public.leagues l ON l.id = ls.league_id
   WHERE l.name = 'Test Championship League'),
  'points',
  'Default scoring system should be points'
);

-- Test 6: Default points values are correct
SELECT ok(
  EXISTS(
    SELECT 1 FROM public.league_settings ls
    JOIN public.leagues l ON l.id = ls.league_id
    WHERE l.name = 'Test Championship League'
    AND ls.points_per_win = 3
    AND ls.points_per_draw = 1
    AND ls.points_per_loss = 0
  ),
  'Default points values should be 3-1-0'
);

-- Test 7: Creator was auto-added as member
SELECT ok(
  EXISTS(
    SELECT 1 FROM public.league_members lm
    JOIN public.leagues l ON l.id = lm.league_id
    WHERE l.name = 'Test Championship League'
    AND lm.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
  ),
  'Creator should be auto-added as member'
);

-- Test 8: Creator has creator role
SELECT is(
  (SELECT lm.role 
   FROM public.league_members lm
   JOIN public.leagues l ON l.id = lm.league_id
   WHERE l.name = 'Test Championship League'
   AND lm.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  'creator',
  'Creator should have creator role'
);

-- Test 9: Member status is active
SELECT is(
  (SELECT lm.status 
   FROM public.league_members lm
   JOIN public.leagues l ON l.id = lm.league_id
   WHERE l.name = 'Test Championship League'
   AND lm.user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid),
  'active',
  'Creator membership should be active'
);

-- Test 10: League status defaults to draft
SELECT is(
  (SELECT status FROM public.leagues WHERE name = 'Test Championship League'),
  'draft',
  'New league should have draft status'
);

SELECT * FROM finish();
ROLLBACK;
