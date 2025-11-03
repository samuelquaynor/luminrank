-- Phase 1: Core League Management
-- Note: gen_random_uuid() is built into PostgreSQL 13+ and doesn't require an extension

-- Create leagues table
CREATE TABLE IF NOT EXISTS public.leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    game_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN (
            'draft',
            'active',
            'completed',
            'archived'
        )
    ),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    invite_code TEXT UNIQUE NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_dates CHECK (
        end_date IS NULL
        OR end_date > start_date
    ),
    CONSTRAINT leagues_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- Create league_settings table
CREATE TABLE IF NOT EXISTS public.league_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    league_id UUID REFERENCES public.leagues (id) ON DELETE CASCADE UNIQUE NOT NULL,
    scoring_system TEXT DEFAULT 'points' CHECK (
        scoring_system IN ('win_loss', 'points')
    ),
    points_per_win INTEGER DEFAULT 3 CHECK (points_per_win > 0),
    points_per_draw INTEGER DEFAULT 1 CHECK (points_per_draw >= 0),
    points_per_loss INTEGER DEFAULT 0 CHECK (points_per_loss >= 0),
    allow_draws BOOLEAN DEFAULT false,
    -- Match generation settings (for Start League feature)
    match_frequency_days INTEGER DEFAULT 7 CHECK (match_frequency_days > 0),
    include_return_fixtures BOOLEAN DEFAULT false,
    submission_window_hours INTEGER DEFAULT 168 CHECK (submission_window_hours > 0), -- 7 days default
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create league_members table
CREATE TABLE IF NOT EXISTS public.league_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    league_id UUID REFERENCES public.leagues (id) ON DELETE CASCADE NOT NULL,
    user_id UUID NOT NULL CONSTRAINT league_members_user_id_fkey REFERENCES public.profiles (id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (
        status IN ('active', 'left', 'removed')
    ),
    role TEXT DEFAULT 'member' CHECK (
        role IN ('creator', 'admin', 'member')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (league_id, user_id)
);

-- Create league_invites table (for Phase 1, mainly for tracking)
CREATE TABLE IF NOT EXISTS public.league_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    league_id UUID REFERENCES public.leagues (id) ON DELETE CASCADE NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.profiles (id),
    invited_email TEXT NOT NULL,
    invited_user_id UUID REFERENCES public.profiles (id),
    status TEXT DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'accepted',
            'declined',
            'expired'
        )
    ),
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
CREATE POLICY "Users can view their own leagues" ON public.leagues FOR
SELECT USING (created_by = auth.uid ());

CREATE POLICY "Users can view leagues by invite code" ON public.leagues FOR
SELECT USING (true);
-- Allow anyone to view leagues (needed for join flow)

CREATE POLICY "Users can create leagues" ON public.leagues FOR INSERT
WITH
    CHECK (auth.uid () = created_by);

CREATE POLICY "League creators can update their leagues" ON public.leagues
FOR UPDATE
    USING (created_by = auth.uid ());

CREATE POLICY "League creators can delete their leagues" ON public.leagues FOR DELETE USING (created_by = auth.uid ());

-- RLS Policies for league_settings
-- Simplified to avoid circular references
CREATE POLICY "Users can view settings of their leagues" ON public.league_settings FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.leagues
            WHERE
                leagues.id = league_settings.league_id
                AND leagues.created_by = auth.uid ()
        )
    );

CREATE POLICY "System can create settings for new leagues" ON public.league_settings FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.leagues
            WHERE
                leagues.id = league_settings.league_id
                AND leagues.created_by = auth.uid ()
        )
    );

CREATE POLICY "League creators can update settings" ON public.league_settings
FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.leagues
            WHERE
                leagues.id = league_settings.league_id
                AND leagues.created_by = auth.uid ()
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
CREATE POLICY "Users can view profiles of league members" ON public.profiles FOR
SELECT USING (
        -- Users can view profiles of members in their leagues
        id IN (
            SELECT lm.user_id
            FROM public.league_members lm
            WHERE
                is_league_member (lm.league_id, auth.uid ())
        )
    );

