/**
 * Season Models - Phase 3
 * Represents a time-boxed competition period within a league
 */

export enum SeasonStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Season {
  id: string;
  league_id: string;
  
  // Metadata
  name: string;
  description: string | null;
  season_number: number;
  
  // Time bounds
  start_date: string;
  end_date: string | null;
  
  // Status
  status: SeasonStatus;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateSeasonRequest {
  league_id: string;
  name: string;
  description?: string;
  season_number: number;
  start_date: string;
  end_date?: string;
  status?: SeasonStatus;
}

export interface UpdateSeasonRequest {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: SeasonStatus;
}

export interface SeasonWithStats extends Season {
  total_fixtures: number;
  completed_fixtures: number;
  scheduled_fixtures: number;
  overdue_fixtures: number;
}

