# audit-ai

Angular front end for the EXL platform. This repository currently contains the
sign-in experience and the app shell it plugs into.

## Requirements

- Node.js `^20.19.0 || ^22.12.0 || >=24.0.0`
- npm 10 or newer

## Getting started

```bash
npm install
npm start
```

The dev server runs on http://localhost:4200 and redirects to `/login`.

## Scripts

| Script                 | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `npm start`            | Dev server with live reload                   |
| `npm run build`        | Production bundle in `dist/audit-ai`          |
| `npm test`             | Karma/Jasmine unit tests in watch mode        |
| `npm run test:ci`      | Single headless test run                      |
| `npm run format`       | Apply Prettier formatting                     |
| `npm run format:check` | Verify formatting without writing             |

## Demo credentials

Authentication is not yet wired to a backend, so the login screen runs against
an in-memory gateway with two seeded accounts:

| Email                      | Password    | Behaviour                      |
| -------------------------- | ----------- | ------------------------------ |
| `a.analyst@exlservice.com` | `Exl@2026!` | Signs in successfully          |
| `locked@exlservice.com`    | `Exl@2026!` | Returns a locked-account error |

Any other email or password returns an invalid-credentials error.

## Structure

```
src/
  styles.scss                    design tokens and base styles
  styles/_components.scss        shared field, button, checkbox and alert styles
  app/
    app.routes.ts                route table with auth and guest guards
    core/auth/                   auth service, guards, gateway boundary
    features/auth/login/         login screen
    features/dashboard/          post-login landing page
    features/placeholder/        stand-in for pages the login screen links to
```

## Connecting a real identity provider

`AuthService` talks to an `AuthGateway`, resolved through the `AUTH_GATEWAY`
injection token. Replacing `InMemoryAuthGateway` in `app.config.ts` with an
HTTP-backed implementation is the only change needed; the login component and
guards stay untouched.
