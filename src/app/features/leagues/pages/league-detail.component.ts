import { CommonModule } from '@angular/common';
import {
  Component,
  Injector,
  OnDestroy,
  OnInit,
  computed,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { LeaderboardComponent } from '../../../shared/components/leaderboard/leaderboard.component';
import { MatchCardComponent } from '../../../shared/components/match-card/match-card.component';
import { AuthSignalStore } from '../../auth/store/auth.signal-store';
import { DisputeDialogComponent } from '../../disputes/components/dispute-dialog.component';
import { CreateDisputeRequest } from '../../disputes/models/dispute.model';
import { DisputeSignalStore } from '../../disputes/store/dispute.signal-store';
import { LeaderboardEntry } from '../../matches/models/leaderboard.model';
import { MatchWithDetails } from '../../matches/models/match.model';
import { MatchSignalStore } from '../../matches/store/match.signal-store';
import { LeagueMember, LeagueWithDetails, LeagueStatus } from '../models/league.model';
import { LeagueSignalStore } from '../store/league.signal-store';

@Component({
  selector: 'app-league-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LeaderboardComponent,
    MatchCardComponent,
    DisputeDialogComponent,
  ],
  templateUrl: './league-detail.component.html',
  styleUrl: './league-detail.component.css',
})
export class LeagueDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private fb = inject(FormBuilder);
  private authStore = inject(AuthSignalStore);
  private leagueStore = inject(LeagueSignalStore);
  private matchStore = inject(MatchSignalStore);
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

    // Season observables (seasons still needed for time-boxed competition)
    // TODO: Move seasons to separate service/store if needed
  }

  // Phase 2: Match & Leaderboard
  leaderboardEntries$: Observable<LeaderboardEntry[]>;
  matches$: Observable<MatchWithDetails[]>;
  leaderboardLoading$: Observable<boolean>;
  matchesLoading$: Observable<boolean>;

  activeTab: 'details' | 'matches' | 'standings' = 'details';
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

  private matchesSignal = signal<MatchWithDetails[]>([]);

  ngOnInit(): void {
    this.leagueId = this.route.snapshot.paramMap.get('id')!;
    // Initialize members observable after we have leagueId using runInInjectionContext
    this.members$ = runInInjectionContext(this.injector, () =>
      toObservable(this.leagueStore.leagueMembers(this.leagueId))
    );

    // Note: Dispute success handling moved to dispute dialog component
    // Matches will be reloaded there after successful dispute operations

    // Phase 2: Load league, members, leaderboard and matches
    this.leagueStore.loadLeague(this.leagueId);
    this.leagueStore.loadLeagueMembers(this.leagueId);
    this.matchStore.loadLeaderboard(this.leagueId);
    this.matchStore.loadLeagueMatches(this.leagueId);

    // Seasons will be loaded when needed (if seasons functionality is added)

    // Subscribe to matches to update signals
    this.matches$.subscribe((matches) => {
      this.matchesSignal.set(matches);
    });

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

  switchTab(tab: 'details' | 'matches' | 'standings'): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/']);
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
    if (this.editingLeague) {
      // Initialize form with current league values when starting to edit
      this.league$.pipe(take(1)).subscribe((league) => {
        if (league) {
          this.initializeLeagueForm(league);
        }
      });
    }
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

      // Wait for the leave operation to complete, then navigate
      const subscription = this.loading$.pipe(skip(1), take(1)).subscribe((loading) => {
        if (!loading) {
          // Operation completed, navigate to home
          this.router.navigate(['/']);
        }
      });

      // Clean up subscription after navigation
      setTimeout(() => subscription.unsubscribe(), 5000);
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

  groupMatchesByDate(matches: MatchWithDetails[]): { date: string; matches: MatchWithDetails[] }[] {
    const groups = new Map<
      string,
      { dateKey: string; dateValue: Date; matches: MatchWithDetails[] }
    >();

    matches.forEach((match) => {
      const dateString = match.scheduled_date || match.match_date;
      if (!dateString) return;

      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let dateKey: string;

      // Format as "Today • 03 Nov"
      if (date.toDateString() === today.toDateString()) {
        dateKey = `Today • ${date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        dateKey = `Tomorrow • ${date.toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
        })}`;
      } else {
        dateKey = date.toLocaleDateString('en-US', {
          weekday: 'long',
          day: '2-digit',
          month: 'short',
        });
      }

      // Use the date at midnight for grouping
      const dateValue = new Date(date);
      dateValue.setHours(0, 0, 0, 0);
      const dateValueKey = dateValue.toISOString();

      if (!groups.has(dateValueKey)) {
        groups.set(dateValueKey, { dateKey, dateValue, matches: [] });
      }
      groups.get(dateValueKey)!.matches.push(match);
    });

    // Sort groups by date (earliest first) and sort matches within each group
    return Array.from(groups.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([_, group]) => ({
        date: group.dateKey,
        matches: group.matches.sort((a, b) => {
          const dateA = new Date(a.scheduled_date || a.match_date || 0);
          const dateB = new Date(b.scheduled_date || b.match_date || 0);
          return dateA.getTime() - dateB.getTime();
        }),
      }));
  }

  startLeague(): void {
    this.league$.pipe(take(1)).subscribe((league) => {
      if (!league) return;

      // Validate league can be started
      if (league.status !== LeagueStatus.DRAFT) {
        alert('League can only be started when in draft status');
        return;
      }

      // Confirm with user
      const confirmed = confirm(
        'Are you sure you want to start this league? This will generate all matches and cannot be undone.'
      );

      if (confirmed) {
        // Start the league (store handles the operation)
        this.leagueStore.startLeague(this.leagueId);

        // Reload matches and leaderboard after a delay to ensure operation completes
        // The store already reloads the league, we just need to reload matches
        setTimeout(() => {
          this.matchStore.loadLeagueMatches(this.leagueId);
          this.matchStore.loadLeaderboard(this.leagueId);
        }, 3000);
      }
    });
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
      score: p.score ?? 0,
    }));
  }

  getRoleBadgeClass(role: string): string {
    return `role-${role.toLowerCase()}`;
  }
}
