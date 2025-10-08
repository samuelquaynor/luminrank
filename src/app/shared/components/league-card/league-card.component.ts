import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { League } from '../../../features/leagues/models/league.model';

@Component({
  selector: 'app-league-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './league-card.component.html',
  styleUrl: './league-card.component.css'
})
export class LeagueCardComponent {
  @Input({ required: true }) league!: League;
  @Input() memberCount: number = 0;
  @Input() creatorName: string = 'Unknown';
}

