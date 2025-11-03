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
  templateUrl: './match-card.component.html',
})
export class MatchCardComponent {
  @Input() match!: MatchWithDetails;
  @Input() currentUserId?: string;
  @Input() canDispute: boolean = false;
  @Input() isFirst: boolean = false;
  @Input() isLast: boolean = false;
  @Output() dispute = new EventEmitter<string>(); // Emits match ID

  isScheduledMatch(): boolean {
    return this.match.status === 'scheduled';
  }

  getTimeLabel(): string {
    if (this.isScheduledMatch()) {
      return 'Scheduled';
    }
    return 'Played';
  }

  getTimeDisplay(): string {
    const dateString = this.isScheduledMatch() ? this.match.scheduled_date : this.match.match_date;
    if (!dateString) {
      return 'TBD';
    }
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'Scheduled';
    }
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
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  formatScheduledDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'TBD';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatDeadline(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'TBD';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  onDispute(): void {
    this.dispute.emit(this.match.id);
  }

  isMatchDisputed(): boolean {
    return this.match.status === 'disputed';
  }
}
