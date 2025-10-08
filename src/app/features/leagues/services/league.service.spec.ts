import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LeagueService } from './league.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { of, throwError } from 'rxjs';
import { CreateLeagueData, League, LeagueStatus } from '../models/league.model';

describe('LeagueService', () => {
  let service: LeagueService;
  let supabaseMock: jasmine.SpyObj<SupabaseClient>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  };

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

  beforeEach(() => {
    const supabaseSpyObj = jasmine.createSpyObj('SupabaseClient', ['auth', 'from']);
    
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        LeagueService,
        { provide: SupabaseClient, useValue: supabaseSpyObj }
      ]
    });

    service = TestBed.inject(LeagueService);
    supabaseMock = TestBed.inject(SupabaseClient) as jasmine.SpyObj<SupabaseClient>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createLeague', () => {
    it('should create a league with valid data', (done) => {
      const createData: CreateLeagueData = {
        name: 'Test League',
        description: 'Test Description',
        gameType: 'GamePigeon',
        isPrivate: false
      };

      const authSpy = jasmine.createSpyObj('auth', ['getUser']);
      authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: mockUser }, error: null }));
      supabaseMock.auth = authSpy;

      const fromSpy = jasmine.createSpyObj('from', ['insert']);
      const selectSpy = jasmine.createSpyObj('select', ['single']);
      selectSpy.single.and.returnValue(Promise.resolve({ 
        data: {
          id: 'league-123',
          name: 'Test League',
          description: 'Test Description',
          created_by: 'user-123',
          game_type: 'GamePigeon',
          status: 'draft',
          start_date: null,
          end_date: null,
          invite_code: 'LMNR-ABC123',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, 
        error: null 
      }));
      fromSpy.insert.and.returnValue({ select: () => selectSpy });
      supabaseMock.from.and.returnValue(fromSpy);

      service.createLeague(createData).subscribe({
        next: (league) => {
          expect(league.name).toBe('Test League');
          expect(league.inviteCode).toBe('LMNR-ABC123');
          expect(league.createdBy).toBe('user-123');
          done();
        },
        error: done.fail
      });
    });

    it('should throw error when user not authenticated', (done) => {
      const createData: CreateLeagueData = {
        name: 'Test League',
        gameType: 'GamePigeon'
      };

      const authSpy = jasmine.createSpyObj('auth', ['getUser']);
      authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: null }, error: new Error('Not authenticated') }));
      supabaseMock.auth = authSpy;

      service.createLeague(createData).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('User not authenticated');
          done();
        }
      });
    });
  });

  describe('getMyLeagues', () => {
    it('should fetch user leagues', (done) => {
      const authSpy = jasmine.createSpyObj('auth', ['getUser']);
      authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: mockUser }, error: null }));
      supabaseMock.auth = authSpy;

      const queryBuilder: any = {};
      queryBuilder.select = jasmine.createSpy('select').and.returnValue(queryBuilder);
      queryBuilder.eq = jasmine.createSpy('eq').and.returnValue(queryBuilder);
      queryBuilder.order = jasmine.createSpy('order').and.returnValue(Promise.resolve({
        data: [{
          id: 'league-123',
          name: 'Test League',
          description: null,
          created_by: 'user-123',
          game_type: 'GamePigeon',
          status: 'draft',
          start_date: null,
          end_date: null,
          invite_code: 'LMNR-ABC123',
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        error: null
      }));

      supabaseMock.from.and.returnValue(queryBuilder);

      service.getMyLeagues().subscribe({
        next: (leagues) => {
          expect(leagues.length).toBe(1);
          expect(leagues[0].name).toBe('Test League');
          done();
        },
        error: done.fail
      });
    });
  });

  describe('joinLeagueByCode', () => {
    it('should join league with valid code', (done) => {
      const code = 'LMNR-ABC123';

      const authSpy = jasmine.createSpyObj('auth', ['getUser']);
      authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: mockUser }, error: null }));
      supabaseMock.auth = authSpy;

      let callCount = 0;
      supabaseMock.from.and.callFake((table: string) => {
        callCount++;
        
        if (callCount === 1) {
          // First call: find league by code
          const queryBuilder1: any = {};
          queryBuilder1.select = jasmine.createSpy('select').and.returnValue(queryBuilder1);
          queryBuilder1.eq = jasmine.createSpy('eq').and.returnValue(queryBuilder1);
          queryBuilder1.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
            data: { id: 'league-123' },
            error: null
          }));
          return queryBuilder1;
        } else if (callCount === 2) {
          // Second call: insert member
          const queryBuilder2: any = {};
          queryBuilder2.insert = jasmine.createSpy('insert').and.returnValue(Promise.resolve({
            data: null,
            error: null
          }));
          return queryBuilder2;
        } else {
          // Third call: get league details
          const queryBuilder3: any = {};
          queryBuilder3.select = jasmine.createSpy('select').and.returnValue(queryBuilder3);
          queryBuilder3.eq = jasmine.createSpy('eq').and.returnValue(queryBuilder3);
          queryBuilder3.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
            data: {
              id: 'league-123',
              name: 'Test League',
              description: null,
              created_by: 'user-456',
              game_type: 'GamePigeon',
              status: 'draft',
              start_date: null,
              end_date: null,
              invite_code: 'LMNR-ABC123',
              is_private: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            error: null
          }));
          return queryBuilder3;
        }
      });

      service.joinLeagueByCode(code).subscribe({
        next: (league) => {
          expect(league.inviteCode).toBe(code);
          done();
        },
        error: done.fail
      });
    });

    it('should throw error for invalid code', (done) => {
      const code = 'INVALID';

      const authSpy = jasmine.createSpyObj('auth', ['getUser']);
      authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: mockUser }, error: null }));
      supabaseMock.auth = authSpy;

      const queryBuilder: any = {};
      queryBuilder.select = jasmine.createSpy('select').and.returnValue(queryBuilder);
      queryBuilder.eq = jasmine.createSpy('eq').and.returnValue(queryBuilder);
      queryBuilder.single = jasmine.createSpy('single').and.returnValue(Promise.resolve({
        data: null,
        error: { message: 'No rows found' }
      }));

      supabaseMock.from.and.returnValue(queryBuilder);

      service.joinLeagueByCode(code).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toContain('Invalid invite code');
          done();
        }
      });
    });
  });

  describe('leaveLeague', () => {
    it('should leave league successfully', (done) => {
      const leagueId = 'league-123';

      const authSpy = jasmine.createSpyObj('auth', ['getUser']);
      authSpy.getUser.and.returnValue(Promise.resolve({ data: { user: mockUser }, error: null }));
      supabaseMock.auth = authSpy;

      const fromSpy = jasmine.createSpyObj('from', ['update']);
      const updateSpy = jasmine.createSpyObj('update', ['eq']);
      const eqSpy = jasmine.createSpyObj('eq', ['eq']);
      
      eqSpy.eq.and.returnValue(Promise.resolve({ data: null, error: null }));
      updateSpy.eq.and.returnValue(eqSpy);
      fromSpy.update.and.returnValue(updateSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.leaveLeague(leagueId).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done.fail
      });
    });
  });
});
