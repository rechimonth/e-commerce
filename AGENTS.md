# AGENTS.md — Project Guide

## Commands

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start Vite dev server              |
| `npm run build`      | Type-check + production build      |
| `npm run lint`       | ESLint (max-warnings=0)            |
| `npm run format`     | Prettier format all files          |
| `npm run test`       | Run unit + integration tests       |
| `npm run test:rules` | Run Firestore Security Rules tests |

## Security Rules Testing

The security rules tests (`tests/unit/security/`) require the Firebase Emulator:

```bash
# 1. Install the Firebase CLI
npm install -g firebase-tools

# 2. Start the emulator suite in one terminal
npx firebase emulators:start --only firestore,auth

# 3. Run the security tests in another terminal
npm run test:rules
```

Or in CI:

```bash
npx firebase emulators:exec "npm run test:rules"
```

## Project Structure

```
src/
  types/          # Centralized domain types (pricing, auth, domain, cart, order, ui, api)
  infrastructure/ # Firebase SDK layer (config, auth, firestore, adapters)
  contexts/       # React Context (AuthContext, AuthProvider)
  hooks/          # Custom hooks (useAuth)
  components/     # UI components
    auth/         # ProtectedRoute, AdminRoute
  pages/          # Route pages (HomePage, NotFoundPage, UnauthorizedPage)
  app/            # App component + routing
tests/
  unit/           # Unit tests (infrastructure, contexts, hooks, components, security)
  integration/    # Integration tests (routing, components)
```
