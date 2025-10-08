import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { HeaderComponent } from '../../shared/components/header/header.component';
import * as LeagueActions from '../../features/leagues/store/league.actions';
import * as LeagueSelectors from '../../features/leagues/store/league.selectors';
import { Actions, ofType } from '@ngrx/effects';

@Component({
  selector: 'app-join-league',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './join-league.component.html',
  styleUrl: './join-league.component.css'
})
export class JoinLeagueComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private actions$ = inject(Actions);

  joinForm: FormGroup;
  loading$: Observable<boolean> = this.store.select(LeagueSelectors.selectLeagueLoading);
  error$: Observable<string | null> = this.store.select(LeagueSelectors.selectLeagueError);
  private subscription?: Subscription;

  constructor() {
    this.joinForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^LMNR-[A-Z0-9]{6}$/)]]
    });
  }

  ngOnInit(): void {
    // Set up subscription to handle navigation on success
    this.subscription = this.actions$.pipe(
      ofType(LeagueActions.joinLeagueSuccess)
    ).subscribe(({ league }) => {
      this.router.navigate(['/leagues', league.id]);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onSubmit(): void {
    if (this.joinForm.valid) {
      const code = this.joinForm.value.code.toUpperCase();
      this.store.dispatch(LeagueActions.joinLeague({ code }));
    }
  }

  get code() {
    return this.joinForm.get('code');
  }
}

