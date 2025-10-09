import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { User } from '../../core/models/user.model';
import * as AuthActions from '../../features/auth/store/auth.actions';
import * as AuthSelectors from '../../features/auth/store/auth.selectors';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.user$ = this.store.select(AuthSelectors.selectUser);
    this.isAuthenticated$ = this.store.select(AuthSelectors.selectIsAuthenticated);
  }

  ngOnInit(): void {
    this.store.dispatch(AuthActions.checkAuth());
    
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