-- RLS Policies for league_members
-- Allow users to see all members of leagues they created or joined
CREATE POLICY "Users can view members of their leagues" ON public.league_members FOR
SELECT USING (
        -- Users can see members of leagues they created
        EXISTS (
            SELECT 1
            FROM public.leagues
            WHERE
                leagues.id = league_members.league_id
                AND leagues.created_by = auth.uid ()
        )
        OR
        -- Users can see members of leagues they joined
        is_league_member (
            league_members.league_id, auth.uid ()
        )
    );

CREATE POLICY "Users can join leagues" ON public.league_members FOR INSERT
WITH
    CHECK (
        -- Users can add themselves
        auth.uid () = user_id
        OR
        -- Or league creator can add members (for trigger)
        EXISTS (
            SELECT 1
            FROM public.leagues
            WHERE
                leagues.id = league_members.league_id
                AND leagues.created_by = auth.uid ()
        )
    );

CREATE POLICY "Users can update league memberships" ON public.league_members
FOR UPDATE
    USING (
        -- Users can update their own membership
        auth.uid () = user_id
        OR
        -- League creators/admins can update any member
        is_league_admin (
            league_members.league_id,
            auth.uid ()
        )
    );

-- Create indexes
CREATE INDEX idx_leagues_created_by ON public.leagues (created_by);

CREATE INDEX idx_leagues_invite_code ON public.leagues (invite_code);

CREATE INDEX idx_league_members_league_id ON public.league_members (league_id);

CREATE INDEX idx_league_members_user_id ON public.league_members (user_id);

CREATE INDEX idx_league_settings_league_id ON public.league_settings (league_id);

