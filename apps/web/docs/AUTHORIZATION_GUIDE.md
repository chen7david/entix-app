# Authorization System Guide

## Overview

The authorization system uses a JWT-token-based approach with **static permissions** and **session validation**. This provides optimal performance while ensuring security through server-side session invalidation.

## Architecture Principles

### Key Concepts

1. **Static Permissions**: Permissions are decoded from JWT token at login and remain static until re-authentication
2. **Session Validation**: `useVerifySession` periodically checks if the session is still valid on the server
3. **Smart Token Refresh**: Tokens are only refreshed when expired (401 errors), not for permission checks
4. **Auto-Logout**: Users are automatically logged out if their session is invalidated (e.g., after role changes)
5. **Re-authentication Required**: Permission changes require full re-authentication, not token refresh

### Why This Approach?

- **Performance**: No API calls needed for permission checks - they're instant from JWT
- **Server Efficiency**: Session validation is lightweight compared to permission fetching
- **Security**: Role/permission changes immediately invalidate sessions
- **Scalability**: Minimal server load for authorization operations

## Core Components

### 1. JWT Utilities (`@lib/jwt.utils.ts`)

- Decodes JWT tokens client-side
- Extracts static permissions from token
- Validates token expiration
- Provides permission checking utilities

### 2. Auth Hooks (`@hooks/auth.hook.ts`)

- `useAuth()` - Authentication status and user data
- `usePermissions()` - Static permission checking
- `useVerifySession()` - Session validation (doesn't update permissions)
- `useTokenRefresh()` - Token refresh only on expiration
- `useLogout()` - User logout functionality

### 3. API Client (`@lib/api-client.ts`)

- Derived atoms that update when tokens change
- Automatic token refresh only on 401/expired errors
- Clears tokens on authentication errors

### 4. Auth Provider (`@providers/AuthProvider.tsx`)

- Periodic session validation
- Auto-logout on session invalidation
- Token refresh only when expired

## Usage Examples

### Basic Authentication and Logout

```tsx
import { useAuth, useLogout } from '@/hooks/auth.hook';

const MyComponent = () => {
  const { isAuthenticated, user } = useAuth();
  const logout = useLogout();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <div>Welcome, {user?.username}!</div>
      <button onClick={() => logout.mutate()}>Logout</button>
    </div>
  );
};
```

### Static Permission Checking

```tsx
import { usePermissions } from '@/hooks/auth.hook';
import { PermissionCode } from '@repo/entix-sdk';

const MyComponent = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // These permissions are static from JWT - no API calls!
  if (hasPermission(PermissionCode.GET_USERS)) {
    // User can view users
  }

  if (hasAnyPermission([PermissionCode.CREATE_ROLE, PermissionCode.UPDATE_ROLE])) {
    // User can manage roles
  }

  if (hasAllPermissions([PermissionCode.GET_PERMISSIONS, PermissionCode.CREATE_PERMISSION])) {
    // User has full permission management access
  }
};
```

### Session Validation

```tsx
import { useVerifySession } from '@/hooks/auth.hook';

const MyComponent = () => {
  const { isLoading, isError } = useVerifySession();

  // Session is automatically validated every 5 minutes
  // If session is invalid, user is automatically logged out
  // No manual handling needed!

  if (isLoading) {
    return <div>Validating session...</div>;
  }

  return <div>Session is valid</div>;
};
```

## Authentication Flow

### Login Process

1. User submits credentials
2. Backend validates and creates JWT with user data + permissions
3. JWT is stored in localStorage
4. All permissions are immediately available from JWT
5. Session validation starts automatically

### Session Validation Process

1. `useVerifySession` runs every 5 minutes
2. Sends minimal request to verify session is still valid
3. If session invalid (e.g., role changed), user is logged out
4. If session valid, continues normally

### Token Refresh Process

1. Only triggered on 401/expired errors
2. Uses refresh token to get new access token
3. New token contains latest permissions (if any)
4. If refresh fails, user is logged out

### Permission Change Process

1. Admin changes user's roles/permissions
2. Backend invalidates user's session
3. Next `useVerifySession` call fails
4. User is automatically logged out
5. User must re-authenticate to get new permissions

## Benefits

### 1. **Performance**

- ✅ Instant permission checks (no API calls)
- ✅ Minimal server load for validation
- ✅ Efficient session management

### 2. **Security**

- ✅ Immediate logout on role changes
- ✅ Server-side session control
- ✅ No stale permissions

### 3. **User Experience**

- ✅ Fast, responsive UI
- ✅ Automatic session management
- ✅ Clear feedback on session state

### 4. **Developer Experience**

- ✅ Simple, predictable API
- ✅ Type-safe permissions
- ✅ Declarative components

## Components

### Permission Guard

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';
import { PermissionCode } from '@repo/entix-sdk';

<PermissionGuard permission={PermissionCode.GET_USERS}>
  <UsersList />
</PermissionGuard>

<PermissionGuard
  anyPermissions={[PermissionCode.CREATE_ROLE, PermissionCode.UPDATE_ROLE]}
  fallback={<div>Insufficient permissions</div>}
>
  <RoleManagement />
</PermissionGuard>
```

### Protected Routes

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

<Route
  path="/users"
  element={
    <ProtectedRoute permission={PermissionCode.GET_USERS}>
      <UsersPage />
    </ProtectedRoute>
  }
/>;
```

## Key Differences from Traditional Approaches

### ❌ Traditional Approach

- Fetch permissions on every check
- Refresh permissions periodically
- Heavy server load
- Potential for stale permissions

### ✅ Our Approach

- Static permissions from JWT
- Session validation only
- Lightweight server operations
- Guaranteed fresh permissions via re-authentication

## Best Practices

1. **Trust the JWT**: Permissions in the token are the source of truth
2. **Handle Re-authentication**: Show clear messaging when users need to re-login
3. **Monitor Session State**: Use loading states during validation
4. **Test Edge Cases**: Test session invalidation scenarios
5. **Batch Checks**: Use `hasAnyPermission`/`hasAllPermissions` for multiple checks

## Troubleshooting

### User Not Logged Out After Role Change

- Check if session invalidation is working on backend
- Verify `useVerifySession` is enabled
- Check console for verification errors

### Permissions Not Updating

- This is expected behavior! Permissions are static until re-authentication
- User needs to log out and log back in to get new permissions

### Token Refresh Loops

- Check if refresh token is properly stored
- Verify refresh endpoint returns both access and refresh tokens
- Check for proper error handling in refresh logic

### Performance Issues

- Permissions should be instant (no API calls)
- If slow, check if you're accidentally calling permission APIs
- Verify session validation isn't running too frequently

## Migration Notes

### From Previous Implementation

- Permissions are now static (no `refetchInterval` needed)
- `useVerifySession` validates session only (doesn't update permissions)
- Token refresh only happens on expiration, not permission checks
- Users must re-authenticate for permission changes

This approach provides the optimal balance of performance, security, and user experience for authorization in modern web applications.
