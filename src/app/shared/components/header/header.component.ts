import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user.model';
import * as AuthActions from '../../../features/auth/store/auth.actions';
import * as AuthSelectors from '../../../features/auth/store/auth.selectors';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  user$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;

  constructor(private store: Store) {
    this.user$ = this.store.select(AuthSelectors.selectUser);
    this.isAuthenticated$ = this.store.select(AuthSelectors.selectIsAuthenticated);
  }

  ngOnInit(): void {
    this.store.dispatch(AuthActions.checkAuth());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
