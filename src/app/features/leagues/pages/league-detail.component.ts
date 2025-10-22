import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
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
import * as MatchActions from '../../matches/store/match.actions';
import * as MatchSelectors from '../../matches/store/match.selectors';
import * as LeaderboardActions from '../../matches/store/leaderboard.actions';
import * as LeaderboardSelectors from '../../matches/store/leaderboard.selectors';
import * as FixtureActions from '../../fixtures/store/fixture.actions';
import * as FixtureSelectors from '../../fixtures/store/fixture.selectors';
import * as SeasonActions from '../../fixtures/store/season.actions';
import * as SeasonSelectors from '../../fixtures/store/season.selectors';
import * as DisputeActions from '../../disputes/store/dispute.actions';

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
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private actions$ = inject(Actions);
  private authStore = inject(AuthSignalStore);
  private leagueStore = inject(LeagueSignalStore);

  leagueId!: string;
  league$!: Observable<LeagueWithDetails | null>;
  members$!: Observable<LeagueMember[]>;
  loading$: Observable<boolean> = toObservable(this.leagueStore.loading);
  currentUserId$: Observable<string | undefined> = toObservable(this.authStore.userId);

  // Phase 2: Match & Leaderboard
  leaderboardEntries$!: Observable<LeaderboardEntry[]>;
  matches$!: Observable<MatchWithDetails[]>;
  leaderboardLoading$!: Observable<boolean>;
  matchesLoading$!: Observable<boolean>;

  // Phase 3: Fixtures & Seasons
  fixtures$!: Observable<FixtureWithDetails[]>;
  activeSeason$!: Observable<any>;
  fixturesLoading$!: Observable<boolean>;

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
    this.league$ = toObservable(this.leagueStore.selectedLeague);
    this.members$ = toObservable(this.leagueStore.leagueMembers(this.leagueId));

    // Listen for dispute success and reload matches
    this.actionsSubscription = this.actions$
      .pipe(
        ofType(
          DisputeActions.createDisputeSuccess,
          DisputeActions.resolveDisputeSuccess,
          DisputeActions.withdrawDisputeSuccess
        )
      )
      .subscribe(() => {
        this.store.dispatch(MatchActions.loadLeagueMatches({ leagueId: this.leagueId }));
      });

    // Phase 2: Load leaderboard and matches
    this.leaderboardEntries$ = this.store.select(LeaderboardSelectors.selectLeaderboardEntries);
    this.matches$ = this.store.select(MatchSelectors.selectAllMatches);
    this.leaderboardLoading$ = this.store.select(LeaderboardSelectors.selectLeaderboardLoading);
    this.matchesLoading$ = this.store.select(MatchSelectors.selectMatchLoading);

    this.leagueStore.loadLeague(this.leagueId);
    this.store.dispatch(LeaderboardActions.loadLeaderboard({ leagueId: this.leagueId }));
    this.store.dispatch(MatchActions.loadLeagueMatches({ leagueId: this.leagueId }));

    // Phase 3: Load fixtures and seasons
    this.fixtures$ = this.store.select(FixtureSelectors.selectAllFixtures);
    this.activeSeason$ = this.store.select(SeasonSelectors.selectActiveSeason);
    this.fixturesLoading$ = this.store.select(FixtureSelectors.selectFixtureLoading);

    this.store.dispatch(FixtureActions.loadLeagueFixtures({ leagueId: this.leagueId }));
    this.store.dispatch(SeasonActions.loadActiveSeason({ leagueId: this.leagueId }));

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
    this.leagueSubscription = toObservable(this.leagueStore.leagues).subscribe((leagues) => {
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
    this.store.dispatch(DisputeActions.createDispute({ request }));
    this.showDisputeDialog = false;
    this.selectedMatchForDispute = undefined;
    // Note: Matches will be reloaded automatically when createDisputeSuccess action fires
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
