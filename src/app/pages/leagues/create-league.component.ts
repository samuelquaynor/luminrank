import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ScoringSystem } from '../../features/leagues/models/league.model';
import * as LeagueActions from '../../features/leagues/store/league.actions';
import * as LeagueSelectors from '../../features/leagues/store/league.selectors';
import { Actions, ofType } from '@ngrx/effects';

@Component({
  selector: 'app-create-league',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './create-league.component.html',
  styleUrl: './create-league.component.css'
})
export class CreateLeagueComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private actions$ = inject(Actions);

  createForm: FormGroup;
  loading$: Observable<boolean> = this.store.select(LeagueSelectors.selectLeagueLoading);
  error$: Observable<string | null> = this.store.select(LeagueSelectors.selectLeagueError);
  showAdvanced = false;
  private subscription?: Subscription;

  gameTypes = [
    'GamePigeon',
    'Chess',
    'Pool',
    'Darts',
    'Trivia',
    'Fantasy Sports',
    'Other'
  ];

  scoringSystems = [
    { value: ScoringSystem.POINTS, label: 'Points System', description: 'Win = 3pts, Draw = 1pt, Loss = 0pts' },
    { value: ScoringSystem.WIN_LOSS, label: 'Win/Loss Only', description: 'Simple wins and losses count' },
    { value: ScoringSystem.ELO, label: 'ELO Rating', description: 'Chess-style rating system' }
  ];

  constructor() {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]],
      gameType: ['', Validators.required],
      isPrivate: [false],
      // Advanced settings
      scoringSystem: [ScoringSystem.POINTS],
      pointsPerWin: [3, [Validators.required, Validators.min(1)]],
      pointsPerDraw: [1, [Validators.required, Validators.min(0)]],
      pointsPerLoss: [0, [Validators.required, Validators.min(0)]],
      allowDraws: [false]
    });
  }

  ngOnInit(): void {
    // Set up subscription to handle navigation on success
    this.subscription = this.actions$.pipe(
      ofType(LeagueActions.createLeagueSuccess)
    ).subscribe(({ league }) => {
      this.router.navigate(['/leagues', league.id]);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onSubmit(): void {
    if (this.createForm.valid) {
      const formValue = this.createForm.value;
      
      this.store.dispatch(LeagueActions.createLeague({
        data: {
          name: formValue.name,
          description: formValue.description || undefined,
          gameType: formValue.gameType,
          isPrivate: formValue.isPrivate,
          settings: {
            scoringSystem: formValue.scoringSystem,
            pointsPerWin: formValue.pointsPerWin,
            pointsPerDraw: formValue.pointsPerDraw,
            pointsPerLoss: formValue.pointsPerLoss,
            allowDraws: formValue.allowDraws
          }
        }
      }));
    }
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  get name() {
    return this.createForm.get('name');
  }

  get description() {
    return this.createForm.get('description');
  }

  get gameType() {
    return this.createForm.get('gameType');
  }
}

