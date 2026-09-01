import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, throwError } from 'rxjs';

import { AUTH_GATEWAY } from './auth.gateway';
import { AuthError, LoginCredentials, LoginResult } from './auth.models';
import { AuthService } from './auth.service';
import { InMemoryAuthGateway } from './in-memory-auth.gateway';

const VALID: LoginCredentials = {
  email: 'auditor@auditai.com',
  password: 'Audit@2026',
  rememberMe: false,
};

async function captureError(login$: Observable<LoginResult>): Promise<AuthError> {
  try {
    await firstValueFrom(login$);
  } catch (error) {
    return error as AuthError;
  }

  throw new Error('expected the login attempt to be rejected');
}

describe('AuthService', () => {
  const createService = () =>
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_GATEWAY, useClass: InMemoryAuthGateway }],
    }).inject(AuthService);

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('starts unauthenticated when no session is stored', () => {
    expect(createService().isAuthenticated()).toBeFalse();
  });

  it('authenticates a seeded user', async () => {
    const service = createService();

    const result = await firstValueFrom(service.login(VALID));

    expect(result.user.email).toBe('auditor@auditai.com');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('accepts a differently cased email', async () => {
    const service = createService();

    await firstValueFrom(service.login({ ...VALID, email: '  Auditor@AuditAI.com ' }));

    expect(service.isAuthenticated()).toBeTrue();
  });

  it('rejects a wrong password with an invalid_credentials error', async () => {
    const service = createService();

    const error = await captureError(service.login({ ...VALID, password: 'WrongPass1' }));

    expect(error.code).toBe('invalid_credentials');
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('reports a locked account distinctly', async () => {
    const service = createService();

    const error = await captureError(service.login({ ...VALID, email: 'locked@auditai.com' }));

    expect(error.code).toBe('account_locked');
  });

  it('keeps the session in sessionStorage when remember me is off', async () => {
    const service = createService();

    await firstValueFrom(service.login({ ...VALID, rememberMe: false }));

    expect(sessionStorage.getItem('audit-ai.session')).toBeTruthy();
    expect(localStorage.getItem('audit-ai.session')).toBeNull();
  });

  it('promotes the session to localStorage when remember me is on', async () => {
    const service = createService();

    await firstValueFrom(service.login({ ...VALID, rememberMe: true }));

    expect(localStorage.getItem('audit-ai.session')).toBeTruthy();
    expect(sessionStorage.getItem('audit-ai.session')).toBeNull();
  });

  it('restores a persisted session on construction', async () => {
    await firstValueFrom(createService().login({ ...VALID, rememberMe: true }));

    TestBed.resetTestingModule();

    expect(createService().user()?.email).toBe('auditor@auditai.com');
  });

  it('discards a corrupt persisted session', () => {
    localStorage.setItem('audit-ai.session', 'not-json');

    const service = createService();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('audit-ai.session')).toBeNull();
  });

  it('clears stored state on logout', async () => {
    const service = createService();
    await firstValueFrom(service.login({ ...VALID, rememberMe: true }));

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('audit-ai.session')).toBeNull();
    expect(sessionStorage.getItem('audit-ai.session')).toBeNull();
  });

  it('leaves the session untouched when the gateway fails', async () => {
    const service = TestBed.configureTestingModule({
      providers: [
        {
          provide: AUTH_GATEWAY,
          useValue: { authenticate: () => throwError(() => new Error('x')) },
        },
      ],
    }).inject(AuthService);

    await expectAsync(firstValueFrom(service.login(VALID))).toBeRejected();

    expect(service.isAuthenticated()).toBeFalse();
  });
});
