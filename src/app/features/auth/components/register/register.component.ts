import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { RegisterData } from '../../../../core/models/user.model';
import { AuthSignalStore } from '../../store/auth.signal-store';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class RegisterComponent implements OnInit, OnDestroy {
  private authStore = inject(AuthSignalStore);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  registerForm: FormGroup;

  // Signal-based selectors
  isLoading = this.authStore.loading;
  error = this.authStore.error;

  constructor() {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // Clear any existing errors when component loads
    this.authStore.clearError();
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe with signal store
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const registerData: RegisterData = {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
      };

      this.authStore.register(registerData);
    } else {
      this.markFormGroupTouched();
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);

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

  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (password.length === 0) return '';

    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'fair';
    if (password.match(/[A-Z]/) && password.match(/[0-9]/)) return 'strong';
    return 'good';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  isPasswordMismatch(): boolean {
    return (
      this.registerForm.hasError('passwordMismatch') &&
      !!this.registerForm.get('confirmPassword')?.touched
    );
  }

  getPasswordStrengthClass(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (password.length < 6) return 'text-red-400 bg-red-400';
    if (password.length < 8) return 'text-yellow-400 bg-yellow-400';
    if (password.length < 10) return 'text-blue-400 bg-blue-400';
    return 'text-green-400 bg-green-400';
  }

  getPasswordStrengthText(): string {
    const password = this.registerForm.get('password')?.value || '';
    if (password.length < 6) return 'Weak';
    if (password.length < 8) return 'Fair';
    if (password.length < 10) return 'Good';
    return 'Strong';
  }
}
