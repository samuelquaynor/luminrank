import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LeagueCardComponent } from '../../../shared/components/league-card/league-card.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LeagueSignalStore } from '../store/league.signal-store';

@Component({
  selector: 'app-leagues-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LeagueCardComponent, HeaderComponent],
  templateUrl: './leagues-list.component.html',
})
export class LeaguesListComponent implements OnInit {
  private leagueStore = inject(LeagueSignalStore);

  // Signal-based selectors
  leagues = this.leagueStore.leagues;
  loading = this.leagueStore.loading;
  error = this.leagueStore.error;

  ngOnInit(): void {
    this.leagueStore.loadMyLeagues();
  }
}
