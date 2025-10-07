import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import * as AuthActions from '../../store/auth.actions';
import * as AuthSelectors from '../../store/auth.selectors';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h1>Admin Panel</h1>
        <div class="admin-actions">
          <button class="btn btn-secondary" routerLink="/dashboard">Back to Dashboard</button>
          <button class="btn btn-danger" (click)="logout()">Logout</button>
        </div>
      </div>
      
      <div class="admin-content">
        <div class="admin-card">
          <h3>System Administration</h3>
          <p>This is the admin-only section of the application.</p>
          <p>Only users with admin role can access this page.</p>
          
          <div class="admin-info">
            <h4>Current Admin User:</h4>
            <p><strong>Name:</strong> {{ (userName$ | async) }}</p>
            <p><strong>Email:</strong> {{ (userEmail$ | async) }}</p>
            <p><strong>Role:</strong> {{ (userRole$ | async) | titlecase }}</p>
          </div>
          
          <div class="admin-actions-section">
            <button class="btn btn-primary">Manage Users</button>
            <button class="btn btn-primary">System Settings</button>
            <button class="btn btn-primary">View Logs</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e74c3c;
    }
    
    .admin-actions {
      display: flex;
      gap: 10px;
    }
    
    .admin-content {
      display: grid;
      gap: 20px;
    }
    
    .admin-card {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #e74c3c;
    }
    
    .admin-card h3 {
      margin-top: 0;
      color: #e74c3c;
    }
    
    .admin-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    
    .admin-actions-section {
      display: flex;
      gap: 15px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 10px 20px;
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
    
    .btn-danger {
      background: #dc3545;
      color: white;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  `]
})
export class AdminComponent implements OnInit {
  userName$: Observable<string | undefined>;
  userEmail$: Observable<string | undefined>;
  userRole$: Observable<string | undefined>;

  constructor(private store: Store) {
    this.userName$ = this.store.select(AuthSelectors.selectUserName);
    this.userEmail$ = this.store.select(AuthSelectors.selectUserEmail);
    this.userRole$ = this.store.select(AuthSelectors.selectUserRole);
  }

  ngOnInit(): void {
    // Check auth on component init
    this.store.dispatch(AuthActions.checkAuth());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  performAdminAction(action: string): void {
    console.log(`Admin action: ${action}`);
    // In a real app, this would trigger actual admin functionality
    alert(`Admin action "${action}" performed successfully!`);
  }

  getCurrentTime(): string {
    return new Date().toLocaleString();
  }
}
