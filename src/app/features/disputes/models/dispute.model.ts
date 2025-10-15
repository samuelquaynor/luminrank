export interface Dispute {
  id: string;
  match_id: string;
  disputed_by: string;
  reason: string;
  proposed_scores: Record<string, number> | null;
  status: 'open' | 'resolved' | 'withdrawn';
  resolution: 'accepted' | 'rejected' | 'modified' | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeWithDetails extends Dispute {
  disputed_by_name?: string;
  resolved_by_name?: string;
  match_details?: {
    match_date: string;
    participants: Array<{
      profile_id: string;
      display_name: string;
      score: number;
      result: string;
    }>;
  };
}

export interface CreateDisputeRequest {
  match_id: string;
  reason: string;
  proposed_scores?: Record<string, number>;
}

export interface ResolveDisputeRequest {
  dispute_id: string;
  resolution: 'accepted' | 'rejected' | 'modified';
  resolution_notes?: string;
  new_scores?: Record<string, number>;
}

