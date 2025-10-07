import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

import { User, UserProfile } from '../../models/user.model';
import * as UserActions from '../../store/user.actions';
import * as UserSelectors from '../../store/user.selectors';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class UserProfileComponent implements OnInit, OnDestroy {
  profileForm: FormGroup;
  currentUser$: Observable<User | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  private subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private store: Store
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      street: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: [''],
      theme: ['light', Validators.required],
      language: ['en', Validators.required],
      emailNotifications: [true],
      pushNotifications: [true],
      smsNotifications: [false]
    });

    this.currentUser$ = this.store.select(UserSelectors.selectCurrentUser);
    this.loading$ = this.store.select(UserSelectors.selectUserLoading);
    this.error$ = this.store.select(UserSelectors.selectUserError);
  }

  ngOnInit(): void {
    this.subscription.add(
      this.currentUser$.subscribe(user => {
        if (user) {
          this.populateForm(user);
          this.store.dispatch(UserActions.loadCurrentUserProfile({ userId: user.id }));
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private populateForm(user: User): void {
    const profile = user.profile || {};
    this.profileForm.patchValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: user.email,
      phone: profile.phone || '',
      street: profile.address?.street || '',
      city: profile.address?.city || '',
      state: profile.address?.state || '',
      zipCode: profile.address?.zipCode || '',
      country: profile.address?.country || '',
      theme: profile.preferences?.theme || 'light',
      language: profile.preferences?.language || 'en',
      emailNotifications: profile.preferences?.notifications?.email || false,
      pushNotifications: profile.preferences?.notifications?.push || false,
      smsNotifications: profile.preferences?.notifications?.sms || false
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      
      const profileData: Partial<UserProfile> = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        address: {
          street: formValue.street,
          city: formValue.city,
          state: formValue.state,
          zipCode: formValue.zipCode,
          country: formValue.country
        },
        preferences: {
          theme: formValue.theme,
          language: formValue.language,
          notifications: {
            email: formValue.emailNotifications,
            push: formValue.pushNotifications,
            sms: formValue.smsNotifications
          }
        }
      };

      this.subscription.add(
        this.currentUser$.subscribe(user => {
          if (user) {
            this.store.dispatch(UserActions.updateCurrentUserProfile({
              userId: user.id,
              profileData
            }));
          }
        })
      );
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.profileForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  clearError(): void {
    this.store.dispatch(UserActions.clearUserError());
  }
}
