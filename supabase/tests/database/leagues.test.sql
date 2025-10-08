BEGIN;
SELECT plan(6);

-- Test 1: Tables exist
SELECT has_table('public', 'leagues', 'leagues table exists');
SELECT has_table('public', 'league_settings', 'league_settings table exists');
SELECT has_table('public', 'league_members', 'league_members table exists');

-- Test 2: Trigger functions exist
SELECT has_function('public', 'setup_new_league', 'Setup league trigger function exists');
SELECT has_function('public', 'generate_league_invite_code', 'Generate invite code trigger function exists');

-- Test 3: Invite code generation function exists
SELECT has_function('public', 'generate_invite_code', 'Invite code generator exists');

SELECT * FROM finish();
ROLLBACK;
