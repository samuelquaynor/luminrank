import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthSignalStore } from '../../auth/store/auth.signal-store';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private authStore = inject(AuthSignalStore);
  private router = inject(Router);

  user = this.authStore.user;
  userEmail = this.authStore.userEmail;
  userName = this.authStore.userName;
  loading = this.authStore.loading;
  isAuthenticated = this.authStore.isAuthenticated;

  constructor() {
    // Navigate to home when user logs out
    effect(() => {
      const authenticated = this.isAuthenticated();
      if (!authenticated && this.loading() === false) {
        this.router.navigate(['/']);
      }
    });
  }

  onSignOut(): void {
    this.authStore.logout();
  }
}

