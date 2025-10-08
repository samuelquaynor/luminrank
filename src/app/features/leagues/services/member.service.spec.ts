import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MemberService } from './member.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { LeagueMember, MemberRole, MemberStatus } from '../models/league.model';

describe('MemberService', () => {
  let service: MemberService;
  let supabaseMock: jasmine.SpyObj<SupabaseClient>;

  const mockMember: LeagueMember = {
    id: 'member-123',
    leagueId: 'league-123',
    userId: 'user-123',
    joinedAt: new Date(),
    status: MemberStatus.ACTIVE,
    role: MemberRole.MEMBER,
    createdAt: new Date(),
    userName: 'Test User',
    userEmail: 'test@example.com'
  };

  beforeEach(() => {
    const supabaseSpyObj = jasmine.createSpyObj('SupabaseClient', ['from']);
    
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MemberService,
        { provide: SupabaseClient, useValue: supabaseSpyObj }
      ]
    });

    service = TestBed.inject(MemberService);
    supabaseMock = TestBed.inject(SupabaseClient) as jasmine.SpyObj<SupabaseClient>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLeagueMembers', () => {
    it('should fetch league members', (done) => {
      const leagueId = 'league-123';

      const queryBuilder: any = {};
      queryBuilder.select = jasmine.createSpy('select').and.returnValue(queryBuilder);
      queryBuilder.eq = jasmine.createSpy('eq').and.returnValue(queryBuilder);
      queryBuilder.order = jasmine.createSpy('order').and.returnValue(Promise.resolve({
        data: [{
          id: 'member-123',
          league_id: 'league-123',
          user_id: 'user-123',
          joined_at: new Date().toISOString(),
          status: 'active',
          role: 'member',
          created_at: new Date().toISOString(),
          profiles: {
            name: 'Test User',
            email: 'test@example.com',
            avatar_url: null
          }
        }],
        error: null
      }));

      supabaseMock.from.and.returnValue(queryBuilder);

      service.getLeagueMembers(leagueId).subscribe({
        next: (members) => {
          expect(members.length).toBe(1);
          expect(members[0].userName).toBe('Test User');
          expect(members[0].role).toBe(MemberRole.MEMBER);
          done();
        },
        error: done.fail
      });
    });

    it('should handle errors when fetching members', (done) => {
      const leagueId = 'league-123';

      const queryBuilder: any = {};
      queryBuilder.select = jasmine.createSpy('select').and.returnValue(queryBuilder);
      queryBuilder.eq = jasmine.createSpy('eq').and.returnValue(queryBuilder);
      queryBuilder.order = jasmine.createSpy('order').and.returnValue(Promise.resolve({
        data: null,
        error: { message: 'Database error' }
      }));

      supabaseMock.from.and.returnValue(queryBuilder);

      service.getLeagueMembers(leagueId).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });
    });
  });

  describe('addMember', () => {
    it('should add a member to league', (done) => {
      const leagueId = 'league-123';
      const userId = 'user-456';

      const fromSpy = jasmine.createSpyObj('from', ['insert']);
      const insertSpy = jasmine.createSpyObj('insert', ['select']);
      const selectSpy = jasmine.createSpyObj('select', ['single']);

      selectSpy.single.and.returnValue(Promise.resolve({
        data: {
          id: 'member-456',
          league_id: leagueId,
          user_id: userId,
          joined_at: new Date().toISOString(),
          status: 'active',
          role: 'member',
          created_at: new Date().toISOString(),
          profiles: {
            name: 'New User',
            email: 'new@example.com',
            avatar_url: null
          }
        },
        error: null
      }));

      insertSpy.select.and.returnValue(selectSpy);
      fromSpy.insert.and.returnValue(insertSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.addMember(leagueId, userId).subscribe({
        next: (member) => {
          expect(member.userId).toBe(userId);
          expect(member.role).toBe(MemberRole.MEMBER);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('removeMember', () => {
    it('should remove a member from league', (done) => {
      const leagueId = 'league-123';
      const userId = 'user-456';

      const fromSpy = jasmine.createSpyObj('from', ['update']);
      const updateSpy = jasmine.createSpyObj('update', ['eq']);
      const eqSpy = jasmine.createSpyObj('eq', ['eq']);

      eqSpy.eq.and.returnValue(Promise.resolve({ data: null, error: null }));
      updateSpy.eq.and.returnValue(eqSpy);
      fromSpy.update.and.returnValue(updateSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.removeMember(leagueId, userId).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('isMember', () => {
    it('should return true if user is member', (done) => {
      const leagueId = 'league-123';
      const userId = 'user-123';

      const fromSpy = jasmine.createSpyObj('from', ['select']);
      const selectSpy = jasmine.createSpyObj('select', ['eq']);
      const eq1Spy = jasmine.createSpyObj('eq', ['eq']);
      const eq2Spy = jasmine.createSpyObj('eq', ['eq']);
      const eq3Spy = jasmine.createSpyObj('eq', ['single']);

      eq3Spy.single.and.returnValue(Promise.resolve({
        data: { id: 'member-123' },
        error: null
      }));

      eq2Spy.eq.and.returnValue(eq3Spy);
      eq1Spy.eq.and.returnValue(eq2Spy);
      selectSpy.eq.and.returnValue(eq1Spy);
      fromSpy.select.and.returnValue(selectSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.isMember(leagueId, userId).subscribe({
        next: (isMember) => {
          expect(isMember).toBe(true);
          done();
        },
        error: done.fail
      });
    });

    it('should return false if user is not member', (done) => {
      const leagueId = 'league-123';
      const userId = 'user-456';

      const fromSpy = jasmine.createSpyObj('from', ['select']);
      const selectSpy = jasmine.createSpyObj('select', ['eq']);
      const eq1Spy = jasmine.createSpyObj('eq', ['eq']);
      const eq2Spy = jasmine.createSpyObj('eq', ['eq']);
      const eq3Spy = jasmine.createSpyObj('eq', ['single']);

      eq3Spy.single.and.returnValue(Promise.resolve({
        data: null,
        error: { code: 'PGRST116' }
      }));

      eq2Spy.eq.and.returnValue(eq3Spy);
      eq1Spy.eq.and.returnValue(eq2Spy);
      selectSpy.eq.and.returnValue(eq1Spy);
      fromSpy.select.and.returnValue(selectSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.isMember(leagueId, userId).subscribe({
        next: (isMember) => {
          expect(isMember).toBe(false);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getUserRole', () => {
    it('should return user role', (done) => {
      const leagueId = 'league-123';
      const userId = 'user-123';

      const fromSpy = jasmine.createSpyObj('from', ['select']);
      const selectSpy = jasmine.createSpyObj('select', ['eq']);
      const eq1Spy = jasmine.createSpyObj('eq', ['eq']);
      const eq2Spy = jasmine.createSpyObj('eq', ['eq']);
      const eq3Spy = jasmine.createSpyObj('eq', ['single']);

      eq3Spy.single.and.returnValue(Promise.resolve({
        data: { role: 'creator' },
        error: null
      }));

      eq2Spy.eq.and.returnValue(eq3Spy);
      eq1Spy.eq.and.returnValue(eq2Spy);
      selectSpy.eq.and.returnValue(eq1Spy);
      fromSpy.select.and.returnValue(selectSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.getUserRole(leagueId, userId).subscribe({
        next: (role) => {
          expect(role).toBe(MemberRole.CREATOR);
          done();
        },
        error: done.fail
      });
    });

    it('should return null if user not member', (done) => {
      const leagueId = 'league-123';
      const userId = 'user-456';

      const fromSpy = jasmine.createSpyObj('from', ['select']);
      const selectSpy = jasmine.createSpyObj('select', ['eq']);
      const eq1Spy = jasmine.createSpyObj('eq', ['eq']);
      const eq2Spy = jasmine.createSpyObj('eq', ['eq']);
      const eq3Spy = jasmine.createSpyObj('eq', ['single']);

      eq3Spy.single.and.returnValue(Promise.resolve({
        data: null,
        error: { code: 'PGRST116' }
      }));

      eq2Spy.eq.and.returnValue(eq3Spy);
      eq1Spy.eq.and.returnValue(eq2Spy);
      selectSpy.eq.and.returnValue(eq1Spy);
      fromSpy.select.and.returnValue(selectSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.getUserRole(leagueId, userId).subscribe({
        next: (role) => {
          expect(role).toBeNull();
          done();
        },
        error: done.fail
      });
    });
  });
});
