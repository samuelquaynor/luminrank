import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { AuthSignalStore } from '../../auth/store/auth.signal-store';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private authStore = inject(AuthSignalStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Signal-based selectors
  user = this.authStore.user;
  isAuthenticated = this.authStore.isAuthenticated;

  constructor() {}

  ngOnInit(): void {
    this.authStore.checkAuth();

    // Check for returnUrl in localStorage (set by AuthGuard) - only in browser
    if (this.isBrowser) {
      const returnUrl = localStorage.getItem('auth_return_url');
      if (returnUrl) {
        // Clear it and redirect
        localStorage.removeItem('auth_return_url');
        this.router.navigateByUrl(returnUrl);
      }
    }
  }
}
