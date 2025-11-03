import {
  Component,
  OnInit,
  inject,
  signal,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthSignalStore } from '../../../features/auth/store/auth.signal-store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  private authStore = inject(AuthSignalStore);
  private router = inject(Router);

  // Signal-based selectors
  user = this.authStore.user;
  userName = this.authStore.userName;
  userEmail = this.authStore.userEmail;
  isAuthenticated = this.authStore.isAuthenticated;

  // Dropdown state
  isDropdownOpen = signal(false);
  @ViewChild('dropdown', { static: false }) dropdownElement!: ElementRef<HTMLElement>;

  constructor() {}

  ngOnInit(): void {
    this.authStore.checkAuth();
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update((open) => !open);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeDropdown();
  }

  onSignOut(): void {
    this.authStore.logout();
    this.closeDropdown();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isDropdownOpen() && this.dropdownElement?.nativeElement) {
      const target = event.target as Node;
      if (!this.dropdownElement.nativeElement.contains(target)) {
        this.closeDropdown();
      }
    }
  }
}
