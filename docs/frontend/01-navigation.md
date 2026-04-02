<!-- AI_CONTEXT -->
<!-- This document explains how to handle client-side navigation in a multi-tenant environment. -->

# Frontend Navigation

In a multi-tenant environment (where URLs look like `/org/:slug/playlists`), we avoid hardcoding routes to ensure the app remains flexible and type-safe.

## 1. Using `AppRoutes`

All frontend route definitions are centralized in `@shared/constants/routes`. This ensures that any change to a URL is reflected across the entire codebase.

```typescript
// @shared/constants/routes
export const AppRoutes = {
    org: {
        dashboard: "/org/:slug/dashboard",
        playlists: "/org/:slug/playlists",
        // ...
    }
};
```

## 2. Using `useOrgNavigate`

When navigating between pages within an organization's context, strictly use the `useOrgNavigate` hook. 

### Why?
- **Type Safety**: It only accepts routes defined in `AppRoutes`.
- **Dynamic Tenant Handling**: It automatically resolves the current `:slug` from the active context, so you don't have to pass it manually every time.

### Example Usage

```tsx
import { useOrgNavigate } from '@web/src/hooks/navigation/useOrgNavigate';
import { AppRoutes } from '@shared/constants/routes';

export const PlaylistCard = ({ playlistId }) => {
    const navigateOrg = useOrgNavigate();

    const goToPlaylist = () => {
        // ✅ No hardcoding! Automatically resolves current organization's slug.
        navigateOrg(AppRoutes.org.playlists.details, { playlistId });
    };

    return <Card onClick={goToPlaylist}>...</Card>;
};
```

## 3. Best Practices

1.  **Never hardcode paths**: Use `AppRoutes` constants for everything.
2.  **Context-awareness**: Use `useOrgNavigate` whenever you are inside the `/org/:slug` shell.
3.  **Global Navigation**: For cross-organization or account-level navigation (like `/settings`), use the standard `useNavigate` from `react-router-dom`.

---
Last updated: 2026-03-30
