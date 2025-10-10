-- =====================================================
-- Phase 3: Fixtures & Scheduling
-- =====================================================
-- This migration adds fixture generation and season management
-- Includes: fixtures table, seasons table, submission windows

-- =====================================================
-- SEASONS TABLE
-- =====================================================
-- Represents a time-boxed competition period within a league
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  
  -- Season metadata
  name TEXT NOT NULL,
  description TEXT,
  season_number INTEGER NOT NULL, -- 1, 2, 3, etc. (unique per league)
  
  -- Time bounds
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique season numbers per league
  UNIQUE(league_id, season_number)
);

-- Indexes
CREATE INDEX idx_seasons_league_id ON public.seasons(league_id);
CREATE INDEX idx_seasons_status ON public.seasons(status);
CREATE INDEX idx_seasons_dates ON public.seasons(start_date, end_date);

-- =====================================================
-- FIXTURES TABLE
-- =====================================================
-- Represents scheduled matches in a season
CREATE TABLE IF NOT EXISTS public.fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  
  -- Participants
  home_player_id UUID NOT NULL REFERENCES public.profiles(id),
  away_player_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Scheduling
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  scheduled_date TIMESTAMPTZ NOT NULL,
  submission_deadline TIMESTAMPTZ NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'completed', 'overdue', 'cancelled', 'forfeited')
  ),
  
  -- Result (nullable until completed)
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES public.profiles(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (home_player_id != away_player_id),
  CHECK (scheduled_date < submission_deadline)
);

-- Indexes
CREATE INDEX idx_fixtures_league_id ON public.fixtures(league_id);
CREATE INDEX idx_fixtures_season_id ON public.fixtures(season_id);
CREATE INDEX idx_fixtures_home_player ON public.fixtures(home_player_id);
CREATE INDEX idx_fixtures_away_player ON public.fixtures(away_player_id);
CREATE INDEX idx_fixtures_status ON public.fixtures(status);
CREATE INDEX idx_fixtures_round ON public.fixtures(round_number);
CREATE INDEX idx_fixtures_scheduled_date ON public.fixtures(scheduled_date);
CREATE INDEX idx_fixtures_deadline ON public.fixtures(submission_deadline);
CREATE INDEX idx_fixtures_match_id ON public.fixtures(match_id);

-- =====================================================
-- UPDATE MATCHES TABLE
-- =====================================================
-- Add foreign keys to link matches to fixtures and seasons
ALTER TABLE public.matches 
  ADD COLUMN IF NOT EXISTS fixture_id UUID REFERENCES public.fixtures(id) ON DELETE SET NULL;

