import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { League } from '../../features/leagues/models/league.model';
import { LeagueCardComponent } from '../../shared/components/league-card/league-card.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import * as LeagueActions from '../../features/leagues/store/league.actions';
import * as LeagueSelectors from '../../features/leagues/store/league.selectors';

@Component({
  selector: 'app-leagues-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LeagueCardComponent, HeaderComponent],
  templateUrl: './leagues-list.component.html',
  styleUrl: './leagues-list.component.css'
})
export class LeaguesListComponent implements OnInit {
  private store = inject(Store);

  leagues$: Observable<League[]> = this.store.select(LeagueSelectors.selectAllLeagues);
  loading$: Observable<boolean> = this.store.select(LeagueSelectors.selectLeagueLoading);
  error$: Observable<string | null> = this.store.select(LeagueSelectors.selectLeagueError);

  ngOnInit(): void {
    this.store.dispatch(LeagueActions.loadMyLeagues());
  }
}

