export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

export interface LoginResult {
  user: AuthenticatedUser;
  token: string;
}

export type AuthErrorCode = 'invalid_credentials' | 'account_locked' | 'server_error';

export class AuthError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
