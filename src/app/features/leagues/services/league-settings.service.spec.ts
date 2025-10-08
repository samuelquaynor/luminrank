import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LeagueSettingsService } from './league-settings.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { LeagueSettings, ScoringSystem } from '../models/league.model';

describe('LeagueSettingsService', () => {
  let service: LeagueSettingsService;
  let supabaseMock: jasmine.SpyObj<SupabaseClient>;

  const mockSettings: LeagueSettings = {
    id: 'settings-123',
    leagueId: 'league-123',
    scoringSystem: ScoringSystem.POINTS,
    pointsPerWin: 3,
    pointsPerDraw: 1,
    pointsPerLoss: 0,
    allowDraws: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    const supabaseSpyObj = jasmine.createSpyObj('SupabaseClient', ['from']);
    
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        LeagueSettingsService,
        { provide: SupabaseClient, useValue: supabaseSpyObj }
      ]
    });

    service = TestBed.inject(LeagueSettingsService);
    supabaseMock = TestBed.inject(SupabaseClient) as jasmine.SpyObj<SupabaseClient>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSettings', () => {
    it('should fetch league settings', (done) => {
      const leagueId = 'league-123';

      const fromSpy = jasmine.createSpyObj('from', ['select']);
      const selectSpy = jasmine.createSpyObj('select', ['eq']);
      const eqSpy = jasmine.createSpyObj('eq', ['single']);

      eqSpy.single.and.returnValue(Promise.resolve({
        data: {
          id: 'settings-123',
          league_id: 'league-123',
          scoring_system: 'points',
          points_per_win: 3,
          points_per_draw: 1,
          points_per_loss: 0,
          allow_draws: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      }));

      selectSpy.eq.and.returnValue(eqSpy);
      fromSpy.select.and.returnValue(selectSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.getSettings(leagueId).subscribe({
        next: (settings) => {
          expect(settings.leagueId).toBe(leagueId);
          expect(settings.scoringSystem).toBe(ScoringSystem.POINTS);
          expect(settings.pointsPerWin).toBe(3);
          done();
        },
        error: done.fail
      });
    });

    it('should handle errors when fetching settings', (done) => {
      const leagueId = 'league-123';

      const fromSpy = jasmine.createSpyObj('from', ['select']);
      const selectSpy = jasmine.createSpyObj('select', ['eq']);
      const eqSpy = jasmine.createSpyObj('eq', ['single']);

      eqSpy.single.and.returnValue(Promise.resolve({
        data: null,
        error: { message: 'Settings not found' }
      }));

      selectSpy.eq.and.returnValue(eqSpy);
      fromSpy.select.and.returnValue(selectSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.getSettings(leagueId).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });
    });
  });

  describe('updateSettings', () => {
    it('should update league settings', (done) => {
      const leagueId = 'league-123';
      const updates = {
        pointsPerWin: 5,
        allowDraws: true
      };

      const fromSpy = jasmine.createSpyObj('from', ['update']);
      const updateSpy = jasmine.createSpyObj('update', ['eq']);
      const eqSpy = jasmine.createSpyObj('eq', ['select']);
      const selectSpy = jasmine.createSpyObj('select', ['single']);

      selectSpy.single.and.returnValue(Promise.resolve({
        data: {
          id: 'settings-123',
          league_id: 'league-123',
          scoring_system: 'points',
          points_per_win: 5,
          points_per_draw: 1,
          points_per_loss: 0,
          allow_draws: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      }));

      eqSpy.select.and.returnValue(selectSpy);
      updateSpy.eq.and.returnValue(eqSpy);
      fromSpy.update.and.returnValue(updateSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.updateSettings(leagueId, updates).subscribe({
        next: (settings) => {
          expect(settings.pointsPerWin).toBe(5);
          expect(settings.allowDraws).toBe(true);
          done();
        },
        error: done.fail
      });
    });

    it('should handle errors when updating settings', (done) => {
      const leagueId = 'league-123';
      const updates = { pointsPerWin: 5 };

      const fromSpy = jasmine.createSpyObj('from', ['update']);
      const updateSpy = jasmine.createSpyObj('update', ['eq']);
      const eqSpy = jasmine.createSpyObj('eq', ['select']);
      const selectSpy = jasmine.createSpyObj('select', ['single']);

      selectSpy.single.and.returnValue(Promise.resolve({
        data: null,
        error: { message: 'Update failed' }
      }));

      eqSpy.select.and.returnValue(selectSpy);
      updateSpy.eq.and.returnValue(eqSpy);
      fromSpy.update.and.returnValue(updateSpy);
      supabaseMock.from.and.returnValue(fromSpy);

      service.updateSettings(leagueId, updates).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });
    });
  });
});
