export enum LeagueStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum MemberRole {
  CREATOR = 'creator',
  ADMIN = 'admin',
  MEMBER = 'member'
}

export enum MemberStatus {
  ACTIVE = 'active',
  LEFT = 'left',
  REMOVED = 'removed'
}

export enum ScoringSystem {
  WIN_LOSS = 'win_loss',
  POINTS = 'points',
  ELO = 'elo'
}

export interface League {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  gameType: string;
  status: LeagueStatus;
  startDate: Date | null;
  endDate: Date | null;
  inviteCode: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeagueSettings {
  id: string;
  leagueId: string;
  scoringSystem: ScoringSystem;
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;
  allowDraws: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeagueMember {
  id: string;
  leagueId: string;
  userId: string;
  joinedAt: Date;
  status: MemberStatus;
  role: MemberRole;
  createdAt: Date;
  // Enriched fields (from join with profiles)
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export interface LeagueInvite {
  id: string;
  leagueId: string;
  invitedBy: string;
  invitedEmail: string;
  invitedUserId: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateLeagueData {
  name: string;
  description?: string;
  gameType: string;
  isPrivate?: boolean;
  settings?: Partial<LeagueSettings>;
}

export interface UpdateLeagueData {
  name?: string;
  description?: string;
  gameType?: string;
  isPrivate?: boolean;
  status?: LeagueStatus;
}

export interface LeagueWithDetails extends League {
  settings: LeagueSettings;
  memberCount: number;
  creatorName: string;
}
