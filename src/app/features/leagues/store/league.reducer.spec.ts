import { leagueReducer, initialState, LeagueState } from './league.reducer';
import * as LeagueActions from './league.actions';
import { League, LeagueStatus, LeagueMember, MemberRole, MemberStatus } from '../models/league.model';

describe('LeagueReducer', () => {
  const mockLeague: League = {
    id: 'league-123',
    name: 'Test League',
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

  const mockMember: LeagueMember = {
    id: 'member-123',
    leagueId: 'league-123',
    userId: 'user-123',
    joinedAt: new Date(),
    status: MemberStatus.ACTIVE,
    role: MemberRole.MEMBER,
    createdAt: new Date()
  };

  describe('unknown action', () => {
    it('should return the default state', () => {
      const action = { type: 'Unknown' } as any;
      const result = leagueReducer(initialState, action);

      expect(result).toBe(initialState);
    });
  });

  describe('loadMyLeagues', () => {
    it('should set loading to true', () => {
      const action = LeagueActions.loadMyLeagues();
      const result = leagueReducer(initialState, action);

      expect(result.loading).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('loadMyLeaguesSuccess', () => {
    it('should update leagues and set loading to false', () => {
      const leagues = [mockLeague];
      const action = LeagueActions.loadMyLeaguesSuccess({ leagues });
      const result = leagueReducer(initialState, action);

      expect(result.leagues).toEqual(leagues);
      expect(result.loading).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  describe('loadMyLeaguesFailure', () => {
    it('should set error and loading to false', () => {
      const error = 'Failed to load leagues';
      const action = LeagueActions.loadMyLeaguesFailure({ error });
      const result = leagueReducer(initialState, action);

      expect(result.error).toBe(error);
      expect(result.loading).toBe(false);
    });
  });

  describe('createLeagueSuccess', () => {
    it('should add new league to the beginning of the list', () => {
      const existingLeague = { ...mockLeague, id: 'league-456' };
      const state: LeagueState = {
        ...initialState,
        leagues: [existingLeague]
      };
      
      const action = LeagueActions.createLeagueSuccess({ league: mockLeague });
      const result = leagueReducer(state, action);

      expect(result.leagues.length).toBe(2);
      expect(result.leagues[0]).toEqual(mockLeague);
      expect(result.leagues[1]).toEqual(existingLeague);
      expect(result.loading).toBe(false);
    });
  });

  describe('updateLeagueSuccess', () => {
    it('should update league in the list', () => {
      const state: LeagueState = {
        ...initialState,
        leagues: [mockLeague]
      };
      
      const updatedLeague = { ...mockLeague, name: 'Updated League' };
      const action = LeagueActions.updateLeagueSuccess({ league: updatedLeague });
      const result = leagueReducer(state, action);

      expect(result.leagues[0].name).toBe('Updated League');
      expect(result.loading).toBe(false);
    });

    it('should update selected league if it matches', () => {
      const state: LeagueState = {
        ...initialState,
        selectedLeague: {
          ...mockLeague,
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
          memberCount: 1,
          creatorName: 'Test User'
        }
      };
      
      const updatedLeague = { ...mockLeague, name: 'Updated League' };
      const action = LeagueActions.updateLeagueSuccess({ league: updatedLeague });
      const result = leagueReducer(state, action);

      expect(result.selectedLeague?.name).toBe('Updated League');
    });
  });

  describe('deleteLeagueSuccess', () => {
    it('should remove league from the list', () => {
      const state: LeagueState = {
        ...initialState,
        leagues: [mockLeague]
      };
      
      const action = LeagueActions.deleteLeagueSuccess({ id: mockLeague.id });
      const result = leagueReducer(state, action);

      expect(result.leagues.length).toBe(0);
      expect(result.loading).toBe(false);
    });

    it('should clear selected league if it matches', () => {
      const state: LeagueState = {
        ...initialState,
        selectedLeague: {
          ...mockLeague,
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
          memberCount: 1,
          creatorName: 'Test User'
        }
      };
      
      const action = LeagueActions.deleteLeagueSuccess({ id: mockLeague.id });
      const result = leagueReducer(state, action);

      expect(result.selectedLeague).toBeNull();
    });
  });

  describe('joinLeagueSuccess', () => {
    it('should add joined league to the beginning of the list', () => {
      const action = LeagueActions.joinLeagueSuccess({ league: mockLeague });
      const result = leagueReducer(initialState, action);

      expect(result.leagues.length).toBe(1);
      expect(result.leagues[0]).toEqual(mockLeague);
      expect(result.loading).toBe(false);
    });
  });

  describe('leaveLeagueSuccess', () => {
    it('should remove league from the list', () => {
      const state: LeagueState = {
        ...initialState,
        leagues: [mockLeague]
      };
      
      const action = LeagueActions.leaveLeagueSuccess({ id: mockLeague.id });
      const result = leagueReducer(state, action);

      expect(result.leagues.length).toBe(0);
      expect(result.loading).toBe(false);
    });
  });

  describe('loadLeagueMembersSuccess', () => {
    it('should store members for the league', () => {
      const members = [mockMember];
      const action = LeagueActions.loadLeagueMembersSuccess({ 
        leagueId: 'league-123', 
        members 
      });
      const result = leagueReducer(initialState, action);

      expect(result.members['league-123']).toEqual(members);
      expect(result.loading).toBe(false);
    });

    it('should not affect members of other leagues', () => {
      const existingMember = { ...mockMember, id: 'member-456', leagueId: 'league-456' };
      const state: LeagueState = {
        ...initialState,
        members: {
          'league-456': [existingMember]
        }
      };
      
      const newMembers = [mockMember];
      const action = LeagueActions.loadLeagueMembersSuccess({ 
        leagueId: 'league-123', 
        members: newMembers 
      });
      const result = leagueReducer(state, action);

      expect(result.members['league-123']).toEqual(newMembers);
      expect(result.members['league-456']).toEqual([existingMember]);
    });
  });
});
