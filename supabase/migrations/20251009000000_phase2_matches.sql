-- =====================================================
-- Phase 2: Match Recording & Leaderboard
-- =====================================================
-- This migration adds match recording and leaderboard functionality
-- Matches can be scheduled (future) or completed (past)
-- Simplified: No legs, no fixtures, no disputes (those come in later phases)

-- =====================================================
-- MATCHES TABLE
-- =====================================================
-- Stores match results and scheduled matches between league members
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  season_id UUID, -- Foreign key will be added in Phase 3 after seasons table is created

-- Scheduling (for scheduled matches)
round_number INTEGER CHECK (round_number > 0),
scheduled_date TIMESTAMPTZ,
submission_deadline TIMESTAMPTZ,
home_player_id UUID REFERENCES public.profiles (id),
away_player_id UUID REFERENCES public.profiles (id),

-- Match metadata (nullable for scheduled matches)
match_date TIMESTAMPTZ,
recorded_by UUID REFERENCES public.profiles (id),
recorded_at TIMESTAMPTZ,

-- Match status
-- scheduled: Created as a fixture, not yet played
-- overdue: Past submission deadline without result
-- forfeited: Match forfeited by one player
-- completed: Match finished with results
-- cancelled: Match cancelled
-- pending: Match recorded but not confirmed (phase 4)
-- disputed: Match under dispute (phase 4)
status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
    status IN (
        'scheduled',
        'overdue',
        'forfeited',
        'completed',
        'cancelled',
        'pending',
        'disputed'
    )
),

-- Timestamps
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

-- Constraints
CHECK (home_player_id IS NULL OR away_player_id IS NULL OR home_player_id != away_player_id),
  CHECK (scheduled_date IS NULL OR submission_deadline IS NULL OR scheduled_date < submission_deadline),
  -- Ensure participants are set for scheduled matches
  CHECK (
    status IN ('completed', 'cancelled', 'pending', 'disputed') OR
    (home_player_id IS NOT NULL AND away_player_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_matches_league_id ON public.matches (league_id);

CREATE INDEX idx_matches_season_id ON public.matches (season_id);

CREATE INDEX idx_matches_recorded_by ON public.matches (recorded_by);

CREATE INDEX idx_matches_match_date ON public.matches (match_date);

CREATE INDEX idx_matches_scheduled_date ON public.matches (scheduled_date);

CREATE INDEX idx_matches_submission_deadline ON public.matches (submission_deadline);

CREATE INDEX idx_matches_status ON public.matches (status);

CREATE INDEX idx_matches_home_player ON public.matches (home_player_id);

CREATE INDEX idx_matches_away_player ON public.matches (away_player_id);

CREATE INDEX idx_matches_round_number ON public.matches (round_number);

-- =====================================================
-- MATCH PARTICIPANTS TABLE
-- =====================================================
-- Stores individual player results in a match
-- Score and result are NULL for scheduled matches
CREATE TABLE IF NOT EXISTS public.match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

-- Player's score in this match (nullable for scheduled matches)
score INTEGER CHECK ( score IS NULL OR score >= 0 ),

-- Result for this player (nullable for scheduled matches)
result TEXT CHECK ( result IS NULL OR result IN ('win', 'loss') ),

-- Timestamps
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

-- Ensure each player appears only once per match
UNIQUE (match_id, profile_id),

-- Constraint: Score and result must both be set or both be NULL
CHECK ((score IS NULL AND result IS NULL) OR (score IS NOT NULL AND result IS NOT NULL))
);

-- Indexes for performance
CREATE INDEX idx_match_participants_match_id ON public.match_participants (match_id);

CREATE INDEX idx_match_participants_profile_id ON public.match_participants (profile_id);

CREATE INDEX idx_match_participants_result ON public.match_participants (result);

-- =====================================================
-- CONSTRAINTS
-- =====================================================
-- Ensure a match has exactly 2 participants (enforced at application level for now)
-- This will be enforced via triggers in a future migration if needed

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate league standings
-- Returns leaderboard with rank, player info, and stats
CREATE OR REPLACE FUNCTION public.calculate_league_standings(p_league_id UUID)
RETURNS TABLE (
  rank INTEGER,
  profile_id UUID,
  name TEXT,
  matches_played INTEGER,
  wins INTEGER,
  losses INTEGER,
  points INTEGER,
  win_rate NUMERIC
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH player_stats AS (
    SELECT 
      mp.profile_id,
      p.name,
      COUNT(DISTINCT mp.match_id) AS matches_played,
      COUNT(DISTINCT CASE WHEN mp.result = 'win' THEN mp.match_id END) AS wins,
      COUNT(DISTINCT CASE WHEN mp.result = 'loss' THEN mp.match_id END) AS losses
    FROM public.match_participants mp
    JOIN public.matches m ON mp.match_id = m.id
    JOIN public.profiles p ON mp.profile_id = p.id
    WHERE m.league_id = p_league_id
      AND m.status = 'completed'
    GROUP BY mp.profile_id, p.name
  ),
  player_points AS (
    SELECT 
      ps.profile_id,
      ps.name,
      ps.matches_played,
      ps.wins,
      ps.losses,
      -- Calculate points based on league settings
      (ps.wins * COALESCE(ls.points_per_win, 3)) AS points,
      -- Calculate win rate
      CASE 
        WHEN ps.matches_played > 0 THEN 
          ROUND((ps.wins::NUMERIC / ps.matches_played::NUMERIC) * 100, 2)
        ELSE 0
      END AS win_rate
    FROM player_stats ps
    LEFT JOIN public.league_settings ls ON ls.league_id = p_league_id
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY pp.points DESC, pp.win_rate DESC, pp.wins DESC, pp.matches_played ASC)::INTEGER AS rank,
    pp.profile_id,
    pp.name,
    pp.matches_played::INTEGER,
    pp.wins::INTEGER,
    pp.losses::INTEGER,
    pp.points::INTEGER,
    pp.win_rate
  FROM player_points pp
  ORDER BY rank;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to auto-update updated_at on matches
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;

-- Matches policies
-- Anyone in the league can view matches
CREATE POLICY "League members can view matches" ON public.matches FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.league_members lm
            WHERE
                lm.league_id = matches.league_id
                AND lm.user_id = auth.uid ()
                AND lm.status = 'active'
        )
    );

