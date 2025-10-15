import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchWithDetails } from '../../../features/matches/models/match.model';

/**
 * Match Card Component - Displays a single match result
 * Phase 2: Match Recording & Leaderboard
 * Phase 4: Added dispute functionality
 */
@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-card.component.html'
})
export class MatchCardComponent {
  @Input() match!: MatchWithDetails;
  @Input() currentUserId?: string;
  @Input() canDispute: boolean = false;
  @Output() dispute = new EventEmitter<string>(); // Emits match ID

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  onDispute(): void {
    this.dispute.emit(this.match.id);
  }

  isMatchDisputed(): boolean {
    return this.match.status === 'disputed';
  }
}

