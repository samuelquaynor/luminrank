import * as fromLeague from './league.selectors';
import { LeagueState } from './league.reducer';
import { League, LeagueStatus, LeagueMember, MemberRole, MemberStatus } from '../models/league.model';

describe('League Selectors', () => {
  const mockLeague1: League = {
    id: 'league-123',
    name: 'Test League 1',
    description: 'Test Description',
    createdBy: 'user-123',
    gameType: 'GamePigeon',
    status: LeagueStatus.DRAFT,
    startDate: null,
    endDate: null,
    inviteCode: 'LMNR-ABC123',
    isPrivate: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockLeague2: League = {
    ...mockLeague1,
    id: 'league-456',
    name: 'Test League 2',
    inviteCode: 'LMNR-DEF456'
  };

  const mockMember: LeagueMember = {
    id: 'member-123',
    leagueId: 'league-123',
    userId: 'user-123',
    joinedAt: new Date(),
    status: MemberStatus.ACTIVE,
    role: MemberRole.MEMBER,
    createdAt: new Date()
  };

  const mockState: LeagueState = {
    leagues: [mockLeague1, mockLeague2],
    selectedLeague: {
      ...mockLeague1,
      settings: {
        id: 'settings-123',
        leagueId: 'league-123',
        scoringSystem: 'points' as any,
        pointsPerWin: 3,
        pointsPerDraw: 1,
        pointsPerLoss: 0,
        allowDraws: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      memberCount: 2,
      creatorName: 'Test User'
    },
    members: {
      'league-123': [mockMember]
    },
    loading: false,
    error: null
  };

  describe('selectAllLeagues', () => {
    it('should return all leagues', () => {
      const result = fromLeague.selectAllLeagues.projector(mockState);
      expect(result).toEqual([mockLeague1, mockLeague2]);
    });
  });

  describe('selectSelectedLeague', () => {
    it('should return selected league', () => {
      const result = fromLeague.selectSelectedLeague.projector(mockState);
      expect(result).toEqual(mockState.selectedLeague);
    });
  });

  describe('selectLeagueLoading', () => {
    it('should return loading state', () => {
      const result = fromLeague.selectLeagueLoading.projector(mockState);
      expect(result).toBe(false);
    });
  });

  describe('selectLeagueError', () => {
    it('should return error state', () => {
      const result = fromLeague.selectLeagueError.projector(mockState);
      expect(result).toBeNull();
    });
  });

  describe('selectLeagueById', () => {
    it('should return league with matching id', () => {
      const selector = fromLeague.selectLeagueById('league-123');
      const result = selector.projector([mockLeague1, mockLeague2]);
      expect(result).toEqual(mockLeague1);
    });

    it('should return undefined for non-existent id', () => {
      const selector = fromLeague.selectLeagueById('non-existent');
      const result = selector.projector([mockLeague1, mockLeague2]);
      expect(result).toBeUndefined();
    });
  });

  describe('selectLeagueMembers', () => {
    it('should return members for the league', () => {
      const selector = fromLeague.selectLeagueMembers('league-123');
      const result = selector.projector(mockState);
      expect(result).toEqual([mockMember]);
    });

    it('should return empty array for league with no members', () => {
      const selector = fromLeague.selectLeagueMembers('league-456');
      const result = selector.projector(mockState);
      expect(result).toEqual([]);
    });
  });

  describe('selectMyLeaguesCount', () => {
    it('should return count of leagues', () => {
      const result = fromLeague.selectMyLeaguesCount.projector([mockLeague1, mockLeague2]);
      expect(result).toBe(2);
    });

    it('should return 0 for empty leagues array', () => {
      const result = fromLeague.selectMyLeaguesCount.projector([]);
      expect(result).toBe(0);
    });
  });
});