-- League members can record matches
CREATE POLICY "League members can record matches" ON public.matches FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.league_members lm
            WHERE
                lm.league_id = matches.league_id
                AND lm.user_id = auth.uid ()
                AND lm.status = 'active'
        )
    );

-- Players can update matches they're participating in (for recording results)
-- Recorder can update their own matches (for cancellation)
CREATE POLICY "Participants or recorder can update matches" ON public.matches
FOR UPDATE
    USING (
        recorded_by = auth.uid ()
        OR home_player_id = auth.uid ()
        OR away_player_id = auth.uid ()
    );

-- Match participants policies
-- Anyone in the league can view match participants
CREATE POLICY "League members can view match participants" ON public.match_participants FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.matches m
                JOIN public.league_members lm ON lm.league_id = m.league_id
            WHERE
                m.id = match_participants.match_id
                AND lm.user_id = auth.uid ()
                AND lm.status = 'active'
        )
    );

-- League members can insert match participants (when recording a match or creating scheduled match)
CREATE POLICY "League members can insert match participants" ON public.match_participants FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.matches m
                JOIN public.league_members lm ON lm.league_id = m.league_id
            WHERE
                m.id = match_participants.match_id
                AND lm.user_id = auth.uid ()
                AND lm.status = 'active'
        )
    );

-- Participants can update their own scores/results
CREATE POLICY "Participants can update their own scores" ON public.match_participants
FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.matches m
            WHERE
                m.id = match_participants.match_id
                AND (
                    m.home_player_id = auth.uid ()
                    OR m.away_player_id = auth.uid ()
                )
        )
        OR profile_id = auth.uid ()
    );

-- =====================================================
-- GRANTS
-- =====================================================
-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.matches TO authenticated;

GRANT
SELECT, INSERT,
UPDATE ON public.match_participants TO authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_league_standings(UUID) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.matches IS 'Stores match results between league members';

COMMENT ON TABLE public.match_participants IS 'Stores individual player results in a match';

COMMENT ON FUNCTION public.calculate_league_standings (UUID) IS 'Calculates league standings with rank, stats, and points';