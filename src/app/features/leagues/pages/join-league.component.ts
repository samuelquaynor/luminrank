import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LeagueSignalStore } from '../store/league.signal-store';

@Component({
  selector: 'app-join-league',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './join-league.component.html',
})
export class JoinLeagueComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private leagueStore = inject(LeagueSignalStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  joinForm: FormGroup;
  loading = this.leagueStore.loading;
  error = this.leagueStore.error;
  autoJoining = false;
  justJoined = false;

  // Form control getter for template
  get code() {
    return this.joinForm.get('inviteCode');
  }

  constructor() {
    this.joinForm = this.fb.group({
      inviteCode: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Handle successful league join
    effect(() => {
      const leagues = this.leagueStore.leagues();
      const loading = this.loading();
      const errorValue = this.error();

      // If we just finished loading and have leagues (and no error), navigate to the newly joined league
      if (!loading && leagues.length > 0 && this.justJoined && !errorValue) {
        // Find the most recently joined league (it should be at the end or beginning of the list)
        // For simplicity, navigate to the last league in the list (assuming newest is added at end)
        const joinedLeague = leagues[leagues.length - 1];
        this.justJoined = false; // Reset flag before navigation
        this.router.navigate(['/leagues', joinedLeague.id]);
      }
    });
  }

  ngOnInit(): void {
    // Clear any existing errors
    this.leagueStore.clearError();

    // Check for invite code in route params (from /leagues/join/:code)
    this.route.params.subscribe((params) => {
      if (params['code']) {
        this.joinForm.patchValue({ inviteCode: params['code'] });
        this.autoJoining = true;
        this.onSubmit();
      }
    });

    // Also check query params as fallback
    this.route.queryParams.subscribe((params) => {
      if (params['code'] && !this.autoJoining) {
        this.joinForm.patchValue({ inviteCode: params['code'] });
        this.autoJoining = true;
        this.onSubmit();
      }
    });
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe with signal store
  }

  onSubmit(): void {
    if (this.joinForm.valid) {
      const inviteCode = this.joinForm.value.inviteCode;
      this.justJoined = true; // Set flag before joining
      this.leagueStore.joinLeague(inviteCode);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.joinForm.controls).forEach((key) => {
      const control = this.joinForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.joinForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.joinForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
