import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    title: 'Sign in · EXL platform',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    title: 'Dashboard · EXL platform',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'sso',
    title: 'Single sign-on · EXL platform',
    data: { title: 'Continue with Okta SSO' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'forgot-password',
    title: 'Reset password · EXL platform',
    data: { title: 'Reset your password' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'request-access',
    title: 'Request an account · EXL platform',
    data: { title: 'Request an account' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'privacy',
    title: 'Privacy · EXL platform',
    data: { title: 'Privacy notice' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'terms',
    title: 'Terms · EXL platform',
    data: { title: 'Terms of use' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'support',
    title: 'Support · EXL platform',
    data: { title: 'Support' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  { path: '**', redirectTo: 'login' },
];
