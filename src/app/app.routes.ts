import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: 'profile-setup',
    loadComponent: () =>
      import('./pages/profile-setup/profile-setup.component').then((m) => m.ProfileSetupComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'leagues',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/leagues/leagues-list.component').then((m) => m.LeaguesListComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/leagues/create-league.component').then((m) => m.CreateLeagueComponent),
      },
      {
        path: 'join',
        loadComponent: () =>
          import('./pages/leagues/join-league.component').then((m) => m.JoinLeagueComponent),
      },
      {
        path: 'join/:code',
        loadComponent: () =>
          import('./pages/leagues/join-league.component').then((m) => m.JoinLeagueComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/leagues/league-detail.component').then((m) => m.LeagueDetailComponent),
      },
      {
        path: ':id/record-match',
        loadComponent: () =>
          import('./pages/matches/record-match.component').then((m) => m.RecordMatchComponent),
      },
      {
        path: ':id/generate-fixtures',
        loadComponent: () =>
          import('./pages/fixtures/generate-fixtures.component').then((m) => m.GenerateFixturesComponent),
      },
    ],
  },
  // Admin routes commented out for now
  // {
  //   path: 'dashboard',
  //   loadComponent: () =>
  //     import('./features/auth/components/admin/admin.component').then((m) => m.AdminComponent),
  //   canActivate: [AuthGuard],
  // },
  // {
  //   path: 'admin',
  //   loadComponent: () =>
  //     import('./features/auth/components/admin/admin.component').then((m) => m.AdminComponent),
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
