import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { LoginCredentials } from '../../../../core/models/user.model';
import { AuthSignalStore } from '../../store/auth.signal-store';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class LoginComponent implements OnInit, OnDestroy {
  private authStore = inject(AuthSignalStore);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loginForm: FormGroup;

  // Signal-based selectors
  isLoading = this.authStore.loading;
  error = this.authStore.error;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Clear any existing errors when component loads
    this.authStore.clearError();
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe with signal store
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const credentials: LoginCredentials = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
      };

      this.authStore.login(credentials);
    } else {
      this.markFormGroupTouched();
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