-- =====================================================
-- MATCH GENERATION FUNCTION
-- =====================================================
-- Function to validate league can be started
CREATE OR REPLACE FUNCTION validate_league_start(p_league_id UUID)
RETURNS TABLE (
    valid BOOLEAN,
    message TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_member_count INTEGER;
    v_league_status TEXT;
    v_league_created_by UUID;
BEGIN
    -- Get league info
    SELECT status, created_by INTO v_league_status, v_league_created_by
    FROM public.leagues
    WHERE id = p_league_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'League not found';
        RETURN;
    END IF;
    
    -- Check league status
    IF v_league_status != 'draft' THEN
        RETURN QUERY SELECT false, 'League must be in draft status to start';
        RETURN;
    END IF;
    
    -- Count active members
    SELECT COUNT(*) INTO v_member_count
    FROM public.league_members
    WHERE league_id = p_league_id
    AND status = 'active';
    
    IF v_member_count < 2 THEN
        RETURN QUERY SELECT false, 'League must have at least 2 active members';
        RETURN;
    END IF;
    
    -- Check if matches already exist
    IF EXISTS (SELECT 1 FROM public.matches WHERE league_id = p_league_id) THEN
        RETURN QUERY SELECT false, 'Matches have already been generated for this league';
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'League can be started';
END;
$$;

-- Function to generate round-robin matches for a league
CREATE OR REPLACE FUNCTION generate_matches_for_league(
    p_league_id UUID,
    p_start_date TIMESTAMPTZ
)
RETURNS TABLE (
    matches_created INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_member_count INTEGER;
    v_player_ids UUID[];
    v_rounds INTEGER;
    v_total_matches INTEGER := 0;
    v_match_frequency_days INTEGER;
    v_include_return_fixtures BOOLEAN;
    v_submission_window_hours INTEGER;
    v_scheduled_date TIMESTAMPTZ;
    v_submission_deadline TIMESTAMPTZ;
    v_round_number INTEGER;
    v_home_player_id UUID;
    v_away_player_id UUID;
    v_i INTEGER;
    v_j INTEGER;
    v_temp_player UUID;
    v_player_index INTEGER;
BEGIN
    -- Validate league can be started
    IF NOT EXISTS (
        SELECT 1 FROM validate_league_start(p_league_id)
        WHERE valid = true
    ) THEN
        RAISE EXCEPTION 'League cannot be started. Check validation.';
    END IF;
    
    -- Get league settings
    SELECT 
        match_frequency_days,
        include_return_fixtures,
        submission_window_hours
    INTO
        v_match_frequency_days,
        v_include_return_fixtures,
        v_submission_window_hours
    FROM public.league_settings
    WHERE league_id = p_league_id;
    
    -- Use defaults if not set
    v_match_frequency_days := COALESCE(v_match_frequency_days, 7);
    v_include_return_fixtures := COALESCE(v_include_return_fixtures, false);
    v_submission_window_hours := COALESCE(v_submission_window_hours, 168);
    
    -- Get active member IDs
    SELECT ARRAY_AGG(user_id ORDER BY joined_at)
    INTO v_player_ids
    FROM public.league_members
    WHERE league_id = p_league_id
    AND status = 'active';
    
    v_member_count := array_length(v_player_ids, 1);
    
    IF v_member_count < 2 THEN
        RAISE EXCEPTION 'League must have at least 2 active members';
    END IF;
    
    -- Calculate number of rounds (round-robin algorithm)
    -- For even N: N-1 rounds, For odd N: N rounds (one player gets bye)
    IF v_member_count % 2 = 0 THEN
        v_rounds := v_member_count - 1;
    ELSE
        v_rounds := v_member_count;
        -- Add a placeholder for bye (we'll skip matches with this player)
    END IF;
    
    -- Generate matches using standard round-robin algorithm
    -- Algorithm: Fix player 1, rotate others clockwise each round
    -- Pair from opposite ends: [1 vs N], [2 vs N-1], [3 vs N-2], etc.
    FOR v_round_number IN 1..v_rounds LOOP
        -- Calculate scheduled date for this round
        v_scheduled_date := p_start_date + ((v_round_number - 1) * v_match_frequency_days || ' days')::INTERVAL;
        v_submission_deadline := v_scheduled_date + (v_submission_window_hours || ' hours')::INTERVAL;
        
        -- Standard round-robin: Pair players from opposite ends
        -- For even N: N/2 pairs per round
        -- For odd N: (N-1)/2 pairs per round (one player gets bye)
        DECLARE
            v_pairs_per_round INTEGER;
            v_bye_index INTEGER := 0; -- 0 means no bye
            v_rotated_players UUID[];
        BEGIN
            IF v_member_count % 2 = 0 THEN
                -- Even number of players: N/2 pairs
                v_pairs_per_round := v_member_count / 2;
            ELSE
                -- Odd number of players: (N-1)/2 pairs, one player gets bye
                v_pairs_per_round := (v_member_count - 1) / 2;
                -- Bye rotates each round
                v_bye_index := ((v_round_number - 1) % v_member_count) + 1;
            END IF;
            
            -- Create rotated player array for this round
            -- Position 1 stays fixed, others rotate clockwise
            -- For round r: rotate positions 2..N by (r-1) positions
            v_rotated_players := v_player_ids; -- Start with original
            
            IF v_member_count % 2 = 0 THEN
                -- Even: Rotate all except first player
                -- For round r, player at position i moves to: ((i-2+r-1) % (N-1)) + 2
                DECLARE
                    v_temp_players UUID[];
                    v_new_pos INTEGER;
                BEGIN
                    v_temp_players := ARRAY[v_player_ids[1]]; -- Keep first player
                    FOR v_j IN 2..v_member_count LOOP
                        v_new_pos := ((v_j - 2 + v_round_number - 1) % (v_member_count - 1)) + 2;
                        v_temp_players := v_temp_players || v_player_ids[v_new_pos];
                    END LOOP;
                    v_rotated_players := v_temp_players;
                END;
            ELSE
                -- Odd: Similar but account for bye
                -- Bye doesn't move, but positions rotate around it
                DECLARE
                    v_temp_players UUID[];
                    v_j INTEGER;
                BEGIN
                    FOR v_j IN 1..v_member_count LOOP
                        IF v_j = v_bye_index THEN
                            v_temp_players := v_temp_players || v_player_ids[v_j];
                        ELSE
                            -- Calculate rotated position (excluding bye)
                            DECLARE
                                v_pos_without_bye INTEGER;
                                v_new_pos_without_bye INTEGER;
                                v_new_pos INTEGER;
                            BEGIN
                                -- Position without bye (1..N-1)
                                IF v_j < v_bye_index THEN
                                    v_pos_without_bye := v_j;
                                ELSE
                                    v_pos_without_bye := v_j - 1;
                                END IF;
                                
                                -- Rotate
                                v_new_pos_without_bye := ((v_pos_without_bye - 1 + v_round_number - 1) % (v_member_count - 1)) + 1;
                                
                                -- Map back to real position
                                IF v_new_pos_without_bye < v_bye_index THEN
                                    v_new_pos := v_new_pos_without_bye;
                                ELSE
                                    v_new_pos := v_new_pos_without_bye + 1;
                                END IF;
                                
                                v_temp_players := v_temp_players || v_player_ids[v_new_pos];
                            END;
                        END IF;
                    END LOOP;
                    v_rotated_players := v_temp_players;
                END;
            END IF;
            
            -- Generate pairs for this round
            v_i := 1;
            WHILE v_i <= v_pairs_per_round LOOP
                -- Pair from opposite ends: [i] vs [N+1-i]
                DECLARE
                    v_pos1 INTEGER := v_i;
                    v_pos2 INTEGER := v_member_count + 1 - v_i;
                BEGIN
                    -- Skip if either position is bye (for odd N)
                    IF v_member_count % 2 = 1 THEN
                        IF v_pos1 = v_bye_index OR v_pos2 = v_bye_index THEN
                            v_i := v_i + 1;
                            CONTINUE;
                        END IF;
                    END IF;
                    
                    -- Get player IDs from rotated array
                    v_home_player_id := v_rotated_players[v_pos1];
                    v_away_player_id := v_rotated_players[v_pos2];
                    
                    -- Safety check
                    IF v_home_player_id = v_away_player_id OR v_pos1 = v_pos2 THEN
                        v_i := v_i + 1;
                        CONTINUE;
                    END IF;
                    
                    -- Create match
                    INSERT INTO public.matches (
                        league_id,
                        round_number,
                        scheduled_date,
                        submission_deadline,
                        home_player_id,
                        away_player_id,
                        status
                    ) VALUES (
                        p_league_id,
                        v_round_number,
                        v_scheduled_date,
                        v_submission_deadline,
                        v_home_player_id,
                        v_away_player_id,
                        'scheduled'
                    );
                    
                    v_total_matches := v_total_matches + 1;
                    
                    -- Create return fixture if enabled
                    IF v_include_return_fixtures THEN
                        INSERT INTO public.matches (
                            league_id,
                            round_number,
                            scheduled_date,
                            submission_deadline,
                            home_player_id,
                            away_player_id,
                            status
                        ) VALUES (
                            p_league_id,
                            v_round_number + v_rounds,
                            v_scheduled_date + (v_rounds * v_match_frequency_days || ' days')::INTERVAL,
                            v_submission_deadline + (v_rounds * v_match_frequency_days || ' days')::INTERVAL,
                            v_away_player_id,
                            v_home_player_id,
                            'scheduled'
                        );
                        
                        v_total_matches := v_total_matches + 1;
                    END IF;
                END;
                
                v_i := v_i + 1;
            END LOOP;
        END;
    END LOOP;
    
    -- Update league status to 'active' and set start_date
    UPDATE public.leagues
    SET status = 'active',
        start_date = p_start_date,
        updated_at = NOW()
    WHERE id = p_league_id;
    
    RETURN QUERY SELECT v_total_matches;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_league_start(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_matches_for_league(UUID, TIMESTAMPTZ) TO authenticated;