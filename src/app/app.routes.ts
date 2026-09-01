import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    title: 'Sign in · Audit AI',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    title: 'Dashboard · Audit AI',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'forgot-password',
    title: 'Reset password · Audit AI',
    data: { title: 'Reset your password' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'request-access',
    title: 'Request access · Audit AI',
    data: { title: 'Request access' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'privacy',
    title: 'Privacy · Audit AI',
    data: { title: 'Privacy notice' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'terms',
    title: 'Terms · Audit AI',
    data: { title: 'Terms of use' },
    loadComponent: () =>
      import('./features/placeholder/placeholder-page').then((m) => m.PlaceholderPage),
  },
  { path: '**', redirectTo: 'login' },
];
