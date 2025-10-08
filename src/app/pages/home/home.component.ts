import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

  constructor(private store: Store) {
    this.user$ = this.store.select(AuthSelectors.selectUser);
    this.isAuthenticated$ = this.store.select(AuthSelectors.selectIsAuthenticated);
  }

  ngOnInit(): void {
    this.store.dispatch(AuthActions.checkAuth());
  }
}

