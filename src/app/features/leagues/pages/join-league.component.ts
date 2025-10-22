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

      // If we just finished loading and have leagues, navigate to the first one
      if (!loading && leagues.length > 0 && this.autoJoining) {
        const joinedLeague = leagues[0]; // Assuming the newest league is first
        this.router.navigate(['/leagues', joinedLeague.id]);
      }
    });
  }

  ngOnInit(): void {
    // Clear any existing errors
    this.leagueStore.clearError();

    // Check for invite code in query params
    this.route.queryParams.subscribe((params) => {
      if (params['code']) {
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
