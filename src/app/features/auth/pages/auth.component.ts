import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginComponent } from '../components/login/login.component';
import { RegisterComponent } from '../components/register/register.component';
import { AuthSignalStore } from '../store/auth.signal-store';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, LoginComponent, RegisterComponent],
  templateUrl: './auth.component.html',
})
export class AuthComponent implements OnInit, OnDestroy {
  private authStore = inject(AuthSignalStore);
  private router = inject(Router);

  showLogin = true;

  constructor() {
    // Handle navigation after successful login
    effect(() => {
      const user = this.authStore.user();
      const isAuthenticated = this.authStore.isAuthenticated();
      
      if (isAuthenticated && user) {
        if (!user.name) {
          this.router.navigate(['/profile-setup']);
        } else {
          this.router.navigate(['/']);
        }
      }
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe with signal store
  }

  toggleView(): void {
    this.showLogin = !this.showLogin;
  }
}
