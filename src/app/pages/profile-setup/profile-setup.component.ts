import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import * as AuthSelectors from '../../features/auth/store/auth.selectors';
import * as AuthActions from '../../features/auth/store/auth.actions';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-setup.component.html',
  styleUrls: ['./profile-setup.component.css']
})
export class ProfileSetupComponent implements OnInit {
  profileForm: FormGroup;
  user$: Observable<User | null>;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private store: Store
  ) {
    this.user$ = this.store.select(AuthSelectors.selectUser);
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    // Check if user already has a name, redirect to home if they do
    // Use take(1) to only check once when component loads
    this.user$.pipe(take(1)).subscribe(user => {
      if (user?.name) {
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.error = null;

      const name = this.profileForm.value.name;

      this.authService.updateUserProfile({ name }).subscribe({
        next: () => {
          this.isLoading = false;
          // Refresh user data
          this.store.dispatch(AuthActions.checkAuth());
          // Navigate to home
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isLoading = false;
          this.error = error.message || 'Failed to update profile';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }
}
