import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthSignalStore } from '../../auth/store/auth.signal-store';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-setup.component.html',
})
export class ProfileSetupComponent implements OnInit {
  private authStore = inject(AuthSignalStore);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  profileForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  // Signal-based selectors
  user = this.authStore.user;

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });

    // Check if user already has a name, redirect to home if they do
    effect(() => {
      const user = this.user();
      if (user?.name) {
        this.router.navigate(['/']);
      }
    });
  }

  ngOnInit(): void {
    // Component initialization
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
          this.authStore.checkAuth();
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
