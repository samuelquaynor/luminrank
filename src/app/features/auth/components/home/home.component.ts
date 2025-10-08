import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import * as AuthActions from '../../store/auth.actions';
import * as AuthSelectors from '../../store/auth.selectors';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Welcome to Dashboard</h1>
        <div class="user-info">
          <span>Hello, {{ (userName$ | async) }}!</span>
          <button class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </div>
      
      <div class="dashboard-content">
        <div class="info-card">
          <h3>User Information</h3>
          <p><strong>Email:</strong> {{ (userEmail$ | async) }}</p>
          <p><strong>Role:</strong> {{ (userRole$ | async) | titlecase }}</p>
          <p><strong>User ID:</strong> {{ (userId$ | async) }}</p>
        </div>
        
        @if (isAdmin$ | async) {
          <div class="info-card">
            <h3>Admin Panel</h3>
            <p>You have admin privileges!</p>
            <button class="btn btn-primary" routerLink="/admin">Go to Admin Panel</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e1e5e9;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .dashboard-content {
      display: grid;
      gap: 20px;
    }
    
    .info-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .info-card h3 {
      margin-top: 0;
      color: #333;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-secondary {
      background: #6c757d;
      color: white;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `]
})
export class DashboardComponent implements OnInit {
  userName$: Observable<string | undefined>;
  userEmail$: Observable<string | undefined>;
  userRole$: Observable<string | undefined>;
  userId$: Observable<string | undefined>;
  isAdmin$: Observable<boolean>;

  constructor(private store: Store) {
    this.userName$ = this.store.select(AuthSelectors.selectUserName);
    this.userEmail$ = this.store.select(AuthSelectors.selectUserEmail);
    this.userRole$ = this.store.select(AuthSelectors.selectUserRole);
    this.userId$ = this.store.select(AuthSelectors.selectUserId);
    this.isAdmin$ = this.store.select(AuthSelectors.selectIsAdmin);
  }

  ngOnInit(): void {
    // Check auth on component init
    this.store.dispatch(AuthActions.checkAuth());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
