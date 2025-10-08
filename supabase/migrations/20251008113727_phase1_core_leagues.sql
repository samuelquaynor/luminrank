-- Phase 1: Core League Management
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leagues table
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  game_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  invite_code TEXT UNIQUE NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date > start_date),
  CONSTRAINT leagues_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create league_settings table
CREATE TABLE IF NOT EXISTS public.league_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE UNIQUE NOT NULL,
  scoring_system TEXT DEFAULT 'points' CHECK (scoring_system IN ('win_loss', 'points', 'elo')),
  points_per_win INTEGER DEFAULT 3 CHECK (points_per_win > 0),
  points_per_draw INTEGER DEFAULT 1 CHECK (points_per_draw >= 0),
  points_per_loss INTEGER DEFAULT 0 CHECK (points_per_loss >= 0),
  allow_draws BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create league_members table
CREATE TABLE IF NOT EXISTS public.league_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL CONSTRAINT league_members_user_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- Create league_invites table (for Phase 1, mainly for tracking)
CREATE TABLE IF NOT EXISTS public.league_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  invited_email TEXT NOT NULL,
  invited_user_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'LMNR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.leagues WHERE invite_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: Generate invite code before insert
CREATE OR REPLACE FUNCTION generate_league_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate invite code if not provided
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: Create settings and add creator after insert
-- SECURITY DEFINER allows the function to bypass RLS
CREATE OR REPLACE FUNCTION setup_new_league()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default league settings (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.league_settings (league_id)
  VALUES (NEW.id);
  
  -- Add creator as member with creator role (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.league_members (league_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'creator');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Generate invite code before insert
CREATE TRIGGER trigger_generate_invite_code
  BEFORE INSERT ON public.leagues
  FOR EACH ROW
  EXECUTE FUNCTION generate_league_invite_code();

-- Trigger: Setup league after insert
CREATE TRIGGER trigger_setup_new_league
  AFTER INSERT ON public.leagues
  FOR EACH ROW
  EXECUTE FUNCTION setup_new_league();

-- Enable RLS
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leagues
-- Simplified to avoid circular references with league_members
CREATE POLICY "Users can view their own leagues"
  ON public.leagues FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can view leagues by invite code"
  ON public.leagues FOR SELECT
  USING (true);  -- Allow anyone to view leagues (needed for join flow)

CREATE POLICY "Users can create leagues"
  ON public.leagues FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "League creators can update their leagues"
  ON public.leagues FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "League creators can delete their leagues"
  ON public.leagues FOR DELETE
  USING (created_by = auth.uid());

-- RLS Policies for league_settings
-- Simplified to avoid circular references
CREATE POLICY "Users can view settings of their leagues"
  ON public.league_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = league_settings.league_id
      AND leagues.created_by = auth.uid()
    )
  );

CREATE POLICY "System can create settings for new leagues"
  ON public.league_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = league_settings.league_id
      AND leagues.created_by = auth.uid()
    )
  );

CREATE POLICY "League creators can update settings"
  ON public.league_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = league_settings.league_id
      AND leagues.created_by = auth.uid()
    )
  );

-- Helper function to check if user is a member of a league
-- SECURITY DEFINER allows it to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION is_league_member(p_league_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.league_members
    WHERE league_id = p_league_id
    AND user_id = p_user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to check if user is a creator/admin of a league
-- SECURITY DEFINER allows it to bypass RLS and avoid infinite recursion
CREATE OR REPLACE FUNCTION is_league_admin(p_league_id UUID, p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.league_members
    WHERE league_id = p_league_id
    AND user_id = p_user_id
    AND role IN ('creator', 'admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Add RLS policy to allow users to view profiles of league members
-- This allows the profiles join to work when fetching league members
CREATE POLICY "Users can view profiles of league members"
  ON public.profiles FOR SELECT
  USING (
    -- Users can view profiles of members in their leagues
    id IN (
      SELECT lm.user_id
      FROM public.league_members lm
      WHERE is_league_member(lm.league_id, auth.uid())
    )
  );

-- RLS Policies for league_members
-- Allow users to see all members of leagues they created or joined
CREATE POLICY "Users can view members of their leagues"
  ON public.league_members FOR SELECT
  USING (
    -- Users can see members of leagues they created
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = league_members.league_id
      AND leagues.created_by = auth.uid()
    )
    OR
    -- Users can see members of leagues they joined
    is_league_member(league_members.league_id, auth.uid())
  );

CREATE POLICY "Users can join leagues"
  ON public.league_members FOR INSERT
  WITH CHECK (
    -- Users can add themselves
    auth.uid() = user_id
    OR
    -- Or league creator can add members (for trigger)
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = league_members.league_id
      AND leagues.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update league memberships"
  ON public.league_members FOR UPDATE
  USING (
    -- Users can update their own membership
    auth.uid() = user_id
    OR
    -- League creators/admins can update any member
    is_league_admin(league_members.league_id, auth.uid())
  );

-- Create indexes
CREATE INDEX idx_leagues_created_by ON public.leagues(created_by);
CREATE INDEX idx_leagues_invite_code ON public.leagues(invite_code);
CREATE INDEX idx_league_members_league_id ON public.league_members(league_id);
CREATE INDEX idx_league_members_user_id ON public.league_members(user_id);
CREATE INDEX idx_league_settings_league_id ON public.league_settings(league_id);
