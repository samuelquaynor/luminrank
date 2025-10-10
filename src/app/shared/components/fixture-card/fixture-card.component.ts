import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FixtureWithDetails, FixtureStatus } from '../../../features/fixtures/models/fixture.model';

@Component({
  selector: 'app-fixture-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fixture-card.component.html'
})
export class FixtureCardComponent {
  @Input({ required: true }) fixture!: FixtureWithDetails;
  @Input() currentUserId?: string;
  @Input() showRecordButton = true;

  FixtureStatus = FixtureStatus;

  getStatusColor(): string {
    switch (this.fixture.status) {
      case FixtureStatus.SCHEDULED:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case FixtureStatus.COMPLETED:
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case FixtureStatus.OVERDUE:
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case FixtureStatus.CANCELLED:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      case FixtureStatus.FORFEITED:
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  }

  getStatusIcon(): string {
    switch (this.fixture.status) {
      case FixtureStatus.SCHEDULED:
        return '📅';
      case FixtureStatus.COMPLETED:
        return '✅';
      case FixtureStatus.OVERDUE:
        return '⏰';
      case FixtureStatus.CANCELLED:
        return '❌';
      case FixtureStatus.FORFEITED:
        return '🚫';
      default:
        return '❓';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  isParticipant(): boolean {
    if (!this.currentUserId) return false;
    return this.fixture.home_player_id === this.currentUserId || 
           this.fixture.away_player_id === this.currentUserId;
  }

  canRecordResult(): boolean {
    return this.showRecordButton && 
           this.isParticipant() && 
           this.fixture.status === FixtureStatus.SCHEDULED;
  }
}

