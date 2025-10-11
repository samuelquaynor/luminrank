-- =====================================================
-- Fix Profile RLS to Allow League Members to See Each Other
-- =====================================================
-- This fixes the bug where match participants' names don't display
-- because RLS blocks viewing other users' profiles

-- Users can view profiles of league members
CREATE POLICY "Users can view league member profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.league_members lm1
            JOIN public.league_members lm2 ON lm1.league_id = lm2.league_id
            WHERE lm1.user_id = auth.uid()
              AND lm2.user_id = profiles.id
              AND lm1.status = 'active'
              AND lm2.status = 'active'
        )
    );

COMMENT ON POLICY "Users can view league member profiles" ON public.profiles IS 
  'Allows users to view profiles of other members in their leagues (needed for displaying participant names in matches, fixtures, etc.)';

