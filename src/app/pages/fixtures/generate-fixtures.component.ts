import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { AppState } from '../../store/app.state';
import * as SeasonActions from '../../features/fixtures/store/season.actions';
import * as FixtureActions from '../../features/fixtures/store/fixture.actions';
import * as LeagueActions from '../../features/leagues/store/league.actions';
import { selectLeagueById } from '../../features/leagues/store/league.selectors';
import { selectAllSeasons, selectSeasonLoading } from '../../features/fixtures/store/season.selectors';
import { selectGenerationResult, selectFixtureLoading } from '../../features/fixtures/store/fixture.selectors';
import { selectLeagueMembers } from '../../features/leagues/store/league.selectors';
import { Season, SeasonStatus } from '../../features/fixtures/models/season.model';
import { GenerateFixturesRequest } from '../../features/fixtures/models/fixture.model';

@Component({
  selector: 'app-generate-fixtures',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generate-fixtures.component.html'
})
export class GenerateFixturesComponent implements OnInit, OnDestroy {
  private store = inject(Store<AppState>);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  leagueId = '';
  league$ = this.store.select(selectLeagueById(this.leagueId));
  seasons$ = this.store.select(selectAllSeasons);
  members$ = this.store.select(selectLeagueMembers(this.leagueId));
  seasonLoading$ = this.store.select(selectSeasonLoading);
  fixtureLoading$ = this.store.select(selectFixtureLoading);
  generationResult$ = this.store.select(selectGenerationResult);

  currentStep = 1;
  selectedSeason: Season | null = null;
  createNewSeason = false;

  // Forms
  seasonForm: FormGroup;
  settingsForm: FormGroup;

  private subscriptions = new Subscription();

  constructor() {
    // Season selection/creation form
    this.seasonForm = this.fb.group({
      seasonId: [''],
      newSeasonName: ['', Validators.required],
      newSeasonNumber: [1, [Validators.required, Validators.min(1)]],
      startDate: ['', Validators.required]
    });

    // Fixture generation settings form
    this.settingsForm = this.fb.group({
      startDate: ['', Validators.required],
      matchFrequencyDays: [7, [Validators.required, Validators.min(1), Validators.max(365)]],
      includeReturnFixtures: [false],
      submissionWindowHours: [24, [Validators.required, Validators.min(1), Validators.max(720)]]
    });
  }

  ngOnInit() {
    this.leagueId = this.route.snapshot.paramMap.get('id') || '';
    
    // Load league data
    this.store.dispatch(LeagueActions.loadLeague({ id: this.leagueId }));
    this.store.dispatch(LeagueActions.loadLeagueMembers({ leagueId: this.leagueId }));
    this.store.dispatch(SeasonActions.loadLeagueSeasons({ leagueId: this.leagueId }));

    // Watch for successful generation
    this.subscriptions.add(
      this.generationResult$.subscribe(result => {
        if (result) {
          // Navigate back to league detail fixtures tab
          this.router.navigate(['/leagues', this.leagueId], { 
            fragment: 'fixtures',
            queryParams: { generated: 'true' }
          });
        }
      })
    );

    // Set default start date to next Monday
    const nextMonday = this.getNextMonday();
    this.settingsForm.patchValue({
      startDate: nextMonday.toISOString().split('T')[0]
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  // Navigation
  nextStep() {
    if (this.currentStep === 1 && this.validateStep1()) {
      this.currentStep = 2;
    } else if (this.currentStep === 2 && this.validateStep2()) {
      this.currentStep = 3;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number) {
    if (step < this.currentStep) {
      this.currentStep = step;
    }
  }

  // Validation
  validateStep1(): boolean {
    if (this.createNewSeason) {
      return this.seasonForm.get('newSeasonName')?.valid && 
             this.seasonForm.get('newSeasonNumber')?.valid &&
             this.seasonForm.get('startDate')?.valid || false;
    }
    return !!this.selectedSeason;
  }

  validateStep2(): boolean {
    return this.settingsForm.valid;
  }

  // Season selection
  selectExistingSeason(season: Season) {
    this.selectedSeason = season;
    this.createNewSeason = false;
  }

  toggleCreateNewSeason() {
    this.createNewSeason = !this.createNewSeason;
    this.selectedSeason = null;
  }

  // Generation
  async generateFixtures() {
    let seasonId = this.selectedSeason?.id;

    // Create new season if needed
    if (this.createNewSeason) {
      const seasonData = {
        league_id: this.leagueId,
        name: this.seasonForm.value.newSeasonName,
        season_number: this.seasonForm.value.newSeasonNumber,
        start_date: this.seasonForm.value.startDate,
        status: SeasonStatus.ACTIVE
      };

      // Dispatch create season action and wait for success
      // In a real app, we'd subscribe to the success action
      // For simplicity, we'll proceed with the assumption it succeeds
      this.store.dispatch(SeasonActions.createSeason({ request: seasonData }));
      
      // TODO: Wait for season creation success before proceeding
      // For now, we'll skip season linking
    }

    const request: GenerateFixturesRequest = {
      league_id: this.leagueId,
      ...(seasonId && { season_id: seasonId }),
      start_date: new Date(this.settingsForm.value.startDate + 'T00:00:00Z').toISOString(),
      match_frequency_days: this.settingsForm.value.matchFrequencyDays,
      include_return_fixtures: this.settingsForm.value.includeReturnFixtures,
      submission_window_hours: this.settingsForm.value.submissionWindowHours
    };

    this.store.dispatch(FixtureActions.generateFixtures({ request }));
  }

  cancel() {
    this.router.navigate(['/leagues', this.leagueId]);
  }

  // Helpers
  private getNextMonday(): Date {
    const today = new Date();
    const day = today.getDay();
    const daysUntilMonday = day === 0 ? 1 : (8 - day);
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday;
  }

  calculateTotalFixtures(memberCount: number, returnFixtures: boolean): number {
    if (memberCount < 2) return 0;
    const singleRound = (memberCount * (memberCount - 1)) / 2;
    return returnFixtures ? singleRound * 2 : singleRound;
  }

  calculateTotalRounds(memberCount: number, returnFixtures: boolean): number {
    if (memberCount < 2) return 0;
    const singleRounds = memberCount % 2 === 0 ? memberCount - 1 : memberCount;
    return returnFixtures ? singleRounds * 2 : singleRounds;
  }

  getEstimatedEndDate(): string {
    const startDate = new Date(this.settingsForm.value.startDate);
    const frequency = this.settingsForm.value.matchFrequencyDays;
    const returnFixtures = this.settingsForm.value.includeReturnFixtures;
    
    // This would need member count from subscription
    // For now, return placeholder
    return 'TBD';
  }
}

