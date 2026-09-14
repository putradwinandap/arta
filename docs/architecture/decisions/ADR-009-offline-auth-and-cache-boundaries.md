# ADR-009: Offline authentication and cache boundaries

## Status

Accepted for MVP implementation in Issue #44.

## Decision

Arta distinguishes an unreachable server from an invalid session. A cached user snapshot may restore an offline-authenticated UI state after a successful online login, but it never authorizes API requests or replaces server-side membership checks. Only an explicit HTTP 401 response invalidates the cached auth state.

Household and finance snapshots are cached locally as read-only data, scoped to the authenticated user and household. Local Quick Captures remain the only offline write workflow in MVP and retain their stable client IDs for idempotent retry. Passwords, session tokens, cookies, and secrets are never stored in the client cache.

## Consequences

- Reloading during a temporary outage does not unnecessarily send the user to login.
- Cached financial data must display its last-synced time and must not be presented as current server truth.
- Server-only mutations remain unavailable offline.
- Reconnection must revalidate the session before syncing local captures.
- A local capture must remain retained when retry receives HTTP 401; it may be retried only after authentication is restored.
- Authenticated user changes and logout invalidate cached auth and household snapshots to prevent cross-user restoration.
- Session expiry does not authorize migration of local captures into a different household.
