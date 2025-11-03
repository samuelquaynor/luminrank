import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthSignalStore } from '../../auth/store/auth.signal-store';
import { LeagueSignalStore } from '../../leagues/store/league.signal-store';
import { MatchSignalStore } from '../../matches/store/match.signal-store';
import { MatchWithDetails } from '../../matches/models/match.model';
import { LeagueStatus } from '../../leagues/models/league.model';
import { ExpandableComponent } from '../../../shared/components/expandable/expandable.component';
import { MatchCardComponent } from '../../../shared/components/match-card/match-card.component';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ExpandableComponent, MatchCardComponent],
  templateUrl: './home-dashboard.component.html',
})
export class HomeDashboardComponent {
  private authStore = inject(AuthSignalStore);
  private leagueStore = inject(LeagueSignalStore);
  private matchStore = inject(MatchSignalStore);

  user = this.authStore.user;

  // League + data
  leagues = this.leagueStore.leagues;
  matches = this.matchStore.matches;
  matchLoading = this.matchStore.matchLoading;
  members = this.leagueStore.members;

  // Track expanded leagues - all open by default
  expandedLeagues = signal<Set<string>>(new Set());
  // Track which leagues have loaded matches
  loadedLeagues = signal<Set<string>>(new Set());
  // Track which leagues have loaded members
  loadedMemberLeagues = signal<Set<string>>(new Set());
  // Track if initial expansion has been done
  initialExpansionDone = signal(false);

  // Group matches by league
  matchesByLeague = computed(() => {
    const grouped = new Map<string, MatchWithDetails[]>();
    for (const match of this.matches()) {
      const leagueMatches = grouped.get(match.league_id) || [];
      leagueMatches.push(match);
      grouped.set(match.league_id, leagueMatches);
    }
    return grouped;
  });

  constructor() {
    // Load user's leagues
    this.leagueStore.loadMyLeagues();

    // Expand all leagues by default on initial load only
    effect(() => {
      const leagues = this.leagues();
      const done = this.initialExpansionDone();

      // Only do initial expansion once
      if (leagues.length > 0 && !done) {
        const expanded = new Set<string>();

        // Expand all leagues by default
        for (const league of leagues) {
          expanded.add(league.id);
        }

        this.expandedLeagues.set(expanded);
        this.initialExpansionDone.set(true);

        // Load matches/members for first league based on status
        const firstLeague = leagues[0];
        if (firstLeague.status === LeagueStatus.DRAFT) {
          // Load members for draft leagues
          if (!this.loadedMemberLeagues().has(firstLeague.id)) {
            this.leagueStore.loadLeagueMembers(firstLeague.id);
            const loaded = new Set(this.loadedMemberLeagues());
            loaded.add(firstLeague.id);
            this.loadedMemberLeagues.set(loaded);
          }
        } else {
          // Load matches for active/completed leagues
          if (!this.loadedLeagues().has(firstLeague.id)) {
            this.matchStore.loadLeagueMatches(firstLeague.id);
            const loaded = new Set(this.loadedLeagues());
            loaded.add(firstLeague.id);
            this.loadedLeagues.set(loaded);
          }
        }
      }
    });
  }

  onExpandableChange(leagueId: string, expanded: boolean): void {
    const expandedSet = new Set(this.expandedLeagues());
    const league = this.leagues().find((l) => l.id === leagueId);

    if (expanded) {
      expandedSet.add(leagueId);

      // Load matches or members based on league status
      if (league?.status === LeagueStatus.DRAFT) {
        // Load members for draft leagues
        if (!this.loadedMemberLeagues().has(leagueId)) {
          this.leagueStore.loadLeagueMembers(leagueId);
          const loaded = new Set(this.loadedMemberLeagues());
          loaded.add(leagueId);
          this.loadedMemberLeagues.set(loaded);
        }
      } else {
        // Load matches for active/completed leagues
        if (!this.loadedLeagues().has(leagueId)) {
          this.matchStore.loadLeagueMatches(leagueId);
          const loaded = new Set(this.loadedLeagues());
          loaded.add(leagueId);
          this.loadedLeagues.set(loaded);
        }
      }
    } else {
      expandedSet.delete(leagueId);
    }

    this.expandedLeagues.set(expandedSet);
  }

