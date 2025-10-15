-- =====================================================
-- Phase 4: Match Confirmation & Disputes
-- =====================================================
-- This migration adds match dispute/confirmation system
-- Includes: match_disputes table, dispute resolution functions

-- =====================================================
-- UPDATE MATCHES TABLE
-- =====================================================
-- Add dispute-related fields to existing matches table
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS is_disputed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ;

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS disputed_by UUID REFERENCES public.profiles (id);

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS dispute_reason TEXT;

-- Add confirmation fields
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES public.profiles (id);

ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Update status check constraint to include 'disputed' and 'pending'
-- Drop the old constraint and create a new one
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE public.matches
ADD CONSTRAINT matches_status_check CHECK (
    status IN (
        'completed',
        'cancelled',
        'disputed',
        'pending'
    )
);

-- =====================================================
-- MATCH_DISPUTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.match_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,

-- Dispute metadata
disputed_by UUID NOT NULL REFERENCES public.profiles (id),
reason TEXT NOT NULL,
proposed_scores JSONB, -- Format: {"player1_id": score, "player2_id": score}

-- Status
status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN (
        'open',
        'resolved',
        'withdrawn'
    )
),
resolution TEXT CHECK (
    resolution IN (
        'accepted',
        'rejected',
        'modified'
    )
),

-- Resolution
resolved_by UUID REFERENCES public.profiles (id),
resolved_at TIMESTAMPTZ,
resolution_notes TEXT,

-- Timestamps
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

-- Constraints
CHECK ((status = 'resolved' AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL) OR status != 'resolved')
);

-- Indexes
CREATE INDEX idx_disputes_match_id ON public.match_disputes (match_id);

CREATE INDEX idx_disputes_status ON public.match_disputes (status);

CREATE INDEX idx_disputes_disputed_by ON public.match_disputes (disputed_by);

