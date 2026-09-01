import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { LoginCredentials, LoginResult } from './auth.models';

/**
 * Boundary between the login UI and whichever identity provider backs it.
 * Swapping the provider for `AUTH_GATEWAY` is the only change needed once the
 * real identity API is available.
 */
export interface AuthGateway {
  authenticate(credentials: LoginCredentials): Observable<LoginResult>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