  toggleLeague(leagueId: string): void {
    const expanded = new Set(this.expandedLeagues());
    const league = this.leagues().find((l) => l.id === leagueId);

    if (expanded.has(leagueId)) {
      expanded.delete(leagueId);
    } else {
      expanded.add(leagueId);

      // Load matches or members based on league status
      if (league?.status === LeagueStatus.DRAFT) {
        // Load members for draft leagues
        if (!this.loadedMemberLeagues().has(leagueId)) {
          this.leagueStore.loadLeagueMembers(leagueId);
          const loaded = new Set(this.loadedMemberLeagues());
          loaded.add(leagueId);
          this.loadedMemberLeagues.set(loaded);
        }
      } else {
        // Load matches for active/completed leagues
        if (!this.loadedLeagues().has(leagueId)) {
          this.matchStore.loadLeagueMatches(leagueId);
          const loaded = new Set(this.loadedLeagues());
          loaded.add(leagueId);
          this.loadedLeagues.set(loaded);
        }
      }
    }
    this.expandedLeagues.set(expanded);
  }

  isDraft(leagueId: string): boolean {
    const league = this.leagues().find((l) => l.id === leagueId);
    return league?.status === LeagueStatus.DRAFT;
  }

  getLeagueMembers(leagueId: string) {
    return this.members()[leagueId] || [];
  }

  isExpanded(leagueId: string): boolean {
    return this.expandedLeagues().has(leagueId);
  }

  getLeagueMatches(leagueId: string): MatchWithDetails[] {
    const allMatches = this.matchesByLeague().get(leagueId) || [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Filter upcoming scheduled matches
    const upcomingMatches = allMatches
      .filter((match) => {
        const matchDate = match.scheduled_date || match.match_date;
        if (!matchDate) return false;
        const date = new Date(matchDate);
        return date >= todayStart && (match.status === 'scheduled' || match.status === 'overdue');
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduled_date || a.match_date || '').getTime();
        const dateB = new Date(b.scheduled_date || b.match_date || '').getTime();
        return dateA - dateB; // Earliest first
      });

    if (upcomingMatches.length === 0) {
      return [];
    }

    // Check if there are matches today
    const todaysMatches = upcomingMatches.filter((match) => {
      const matchDate = new Date(match.scheduled_date || match.match_date || '');
      return matchDate >= todayStart && matchDate < todayEnd;
    });

    if (todaysMatches.length > 0) {
      // Return today's matches (limit to 5)
      return todaysMatches.slice(0, 5);
    }

    // No matches today, find the next available day
    const firstMatchDate = new Date(
      upcomingMatches[0].scheduled_date || upcomingMatches[0].match_date || ''
    );
    const nextDayStart = new Date(
      firstMatchDate.getFullYear(),
      firstMatchDate.getMonth(),
      firstMatchDate.getDate()
    );
    const nextDayEnd = new Date(nextDayStart);
    nextDayEnd.setDate(nextDayEnd.getDate() + 1);

    // Return matches for the next available day (limit to 5)
    return upcomingMatches
      .filter((match) => {
        const matchDate = new Date(match.scheduled_date || match.match_date || '');
        return matchDate >= nextDayStart && matchDate < nextDayEnd;
      })
      .slice(0, 5);
  }

  getMatchesDateLabel(leagueId: string): string {
    const matches = this.getLeagueMatches(leagueId);
    if (matches.length === 0) return '';

    const matchDate = matches[0].scheduled_date || matches[0].match_date;
    if (!matchDate) return '';

    const date = new Date(matchDate);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    if (date >= todayStart && date < tomorrowStart) {
      return "Today's Matches";
    } else if (date >= tomorrowStart && date < tomorrowEnd) {
      return "Tomorrow's Matches";
    } else {
      const daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${daysOfWeek[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
    }
  }
}
