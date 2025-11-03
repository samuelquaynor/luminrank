# Database Tests

This directory contains pgTAP tests for the LuminRank database schema.

## Prerequisites

1. Install pgTAP in your PostgreSQL database:

   ```sql
   CREATE EXTENSION IF NOT EXISTS pgtap;
   ```

2. Ensure your Supabase database has the migrations applied.

## Running Tests

### Run all tests:

```bash
psql -d your_database -f tests/database/create_league.test.sql
psql -d your_database -f tests/database/matches.test.sql
```

### Or run specific test file:

```bash
psql -d your_database -f tests/database/matches.test.sql
```

### Using Supabase CLI:

```bash
supabase db test
```

Or connect to your database and run:

```sql
\i tests/database/matches.test.sql
```

## Test Files

- **create_league.test.sql**: Tests league creation, settings, and membership
- **matches.test.sql**: Tests the unified matches table (scheduled and completed matches)

## What the Matches Test Covers

The `matches.test.sql` file tests:

1. **Scheduled Matches (Former Fixtures)**

   - Creating scheduled matches with participants
   - NULL values for match_date, recorded_by, recorded_at
   - NULL scores and results for participants

2. **Completed Matches**

   - Creating completed matches with results
   - Required scores and results for participants

3. **Status Transitions**

   - Updating scheduled matches to completed
   - Status constraint validation

4. **Seasons Integration**

   - Creating seasons
   - Linking matches to seasons

5. **Constraints**

   - Cannot have home_player_id = away_player_id
   - Scheduled matches require participants
   - scheduled_date must be before submission_deadline

6. **RLS Policies**

   - League members can view/create matches
   - Participants can update their matches

7. **Functions**

   - `mark_overdue_matches()` marks past deadline matches as overdue
   - `calculate_submission_deadline()` calculates deadlines correctly

8. **Leaderboard**

   - Only counts completed matches
   - Scheduled matches don't affect standings

9. **Indexes**
   - Verifies performance indexes exist

## Expected Output

When tests pass, you should see:

```
ok 1 - Should be able to create a scheduled match
ok 2 - Scheduled match should have NULL match_date, recorded_by, recorded_at
...
ok 25 - Index idx_matches_season_id should exist
1..25
# Looks like you planned 25 tests and ran 25.
```

If tests fail, you'll see which specific test failed and why.
