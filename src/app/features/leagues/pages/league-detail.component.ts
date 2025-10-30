import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  runInInjectionContext,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LeaderboardComponent } from '../../../shared/components/leaderboard/leaderboard.component';
import { MatchCardComponent } from '../../../shared/components/match-card/match-card.component';
import { FixtureCardComponent } from '../../../shared/components/fixture-card/fixture-card.component';
import { DisputeDialogComponent } from '../../disputes/components/dispute-dialog.component';
import { LeagueWithDetails, LeagueMember, ScoringSystem } from '../models/league.model';
import { MatchWithDetails } from '../../matches/models/match.model';
import { LeaderboardEntry } from '../../matches/models/leaderboard.model';
import { FixtureWithDetails } from '../../fixtures/models/fixture.model';
import { CreateDisputeRequest } from '../../disputes/models/dispute.model';
import { LeagueSignalStore } from '../store/league.signal-store';
import { AuthSignalStore } from '../../auth/store/auth.signal-store';
import { MatchSignalStore } from '../../matches/store/match.signal-store';
import { FixtureSignalStore } from '../../fixtures/store/fixture.signal-store';
import { DisputeSignalStore } from '../../disputes/store/dispute.signal-store';

@Component({
  selector: 'app-league-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    LeaderboardComponent,
    MatchCardComponent,
    FixtureCardComponent,
    DisputeDialogComponent,
  ],
  templateUrl: './league-detail.component.html',
  styleUrl: './league-detail.component.css',
})
export class LeagueDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authStore = inject(AuthSignalStore);
  private leagueStore = inject(LeagueSignalStore);
  private matchStore = inject(MatchSignalStore);
  private fixtureStore = inject(FixtureSignalStore);
  private disputeStore = inject(DisputeSignalStore);
  private injector = inject(Injector);

  leagueId!: string;
  league$!: Observable<LeagueWithDetails | null>;
  members$!: Observable<LeagueMember[]>;
  loading$: Observable<boolean>;
  currentUserId$: Observable<string | undefined>;

  constructor() {
    // Initialize observables in constructor (injection context)
    this.loading$ = toObservable(this.leagueStore.loading);
    this.currentUserId$ = toObservable(this.authStore.userId);
    this.league$ = toObservable(this.leagueStore.selectedLeague);

    // Initialize match & leaderboard observables
    this.leaderboardEntries$ = toObservable(this.matchStore['leaderboardEntries']) as Observable<
      LeaderboardEntry[]
    >;
    this.matches$ = toObservable(this.matchStore.matches);
    this.leaderboardLoading$ = toObservable(this.matchStore.leaderboardLoading);
    this.matchesLoading$ = toObservable(this.matchStore.matchLoading);

    // Initialize fixture & season observables
    this.fixtures$ = toObservable(this.fixtureStore.fixtures);
    this.activeSeason$ = toObservable(this.fixtureStore.activeSeason);
    this.fixturesLoading$ = toObservable(this.fixtureStore.fixtureLoading);
  }

  // Phase 2: Match & Leaderboard
  leaderboardEntries$: Observable<LeaderboardEntry[]>;
  matches$: Observable<MatchWithDetails[]>;
  leaderboardLoading$: Observable<boolean>;
  matchesLoading$: Observable<boolean>;

  // Phase 3: Fixtures & Seasons
  fixtures$: Observable<FixtureWithDetails[]>;
  activeSeason$: Observable<any>;
  fixturesLoading$: Observable<boolean>;

  activeTab: 'leaderboard' | 'matches' | 'fixtures' | 'members' | 'settings' = 'leaderboard';
  settingsForm!: FormGroup;
  leagueForm!: FormGroup;
  editingSettings = false;
  editingLeague = false;
  copiedCode = false;
  copiedLink = false;
  private leagueSubscription?: Subscription;
  private actionsSubscription?: Subscription;

  // Phase 4: Disputes
  showDisputeDialog = false;
  selectedMatchForDispute?: MatchWithDetails;

  ngOnInit(): void {
    this.leagueId = this.route.snapshot.paramMap.get('id')!;
    // Initialize members observable after we have leagueId using runInInjectionContext
    this.members$ = runInInjectionContext(this.injector, () =>
      toObservable(this.leagueStore.leagueMembers(this.leagueId))
    );

    // Note: Dispute success handling moved to dispute dialog component
    // Matches will be reloaded there after successful dispute operations

    // Phase 2: Load league, leaderboard and matches
    this.leagueStore.loadLeague(this.leagueId);
    this.matchStore.loadLeaderboard(this.leagueId);
    this.matchStore.loadLeagueMatches(this.leagueId);

    // Phase 3: Load fixtures and seasons
    this.fixtureStore.loadLeagueFixtures({ leagueId: this.leagueId });
    this.fixtureStore.loadActiveSeason(this.leagueId);

    // Subscribe to league to initialize forms (only once)
    this.leagueSubscription = this.league$.subscribe((league) => {
      if (league) {
        if (!this.settingsForm) {
          this.initializeSettingsForm(league);
        }
        if (!this.leagueForm) {
          this.initializeLeagueForm(league);
          // Unsubscribe after initializing to prevent re-renders
          if (this.leagueSubscription) {
            this.leagueSubscription.unsubscribe();
            this.leagueSubscription = undefined;
          }
        }
      }
    });

    // Handle leave league success
    // Listen for league removal (when user leaves league)
    this.leagueSubscription = runInInjectionContext(this.injector, () =>
      toObservable(this.leagueStore.leagues)
    ).subscribe((leagues) => {
      const currentLeague = leagues.find((l) => l.id === this.leagueId);
      if (!currentLeague) {
        this.router.navigate(['/leagues']);
      }
    });
  }

  ngOnDestroy(): void {
    this.leagueSubscription?.unsubscribe();
    this.actionsSubscription?.unsubscribe();
  }

  initializeSettingsForm(league: LeagueWithDetails): void {
    this.settingsForm = this.fb.group({
      scoringSystem: [league.settings.scoringSystem],
      pointsPerWin: [league.settings.pointsPerWin, [Validators.required, Validators.min(1)]],
      pointsPerDraw: [league.settings.pointsPerDraw, [Validators.required, Validators.min(0)]],
      pointsPerLoss: [league.settings.pointsPerLoss, [Validators.required, Validators.min(0)]],
      allowDraws: [league.settings.allowDraws],
    });
  }

  initializeLeagueForm(league: LeagueWithDetails): void {
    this.leagueForm = this.fb.group({
      name: [league.name, [Validators.required, Validators.minLength(3)]],
      description: [league.description || ''],
    });
  }

  switchTab(tab: 'leaderboard' | 'matches' | 'fixtures' | 'members' | 'settings'): void {
    this.activeTab = tab;
  }

  copyInviteCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode = true;
      setTimeout(() => (this.copiedCode = false), 2000);
    });
  }

  getInviteLink(code: string): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/leagues/join/${code}`;
    }
    return '';
  }

  copyInviteLink(code: string): void {
    const link = this.getInviteLink(code);
    navigator.clipboard.writeText(link).then(() => {
      this.copiedLink = true;
      setTimeout(() => (this.copiedLink = false), 2000);
    });
  }

  toggleEditSettings(): void {
    this.editingSettings = !this.editingSettings;
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      // TODO: Dispatch update settings action when LeagueSettingsService is integrated with store
      this.editingSettings = false;
    }
  }

  cancelEditSettings(): void {
    this.editingSettings = false;
    // Reset form to original values
    this.league$
      .subscribe((league) => {
        if (league) {
          this.initializeSettingsForm(league);
        }
      })
      .unsubscribe();
  }

  toggleEditLeague(): void {
    this.editingLeague = !this.editingLeague;
  }

  saveLeague(): void {
    if (this.leagueForm.valid) {
      const updateData = {
        name: this.leagueForm.value.name,
        description: this.leagueForm.value.description,
      };
      this.leagueStore.updateLeague({ id: this.leagueId, data: updateData });
      this.editingLeague = false;
    }
  }

  cancelEditLeague(): void {
    this.editingLeague = false;
    // Reset form to original values
    this.league$
      .subscribe((league) => {
        if (league) {
          this.initializeLeagueForm(league);
        }
      })
      .unsubscribe();
  }

  leaveLeague(): void {
    if (confirm('Are you sure you want to leave this league?')) {
      this.leagueStore.leaveLeague(this.leagueId);
    }
  }

  isCreator(league: LeagueWithDetails, userId: string | undefined): boolean {
    return league.createdBy === userId;
  }

  isMember(league: LeagueWithDetails, userId: string | undefined): boolean {
    if (!userId) return false;
    // User is a member if they're the creator OR in the members list
    if (this.isCreator(league, userId)) return true;

    // Check if user is in members list
    let isMember = false;
    this.members$
      .subscribe((members) => {
        isMember = members.some((m) => m.userId === userId);
      })
      .unsubscribe();

    return isMember;
  }

  navigateToRecordMatch(): void {
    this.router.navigate(['/leagues', this.leagueId, 'record-match']);
  }

  navigateToGenerateFixtures(): void {
    this.router.navigate(['/leagues', this.leagueId, 'generate-fixtures']);
  }

  // Phase 4: Dispute handling
  onDisputeMatch(matchId: string): void {
    this.matches$
      .subscribe((matches) => {
        this.selectedMatchForDispute = matches.find((m) => m.id === matchId);
        if (this.selectedMatchForDispute) {
          this.showDisputeDialog = true;
        }
      })
      .unsubscribe();
  }

  onSubmitDispute(request: CreateDisputeRequest): void {
    this.disputeStore.createDispute(request);
    this.showDisputeDialog = false;
    this.selectedMatchForDispute = undefined;
    // Reload matches after creating dispute
    this.matchStore.loadLeagueMatches(this.leagueId);
  }

  onCancelDispute(): void {
    this.showDisputeDialog = false;
    this.selectedMatchForDispute = undefined;
  }

  getMatchParticipantsForDispute(): Array<{ id: string; name: string; score: number }> {
    if (!this.selectedMatchForDispute) return [];
    return this.selectedMatchForDispute.participants.map((p) => ({
      id: p.profile_id,
      name: p.display_name || 'Unknown',
      score: p.score,
    }));
  }

  getRoleBadgeClass(role: string): string {
    return `role-${role.toLowerCase()}`;
  }
}
