import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./features/auth/pages/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'profile-setup',
    loadComponent: () =>
      import('./features/user/pages/profile-setup.component').then((m) => m.ProfileSetupComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'leagues',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/leagues/pages/leagues-list.component').then(
            (m) => m.LeaguesListComponent
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/leagues/pages/create-league.component').then(
            (m) => m.CreateLeagueComponent
          ),
      },
      {
        path: 'join',
        loadComponent: () =>
          import('./features/leagues/pages/join-league.component').then(
            (m) => m.JoinLeagueComponent
          ),
      },
      {
        path: 'join/:code',
        loadComponent: () =>
          import('./features/leagues/pages/join-league.component').then(
            (m) => m.JoinLeagueComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/leagues/pages/league-detail.component').then(
            (m) => m.LeagueDetailComponent
          ),
      },
      {
        path: ':id/record-match',
        loadComponent: () =>
          import('./features/matches/pages/record-match.component').then(
            (m) => m.RecordMatchComponent
          ),
      },
      {
        path: ':id/generate-fixtures',
        loadComponent: () =>
          import('./features/fixtures/pages/generate-fixtures.component').then(
            (m) => m.GenerateFixturesComponent
          ),
      },
    ],
  },
  // Admin routes commented out for now
  // {
  //   path: 'dashboard',
  //   loadComponent: () =>
  //     import('./features/admin/pages/admin.component').then((m) => m.AdminComponent),
  //   canActivate: [AuthGuard],
  // },
  // {
  //   path: 'admin',
  //   loadComponent: () =>
  //     import('./features/admin/pages/admin.component').then((m) => m.AdminComponent),
  //   canActivate: [RoleGuard],
  //   data: { roles: [UserRole.ADMIN] },
  // },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/auth/components/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
