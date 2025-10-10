import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaderboardEntry } from '../../../features/matches/models/leaderboard.model';

/**
 * Leaderboard Component - Displays league standings
 * Phase 2: Match Recording & Leaderboard
 */
@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.component.html'
})
export class LeaderboardComponent {
  @Input() entries: LeaderboardEntry[] = [];
  @Input() currentUserId?: string;
}