CREATE INDEX idx_disputes_resolved_by ON public.match_disputes (resolved_by);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to create a dispute
CREATE OR REPLACE FUNCTION public.create_match_dispute(
  p_match_id UUID,
  p_disputed_by UUID,
  p_reason TEXT,
  p_proposed_scores JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute_id UUID;
BEGIN
  -- Validate match exists and user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = p_match_id AND profile_id = p_disputed_by
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this match';
  END IF;
  
  -- Validate match is not already disputed
  IF EXISTS (
    SELECT 1 FROM public.matches
    WHERE id = p_match_id AND is_disputed = TRUE
  ) THEN
    RAISE EXCEPTION 'Match is already disputed';
  END IF;
  
  -- Create dispute
  INSERT INTO public.match_disputes (match_id, disputed_by, reason, proposed_scores, status)
  VALUES (p_match_id, p_disputed_by, p_reason, p_proposed_scores, 'open')
  RETURNING id INTO v_dispute_id;
  
  -- Update match
  UPDATE public.matches
  SET is_disputed = TRUE,
      status = 'disputed',
      disputed_at = NOW(),
      disputed_by = p_disputed_by,
      dispute_reason = p_reason
  WHERE id = p_match_id;
  
  RETURN v_dispute_id;
END;
$$;

-- Function to resolve a dispute
CREATE OR REPLACE FUNCTION public.resolve_match_dispute(
  p_dispute_id UUID,
  p_resolved_by UUID,
  p_resolution TEXT,
  p_resolution_notes TEXT DEFAULT NULL,
  p_new_scores JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id UUID;
  v_dispute_record RECORD;
BEGIN
  -- Get dispute
  SELECT * INTO v_dispute_record
  FROM public.match_disputes
  WHERE id = p_dispute_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute not found';
  END IF;
  
  IF v_dispute_record.status != 'open' THEN
    RAISE EXCEPTION 'Dispute is not open';
  END IF;
  
  v_match_id := v_dispute_record.match_id;
  
  -- Validate resolver is a participant
  IF NOT EXISTS (
    SELECT 1 FROM public.match_participants
    WHERE match_id = v_match_id AND profile_id = p_resolved_by
  ) THEN
    RAISE EXCEPTION 'Resolver is not a participant in this match';
  END IF;
  
  -- Update dispute
  UPDATE public.match_disputes
  SET status = 'resolved',
      resolution = p_resolution,
      resolved_by = p_resolved_by,
      resolved_at = NOW(),
      resolution_notes = p_resolution_notes
  WHERE id = p_dispute_id;
  
  -- Apply resolution based on type
  IF p_resolution = 'accepted' THEN
    -- Accept proposed scores
    IF v_dispute_record.proposed_scores IS NOT NULL THEN
      -- Update participant scores from proposed_scores
      UPDATE public.match_participants mp
      SET score = (v_dispute_record.proposed_scores->>mp.profile_id::text)::integer
      WHERE mp.match_id = v_match_id
        AND v_dispute_record.proposed_scores ? mp.profile_id::text;
    END IF;
  ELSIF p_resolution = 'modified' AND p_new_scores IS NOT NULL THEN
    -- Update with negotiated scores
    UPDATE public.match_participants mp
    SET score = (p_new_scores->>mp.profile_id::text)::integer
    WHERE mp.match_id = v_match_id
      AND p_new_scores ? mp.profile_id::text;
  END IF;
  -- For 'rejected', keep original scores
  
  -- Clear dispute from match
  UPDATE public.matches
  SET is_disputed = FALSE,
      status = 'completed',
      disputed_at = NULL,
      disputed_by = NULL,
      dispute_reason = NULL
  WHERE id = v_match_id;
  
  RETURN TRUE;
END;
$$;

-- Function to withdraw a dispute
CREATE OR REPLACE FUNCTION public.withdraw_match_dispute(
  p_dispute_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id UUID;
BEGIN
  -- Get dispute and validate user is the one who created it
  SELECT match_id INTO v_match_id
  FROM public.match_disputes
  WHERE id = p_dispute_id AND disputed_by = p_user_id AND status = 'open';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Dispute not found or user not authorized';
  END IF;
  
  -- Update dispute status
  UPDATE public.match_disputes
  SET status = 'withdrawn',
      updated_at = NOW()
  WHERE id = p_dispute_id;
  
  -- Clear dispute from match
  UPDATE public.matches
  SET is_disputed = FALSE,
      status = 'completed',
      disputed_at = NULL,
      disputed_by = NULL,
      dispute_reason = NULL
  WHERE id = v_match_id;
  
  RETURN TRUE;
END;
$$;

-- Trigger to auto-update updated_at on disputes
CREATE TRIGGER update_match_disputes_updated_at
  BEFORE UPDATE ON public.match_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.match_disputes ENABLE ROW LEVEL SECURITY;

-- Match participants can view disputes for their matches
CREATE POLICY "Match participants can view disputes" ON public.match_disputes FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.match_participants mp
            WHERE
                mp.match_id = match_disputes.match_id
                AND mp.profile_id = auth.uid ()
        )
    );

-- Match participants can create disputes
CREATE POLICY "Match participants can create disputes" ON public.match_disputes FOR INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM public.match_participants mp
            WHERE
                mp.match_id = match_disputes.match_id
                AND mp.profile_id = auth.uid ()
        )
        AND disputed_by = auth.uid ()
    );

-- Dispute creator can update their own disputes (to withdraw)
CREATE POLICY "Dispute creator can update own disputes" ON public.match_disputes
FOR UPDATE
    USING (disputed_by = auth.uid ())
WITH
    CHECK (disputed_by = auth.uid ());

-- =====================================================
-- GRANTS
-- =====================================================
GRANT
SELECT, INSERT,
UPDATE ON public.match_disputes TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_match_dispute(UUID, UUID, TEXT, JSONB) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.resolve_match_dispute (UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;

GRANT
EXECUTE ON FUNCTION public.withdraw_match_dispute (UUID, UUID) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.match_disputes IS 'Match disputes for score corrections and verification';

COMMENT ON FUNCTION public.create_match_dispute (UUID, UUID, TEXT, JSONB) IS 'Creates a new match dispute';

COMMENT ON FUNCTION public.resolve_match_dispute (UUID, UUID, TEXT, TEXT, JSONB) IS 'Resolves a dispute (accepted/rejected/modified)';

COMMENT ON FUNCTION public.withdraw_match_dispute (UUID, UUID) IS 'Withdraws a dispute by its creator';