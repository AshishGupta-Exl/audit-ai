import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { AUTH_GATEWAY, AuthGateway } from '../../../core/auth/auth.gateway';
import { AuthError, LoginCredentials, LoginResult } from '../../../core/auth/auth.models';
import { Login } from './login';

class StubAuthGateway implements AuthGateway {
  response: Observable<LoginResult> = of({
    user: { id: '1', email: 'auditor@auditai.com', displayName: 'Sample Auditor', roles: [] },
    token: 'token',
  });
  lastCredentials: LoginCredentials | null = null;

  authenticate(credentials: LoginCredentials): Observable<LoginResult> {
    this.lastCredentials = credentials;
    return this.response;
  }
}

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let gateway: StubAuthGateway;
  let router: Router;

  const query = <T extends HTMLElement>(selector: string): T =>
    fixture.nativeElement.querySelector(selector) as T;

  const fillForm = (email: string, password: string) => {
    const emailInput = query<HTMLInputElement>('#email');
    const passwordInput = query<HTMLInputElement>('#password');

    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    gateway = new StubAuthGateway();
    localStorage.clear();
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AUTH_GATEWAY, useValue: gateway }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders the sign-in form', () => {
    expect(query('h1').textContent).toContain('Sign in');
    expect(query('#email')).toBeTruthy();
    expect(query('#password')).toBeTruthy();
  });

  it('does not call the gateway while the form is invalid', () => {
    spyOn(gateway, 'authenticate').and.callThrough();

    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(gateway.authenticate).not.toHaveBeenCalled();
  });

  it('shows field errors after an invalid submit', () => {
    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('.field__error');
    expect(errors.length).toBe(2);
    expect(errors[0].textContent).toContain('Enter your work email address.');
    expect(errors[1].textContent).toContain('Enter your password.');
  });

  it('rejects a malformed email address', () => {
    fillForm('not-an-email', 'Audit@2026');
    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(query('#email-error').textContent).toContain('Enter a valid email address');
  });

  it('rejects a password shorter than eight characters', () => {
    fillForm('auditor@auditai.com', 'short');
    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(query('#password-error').textContent).toContain('at least 8 characters');
  });

  it('toggles password visibility', () => {
    const toggle = query<HTMLButtonElement>('.field__toggle');
    expect(query<HTMLInputElement>('#password').type).toBe('password');

    toggle.click();
    fixture.detectChanges();

    expect(query<HTMLInputElement>('#password').type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');
  });

  it('submits the entered credentials and navigates to the dashboard', fakeAsync(() => {
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    fillForm('auditor@auditai.com', 'Audit@2026');
    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    tick();
    fixture.detectChanges();

    expect(gateway.lastCredentials).toEqual({
      email: 'auditor@auditai.com',
      password: 'Audit@2026',
      rememberMe: false,
    });
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  }));

  it('surfaces the gateway error message without navigating', fakeAsync(() => {
    const navigate = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    gateway.response = throwError(() => new AuthError('invalid_credentials', 'Bad credentials.'));

    fillForm('auditor@auditai.com', 'Audit@2026');
    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    tick();
    fixture.detectChanges();

    expect(query('[role="alert"]').textContent).toContain('Bad credentials.');
    expect(navigate).not.toHaveBeenCalled();
  }));

  it('falls back to a generic message for unexpected failures', fakeAsync(() => {
    gateway.response = throwError(() => new Error('boom'));

    fillForm('auditor@auditai.com', 'Audit@2026');
    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    tick();
    fixture.detectChanges();

    expect(query('[role="alert"]').textContent).toContain('could not sign you in');
  }));

  it('re-enables the form after a failed attempt', fakeAsync(() => {
    gateway.response = throwError(() => new AuthError('account_locked', 'Locked.'));

    fillForm('auditor@auditai.com', 'Audit@2026');
    query<HTMLFormElement>('form').dispatchEvent(new Event('submit'));
    tick();
    fixture.detectChanges();

    expect(query<HTMLInputElement>('#email').disabled).toBeFalse();
    expect(query<HTMLButtonElement>('button[type="submit"]').disabled).toBeFalse();
  }));
});