ALTER TABLE public.matches 
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_matches_fixture_id ON public.matches(fixture_id);
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON public.matches(season_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate submission deadline
CREATE OR REPLACE FUNCTION public.calculate_submission_deadline(
  p_scheduled_date TIMESTAMPTZ,
  p_submission_window_hours INTEGER
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN p_scheduled_date + (p_submission_window_hours || ' hours')::INTERVAL;
END;
$$;

-- Function to check if submission is within window
CREATE OR REPLACE FUNCTION public.check_submission_window(
  p_fixture_id UUID,
  p_submission_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_deadline TIMESTAMPTZ;
BEGIN
  SELECT submission_deadline INTO v_deadline
  FROM public.fixtures
  WHERE id = p_fixture_id;
  
  IF v_deadline IS NULL THEN
    RAISE EXCEPTION 'Fixture not found';
  END IF;
  
  RETURN p_submission_time <= v_deadline;
END;
$$;

-- Function to mark overdue fixtures
-- This will be called by a scheduled job or manually
CREATE OR REPLACE FUNCTION public.mark_overdue_fixtures()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.fixtures
  SET status = 'overdue',
      updated_at = NOW()
  WHERE status = 'scheduled'
    AND submission_deadline < NOW()
    AND match_id IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

-- Function to get fixtures for a player
CREATE OR REPLACE FUNCTION public.get_player_fixtures(
  p_profile_id UUID,
  p_league_id UUID,
  p_season_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  league_id UUID,
  season_id UUID,
  home_player_id UUID,
  home_player_name TEXT,
  away_player_id UUID,
  away_player_name TEXT,
  round_number INTEGER,
  scheduled_date TIMESTAMPTZ,
  submission_deadline TIMESTAMPTZ,
  status TEXT,
  match_id UUID,
  winner_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.league_id,
    f.season_id,
    f.home_player_id,
    home.name AS home_player_name,
    f.away_player_id,
    away.name AS away_player_name,
    f.round_number,
    f.scheduled_date,
    f.submission_deadline,
    f.status,
    f.match_id,
    f.winner_id
  FROM public.fixtures f
  JOIN public.profiles home ON f.home_player_id = home.id
  JOIN public.profiles away ON f.away_player_id = away.id
  WHERE f.league_id = p_league_id
    AND (f.home_player_id = p_profile_id OR f.away_player_id = p_profile_id)
    AND (p_season_id IS NULL OR f.season_id = p_season_id)
  ORDER BY f.round_number, f.scheduled_date;
END;
$$;

-- Trigger to auto-update updated_at on fixtures
CREATE TRIGGER update_fixtures_updated_at
  BEFORE UPDATE ON public.fixtures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on seasons
CREATE TRIGGER update_seasons_updated_at
  BEFORE UPDATE ON public.seasons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

-- Seasons policies
-- League members can view seasons
CREATE POLICY "League members can view seasons"
  ON public.seasons
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = seasons.league_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'active'
    )
  );

-- League creators can create seasons
CREATE POLICY "League creators can create seasons"
  ON public.seasons
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = seasons.league_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('creator', 'admin')
        AND lm.status = 'active'
    )
  );

-- League creators can update seasons
CREATE POLICY "League creators can update seasons"
  ON public.seasons
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = seasons.league_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('creator', 'admin')
        AND lm.status = 'active'
    )
  );

-- League creators can delete seasons
CREATE POLICY "League creators can delete seasons"
  ON public.seasons
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = seasons.league_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('creator', 'admin')
        AND lm.status = 'active'
    )
  );

-- Fixtures policies
-- League members can view fixtures
CREATE POLICY "League members can view fixtures"
  ON public.fixtures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = fixtures.league_id
        AND lm.user_id = auth.uid()
        AND lm.status = 'active'
    )
  );

-- League creators can create fixtures
CREATE POLICY "League creators can create fixtures"
  ON public.fixtures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = fixtures.league_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('creator', 'admin')
        AND lm.status = 'active'
    )
  );

-- Fixture participants can update fixtures (to link matches)
CREATE POLICY "Fixture participants can update fixtures"
  ON public.fixtures
  FOR UPDATE
  USING (
    home_player_id = auth.uid() OR away_player_id = auth.uid()
  );

-- League creators can delete fixtures
CREATE POLICY "League creators can delete fixtures"
  ON public.fixtures
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.league_members lm
      WHERE lm.league_id = fixtures.league_id
        AND lm.user_id = auth.uid()
        AND lm.role IN ('creator', 'admin')
        AND lm.status = 'active'
    )
  );

-- =====================================================
-- GRANTS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seasons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixtures TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_submission_deadline(TIMESTAMPTZ, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_submission_window(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_overdue_fixtures() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_fixtures(UUID, UUID, UUID) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.seasons IS 'Time-boxed competition periods within a league';
COMMENT ON TABLE public.fixtures IS 'Scheduled matches generated by round-robin algorithm';
COMMENT ON FUNCTION public.calculate_submission_deadline(TIMESTAMPTZ, INTEGER) IS 'Calculates submission deadline based on scheduled date and window';
COMMENT ON FUNCTION public.check_submission_window(UUID, TIMESTAMPTZ) IS 'Checks if a submission time is within the allowed window';
COMMENT ON FUNCTION public.mark_overdue_fixtures() IS 'Marks fixtures as overdue when past deadline with no result';
COMMENT ON FUNCTION public.get_player_fixtures(UUID, UUID, UUID) IS 'Gets all fixtures for a player with participant names';

