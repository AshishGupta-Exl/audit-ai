import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

import { AuthGateway } from './auth.gateway';
import { AuthError, LoginCredentials, LoginResult } from './auth.models';

interface SeedUser {
  email: string;
  password: string;
  displayName: string;
  roles: string[];
  locked?: boolean;
}

const SEED_USERS: SeedUser[] = [
  {
    email: 'auditor@auditai.com',
    password: 'Audit@2026',
    displayName: 'Sample Auditor',
    roles: ['auditor'],
  },
  {
    email: 'locked@auditai.com',
    password: 'Audit@2026',
    displayName: 'Locked Account',
    roles: ['auditor'],
    locked: true,
  },
];

/** Simulated network latency so the button's pending state is exercised. */
const RESPONSE_DELAY_MS = 700;

@Injectable()
export class InMemoryAuthGateway implements AuthGateway {
  authenticate(credentials: LoginCredentials): Observable<LoginResult> {
    const email = credentials.email.trim().toLowerCase();
    const match = SEED_USERS.find((user) => user.email === email);

    if (!match || match.password !== credentials.password) {
      return throwError(
        () =>
          new AuthError('invalid_credentials', 'The email or password you entered is incorrect.'),
      ).pipe(delay(RESPONSE_DELAY_MS));
    }

    if (match.locked) {
      return throwError(
        () =>
          new AuthError(
            'account_locked',
            'This account is locked. Contact your administrator to regain access.',
          ),
      ).pipe(delay(RESPONSE_DELAY_MS));
    }

    return of<LoginResult>({
      user: {
        id: match.email,
        email: match.email,
        displayName: match.displayName,
        roles: match.roles,
      },
      token: `demo-token.${btoa(match.email)}`,
    }).pipe(delay(RESPONSE_DELAY_MS));
  }
}
