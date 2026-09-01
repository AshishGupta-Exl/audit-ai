import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AUTH_GATEWAY } from './auth.gateway';
import { AuthenticatedUser, LoginCredentials, LoginResult } from './auth.models';

const SESSION_STORAGE_KEY = 'audit-ai.session';

interface PersistedSession {
  user: AuthenticatedUser;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly currentUser = signal<AuthenticatedUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.currentUser.set(this.readPersistedSession()?.user ?? null);
  }

  login(credentials: LoginCredentials): Observable<LoginResult> {
    return this.gateway.authenticate(credentials).pipe(
      tap((result) => {
        this.currentUser.set(result.user);
        this.persistSession(result, credentials.rememberMe);
      }),
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  /**
   * "Remember me" decides how long the session outlives the tab, so the choice
   * maps directly onto local vs. session storage.
   */
  private persistSession(result: LoginResult, rememberMe: boolean): void {
    const target = rememberMe ? localStorage : sessionStorage;
    const other = rememberMe ? sessionStorage : localStorage;
    const payload: PersistedSession = { user: result.user, token: result.token };

    other.removeItem(SESSION_STORAGE_KEY);
    target.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  }

  private readPersistedSession(): PersistedSession | null {
    const raw =
      sessionStorage.getItem(SESSION_STORAGE_KEY) ?? localStorage.getItem(SESSION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as PersistedSession;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }
}
