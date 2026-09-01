import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AUTH_GATEWAY } from './auth.gateway';

describe('auth guards', () => {
  let authenticated: boolean;

  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/dashboard/claims' } as RouterStateSnapshot;

  beforeEach(() => {
    authenticated = false;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AUTH_GATEWAY, useValue: { authenticate: () => void 0 } },
        { provide: AuthService, useValue: { isAuthenticated: () => authenticated } },
      ],
    });
  });

  it('lets an authenticated user through authGuard', () => {
    authenticated = true;

    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBeTrue();
  });

  it('redirects an anonymous user to login and keeps the return url', () => {
    const result = TestBed.runInInjectionContext(() => authGuard(route, state)) as UrlTree;

    expect(result instanceof UrlTree).toBeTrue();
    expect(result.toString()).toBe('/login?returnUrl=%2Fdashboard%2Fclaims');
  });

  it('lets an anonymous user reach the login screen', () => {
    expect(TestBed.runInInjectionContext(() => guestGuard(route, state))).toBeTrue();
  });

  it('sends an authenticated user away from the login screen', () => {
    authenticated = true;

    const result = TestBed.runInInjectionContext(() => guestGuard(route, state)) as UrlTree;

    expect(result.toString()).toBe('/dashboard');
  });
});
