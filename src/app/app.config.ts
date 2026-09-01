import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { AUTH_GATEWAY } from './core/auth/auth.gateway';
import { InMemoryAuthGateway } from './core/auth/in-memory-auth.gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    { provide: AUTH_GATEWAY, useClass: InMemoryAuthGateway },
  ],
};
