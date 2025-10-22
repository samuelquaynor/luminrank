import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthSignalStore } from '../../../features/auth/store/auth.signal-store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  private authStore = inject(AuthSignalStore);

  // Signal-based selectors
  user = this.authStore.user;
  isAuthenticated = this.authStore.isAuthenticated;

  constructor() {}

  ngOnInit(): void {
    this.authStore.checkAuth();
  }

  logout(): void {
    this.authStore.logout();
  }
}
