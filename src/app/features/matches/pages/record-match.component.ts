import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AppState } from '../../../store/app.state';
import { LeagueSignalStore } from '../../leagues/store/league.signal-store';
import { selectMatchRecording, selectMatchError } from '../store/match.selectors';
import { recordMatch, clearMatchError } from '../store/match.actions';
import { loadLeaderboard } from '../store/leaderboard.actions';
import { League, LeagueMember } from '../../leagues/models/league.model';
import { CreateMatchRequest, MatchResult } from '../models/match.model';

/**
 * Record Match Component - Phase 2: Match Recording
 * Allows league members to record match results
 */
@Component({
  selector: 'app-record-match',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-bg-primary py-8 px-4">
      <div class="max-w-2xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <button
            (click)="goBack()"
            class="text-gray-400 hover:text-white transition-colors duration-200 mb-4 flex items-center gap-2"
            data-testid="back-to-league-button"
          >
            <span>←</span>
            <span>Back to League</span>
          </button>
          <h1 class="text-3xl font-bold text-white mb-2">Record Match</h1>
          <p class="text-gray-400" *ngIf="league$ | async as league">
            {{ league.name }}
          </p>
        </div>

        <!-- Error Message -->
        <div
          *ngIf="error$ | async as error"
          class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
        >
          {{ error }}
        </div>

        <!-- Form -->
        <form [formGroup]="matchForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <!-- Match Date -->
          <div>
            <label for="matchDate" class="block text-sm font-medium text-gray-300 mb-2">
              Match Date
            </label>
            <input
              id="matchDate"
              type="datetime-local"
              formControlName="matchDate"
              data-testid="match-date-input"
              class="w-full px-4 py-3 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white border-border"
            />
            <p
              *ngIf="matchForm.get('matchDate')?.invalid && matchForm.get('matchDate')?.touched"
              class="mt-1 text-sm text-red-400"
            >
              Please select a match date
            </p>
          </div>

          <!-- Player 1 -->
          <div class="p-6 bg-bg-secondary rounded-lg border border-border">
            <h3 class="text-lg font-semibold text-white mb-4">Player 1</h3>

            <div class="space-y-4">
              <div>
                <label for="player1" class="block text-sm font-medium text-gray-300 mb-2">
                  Select Player
                </label>
                <select
                  id="player1"
                  formControlName="player1Id"
                  data-testid="player1-select"
                  class="w-full px-4 py-3 bg-bg-tertiary border rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white border-border"
                >
                  <option value="">Choose a player...</option>
                  <option *ngFor="let member of members" [value]="member.userId">
                    {{ member.userName }}
                  </option>
                </select>
                <p
                  *ngIf="matchForm.get('player1Id')?.invalid && matchForm.get('player1Id')?.touched"
                  class="mt-1 text-sm text-red-400"
                >
                  Please select a player
                </p>
              </div>

              <div>
                <label for="player1Score" class="block text-sm font-medium text-gray-300 mb-2">
                  Score
                </label>
                <input
                  id="player1Score"
                  type="number"
                  min="0"
                  formControlName="player1Score"
                  data-testid="player1-score-input"
                  class="w-full px-4 py-3 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white border-border"
                  placeholder="0"
                />
                <p
                  *ngIf="
                    matchForm.get('player1Score')?.invalid && matchForm.get('player1Score')?.touched
                  "
                  class="mt-1 text-sm text-red-400"
                >
                  Please enter a valid score
                </p>
              </div>

              <div>
                <label for="player1Result" class="block text-sm font-medium text-gray-300 mb-2">
                  Result
                </label>
                <select
                  id="player1Result"
                  formControlName="player1Result"
                  data-testid="player1-result-select"
                  class="w-full px-4 py-3 bg-bg-tertiary border rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white border-border"
                >
                  <option value="">Select result...</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                </select>
                <p
                  *ngIf="
                    matchForm.get('player1Result')?.invalid &&
                    matchForm.get('player1Result')?.touched
                  "
                  class="mt-1 text-sm text-red-400"
                >
                  Please select a result
                </p>
              </div>
            </div>
          </div>

          <!-- VS Divider -->
          <div class="flex items-center justify-center">
            <div class="text-2xl font-bold text-gray-500">VS</div>
          </div>

          <!-- Player 2 -->
          <div class="p-6 bg-bg-secondary rounded-lg border border-border">
            <h3 class="text-lg font-semibold text-white mb-4">Player 2</h3>

            <div class="space-y-4">
              <div>
                <label for="player2" class="block text-sm font-medium text-gray-300 mb-2">
                  Select Player
                </label>
                <select
                  id="player2"
                  formControlName="player2Id"
                  data-testid="player2-select"
                  class="w-full px-4 py-3 bg-bg-tertiary border rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white border-border"
                >
                  <option value="">Choose a player...</option>
                  <option *ngFor="let member of members" [value]="member.userId">
                    {{ member.userName }}
                  </option>
                </select>
                <p
                  *ngIf="matchForm.get('player2Id')?.invalid && matchForm.get('player2Id')?.touched"
                  class="mt-1 text-sm text-red-400"
                >
                  Please select a player
                </p>
              </div>

              <div>
                <label for="player2Score" class="block text-sm font-medium text-gray-300 mb-2">
                  Score
                </label>
                <input
                  id="player2Score"
                  type="number"
                  min="0"
                  formControlName="player2Score"
                  data-testid="player2-score-input"
                  class="w-full px-4 py-3 bg-bg-tertiary border rounded-lg text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white border-border"
                  placeholder="0"
                />
                <p
                  *ngIf="
                    matchForm.get('player2Score')?.invalid && matchForm.get('player2Score')?.touched
                  "
                  class="mt-1 text-sm text-red-400"
                >
                  Please enter a valid score
                </p>
              </div>

              <div>
                <label for="player2Result" class="block text-sm font-medium text-gray-300 mb-2">
                  Result
                </label>
                <select
                  id="player2Result"
                  formControlName="player2Result"
                  data-testid="player2-result-select"
                  class="w-full px-4 py-3 bg-bg-tertiary border rounded-lg text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white border-border"
                >
                  <option value="">Select result...</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                </select>
                <p
                  *ngIf="
                    matchForm.get('player2Result')?.invalid &&
                    matchForm.get('player2Result')?.touched
                  "
                  class="mt-1 text-sm text-red-400"
                >
                  Please select a result
                </p>
              </div>
            </div>
          </div>

          <!-- Form Errors -->
          <div
            *ngIf="formError"
            class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
          >
            {{ formError }}
          </div>

          <!-- Submit Button -->
          <div class="flex gap-4">
            <button
              type="button"
              (click)="goBack()"
              class="flex-1 px-6 py-3 bg-bg-tertiary text-white rounded-lg font-medium transition-all duration-200 hover:bg-bg-secondary border border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="matchForm.invalid || (recording$ | async)"
              data-testid="submit-record-match-button"
              class="flex-1 px-6 py-3 bg-white text-black rounded-lg font-medium transition-all duration-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span *ngIf="!(recording$ | async)">Record Match</span>
              <span *ngIf="recording$ | async" class="flex items-center justify-center gap-2">
                <span class="animate-spin">⏳</span>
                <span>Recording...</span>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RecordMatchComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private store = inject(Store<AppState>);
  private platformId = inject(PLATFORM_ID);
  private leagueStore = inject(LeagueSignalStore);

  leagueId: string = '';
  matchForm!: FormGroup;
  formError: string = '';
  members: LeagueMember[] = [];

  league$!: Observable<League | undefined>;
  members$!: Observable<LeagueMember[]>;
  recording$!: Observable<boolean>;
  error$!: Observable<string | null>;

  ngOnInit(): void {
    this.leagueId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.leagueId) {
      this.router.navigate(['/leagues']);
      return;
    }

    // Initialize observables
    this.league$ = toObservable(this.leagueStore.leagueById(this.leagueId));
    this.members$ = toObservable(this.leagueStore.leagueMembers(this.leagueId));
    this.recording$ = this.store.select(selectMatchRecording);
    this.error$ = this.store.select(selectMatchError);

    // Load league members
    this.members$.subscribe((members) => {
      this.members = members.filter((m: LeagueMember) => m.status === 'active');
    });

    // Initialize form
    this.initForm();

    // Listen for successful match recording
    this.recording$.subscribe((recording) => {
      if (!recording && !this.formError) {
        // Check if we just finished recording (transition from true to false)
        const previousRecording = this.matchForm.disabled;
        if (previousRecording) {
          // Refresh leaderboard
          this.store.dispatch(loadLeaderboard({ leagueId: this.leagueId }));
          // Navigate back to league detail
          this.router.navigate(['/leagues', this.leagueId]);
        }
      }
    });
  }

  private initForm(): void {
    // Get current date/time in local format for datetime-local input
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    this.matchForm = this.fb.group({
      matchDate: [localDateTime, Validators.required],
      player1Id: ['', Validators.required],
      player1Score: [0, [Validators.required, Validators.min(0)]],
      player1Result: ['', Validators.required],
      player2Id: ['', Validators.required],
      player2Score: [0, [Validators.required, Validators.min(0)]],
      player2Result: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      return;
    }

    this.formError = '';

    const formValue = this.matchForm.value;

    // Validation
    if (formValue.player1Id === formValue.player2Id) {
      this.formError = 'Please select different players';
      return;
    }

    if (formValue.player1Result === formValue.player2Result) {
      this.formError = 'One player must win and one must lose';
      return;
    }

    if (
      (formValue.player1Result === 'win' && formValue.player2Result !== 'loss') ||
      (formValue.player1Result === 'loss' && formValue.player2Result !== 'win')
    ) {
      this.formError = 'Results must be opposite (one win, one loss)';
      return;
    }

    // Create match request
    const request: CreateMatchRequest = {
      league_id: this.leagueId,
      match_date: new Date(formValue.matchDate).toISOString(),
      participants: [
        {
          profile_id: formValue.player1Id,
          score: formValue.player1Score,
          result: formValue.player1Result as MatchResult,
        },
        {
          profile_id: formValue.player2Id,
          score: formValue.player2Score,
          result: formValue.player2Result as MatchResult,
        },
      ],
    };

    // Dispatch action
    this.store.dispatch(recordMatch({ request }));
  }

  goBack(): void {
    this.router.navigate(['/leagues', this.leagueId]);
  }
}
