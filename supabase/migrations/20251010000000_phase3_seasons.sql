-- =====================================================
-- Phase 3: Seasons Management
-- =====================================================
-- This migration adds season management
-- Note: Fixtures are now handled as scheduled matches in the matches table

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
start_date DATE NOT NULL, end_date DATE,

-- Status
status TEXT NOT NULL DEFAULT 'upcoming' CHECK (
    status IN (
        'upcoming',
        'active',
        'completed',
        'cancelled'
    )
),

-- Timestamps
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

-- Ensure unique season numbers per league
UNIQUE(league_id, season_number) );

-- Indexes
CREATE INDEX idx_seasons_league_id ON public.seasons (league_id);

CREATE INDEX idx_seasons_status ON public.seasons (status);

CREATE INDEX idx_seasons_dates ON public.seasons (start_date, end_date);

-- =====================================================
-- UPDATE MATCHES TABLE
-- =====================================================
-- Add foreign key to link matches to seasons
-- Note: season_id column is already added to matches table in Phase 2
ALTER TABLE public.matches
ADD CONSTRAINT matches_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.seasons (id) ON DELETE SET NULL;

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

-- Function to mark overdue matches (scheduled matches past deadline)
-- This will be called by a scheduled job or manually
CREATE OR REPLACE FUNCTION public.mark_overdue_matches()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.matches
  SET status = 'overdue',
      updated_at = NOW()
  WHERE status = 'scheduled'
    AND submission_deadline < NOW()
    AND match_date IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

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

-- Seasons policies
-- League members can view seasons
CREATE POLICY "League members can view seasons" ON public.seasons FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.league_members lm
            WHERE
                lm.league_id = seasons.league_id
                AND lm.user_id = auth.uid ()
                AND lm.status = 'active'
        )
    );

-- League creators can create seasons
CREATE POLICY "League creators can create seasons" ON public.seasons FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.league_members lm
            WHERE
                lm.league_id = seasons.league_id
                AND lm.user_id = auth.uid ()
                AND lm.role IN ('creator', 'admin')
                AND lm.status = 'active'
        )
    );

-- League creators can update seasons
CREATE POLICY "League creators can update seasons" ON public.seasons
FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.league_members lm
            WHERE
                lm.league_id = seasons.league_id
                AND lm.user_id = auth.uid ()
                AND lm.role IN ('creator', 'admin')
                AND lm.status = 'active'
        )
    );

-- League creators can delete seasons
CREATE POLICY "League creators can delete seasons" ON public.seasons FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.league_members lm
        WHERE
            lm.league_id = seasons.league_id
            AND lm.user_id = auth.uid ()
            AND lm.role IN ('creator', 'admin')
            AND lm.status = 'active'
    )
);

-- =====================================================
-- GRANTS
-- =====================================================
GRANT
SELECT, INSERT,
UPDATE, DELETE ON public.seasons TO authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_submission_deadline(TIMESTAMPTZ, INTEGER) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.mark_overdue_matches () TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.seasons IS 'Time-boxed competition periods within a league';

COMMENT ON FUNCTION public.calculate_submission_deadline (TIMESTAMPTZ, INTEGER) IS 'Calculates submission deadline based on scheduled date and window';

COMMENT ON FUNCTION public.mark_overdue_matches () IS 'Marks scheduled matches as overdue when past deadline with no result';