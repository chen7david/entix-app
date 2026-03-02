# Authorization

This document explains the full authorization model for Entix-App — what roles exist, what permissions they have, and exactly which permission is enforced on every route.

## Two Layers of Authorization

Authorization in Entix-App is split into two distinct layers:

| Layer | Who controls it | How it works |
|---|---|---|
| **Better Auth plugin** | The `organization` plugin enforces rules internally on its own endpoints | No custom code needed. Rules are documented below. |
| **App-level middleware** | `requirePermission` enforces rules on custom Hono routes | Declared in `shared/auth/permissions.ts` and applied per-route. |

> [!IMPORTANT]
> Better Auth controls **all of its own plugin endpoints** automatically. There is no `requirePermission` middleware on those routes — the plugin itself handles authorization. The custom `requirePermission` middleware only applies to **app-defined routes** (non-Better Auth endpoints).

---

## Organization Roles

Three roles exist per organization. A member can hold multiple roles (stored as a comma-separated string, e.g. `"admin,member"`).

| Role | Description |
|---|---|
| `owner` | Full control. Created automatically for the user who creates the organization. |
| `admin` | Full control except deleting the organization or reassigning ownership. |
| `member` | Read-only. Cannot create, update, or delete any org resources. |

> [!NOTE]
> There is also a **Super Admin** concept at the platform level (the `user.role` field set to `"admin"`). Super admins bypass **all** org membership and permission checks and are treated as `owner` on any org route. See [middleware.md](./middleware.md) for details.

---

## Permission Model (`shared/auth/permissions.ts`)

Permissions are defined as a static access-control matrix. When you define custom roles for existing Better Auth roles, the custom definition **fully replaces** the plugin defaults. This means our custom roles must explicitly re-declare all the permissions they need — including Better Auth's built-in ones.

```typescript
// shared/auth/permissions.ts
export const statement = {
    organization: ["update", "delete"],
    invitation: ["create", "cancel"],
    member: ["read", "create", "update", "delete"],
} as const;
```

### Role Permission Matrix

The complete set of permissions per role. The `organization`, `invitation`, and `member:create/update/delete` entries mirror Better Auth's defaults exactly. The `member:read` action is a **custom app-level action** used by app routes.

| Resource | Action | `member` | `admin` | `owner` | Super Admin |
|---|---|:---:|:---:|:---:|:---:|
| `organization` | `update` | ❌ | ✅ | ✅ | ✅ bypass |
| `organization` | `delete` | ❌ | ❌ | ✅ | ✅ bypass |
| `invitation` | `create` | ❌ | ✅ | ✅ | ✅ bypass |
| `invitation` | `cancel` | ❌ | ✅ | ✅ | ✅ bypass |
| `member` | `read` | ✅ | ✅ | ✅ | ✅ bypass |
| `member` | `create` | ❌ | ✅ | ✅ | ✅ bypass |
| `member` | `update` | ❌ | ✅ | ✅ | ✅ bypass |
| `member` | `delete` | ❌ | ✅ | ✅ | ✅ bypass |

---

## Better Auth Endpoint Permissions

These endpoints are exposed by Better Auth at `/api/v1/auth/**`. The plugin enforces authorization internally — **no custom middleware applies here**.

### Organization Endpoints

| Action | Client Method | Required Permission |
|---|---|---|
| Create organization | `authClient.organization.create()` | Any authenticated user (controlled via `allowUserToCreateOrganization` config) |
| Update organization | `authClient.organization.update()` | `organization:update` → **admin or owner** |
| Delete organization | `authClient.organization.delete()` | `organization:delete` → **owner only** |
| Get full organization | `authClient.organization.getFullOrganization()` | Any org member |
| List user's organizations | `authClient.organization.list()` | Any authenticated user (returns orgs they belong to) |
| Set active organization | `authClient.organization.setActive()` | Any org member |
| Check slug availability | `authClient.organization.checkSlug()` | Any authenticated user |

> [!NOTE]
> Organization creation is additionally restricted in this app by the `allowUserToCreateOrganization` hook in `api/lib/auth/config/plugins/organization.plugin.ts`, which limits creation to global super admins only.

### Member Endpoints

| Action | Client Method | Required Permission |
|---|---|---|
| List members | `authClient.organization.listMembers()` | Any org member |
| Get active member | `authClient.organization.getActiveMember()` | Any org member (returns own record) |
| Get active member role | `authClient.organization.getActiveMemberRole()` | Any org member (returns own role) |
| Update member role | `authClient.organization.updateMemberRole()` | `member:update` → **admin or owner** |
| Remove member | `authClient.organization.removeMember()` | `member:delete` → **admin or owner** |
| Add member (server-only) | `auth.api.addMember()` | Server-side only — no session required |
| Leave organization | `authClient.organization.leave()` | Any org member (self-service) |

### Invitation Endpoints

| Action | Client Method | Required Permission |
|---|---|---|
| Send invitation | `authClient.organization.inviteMember()` | `invitation:create` → **admin or owner** |
| Cancel invitation | `authClient.organization.cancelInvitation()` | `invitation:cancel` → **admin or owner** |
| Accept invitation | `authClient.organization.acceptInvitation()` | Any authenticated user (must be the invitee) |
| Reject invitation | `authClient.organization.rejectInvitation()` | Any authenticated user (must be the invitee) |
| Get invitation | `authClient.organization.getInvitation()` | Any authenticated user with the invitation ID |
| List invitations (org) | `authClient.organization.listInvitations()` | Any org member |
| List invitations (user) | `authClient.organization.listUserInvitations()` | Any authenticated user (returns own invitations) |

---

## App Route Permissions

These are custom Hono routes, **not** Better Auth endpoints. They use `requireOrgMembership` (applied globally to all `/api/v1/orgs/*` routes) plus optional `requirePermission` middleware per route.

### Middleware chain reminder

```
requireAuth → requireOrgMembership → [requirePermission] → Handler
```

### Members

| Method | Path | `requirePermission` | `member` | `admin` | `owner` | Super Admin |
|---|---|---|:---:|:---:|:---:|:---:|
| `POST` | `/api/v1/orgs/:organizationId/members` | `member:create` | ❌ | ✅ | ✅ | ✅ bypass |

**File**: `api/routes/orgs/member.routes.ts`  
**What it does**: Creates a new user account and adds them as a member of the organization. Sends a password reset email so the new user can set their password. This is distinct from Better Auth's invitation flow — it directly creates and adds the user in one step.

### Users

| Method | Path | `requirePermission` | `member` | `admin` | `owner` | Super Admin |
|---|---|---|:---:|:---:|:---:|:---:|
| `GET` | `/api/v1/orgs/:organizationId/users` | `member:read` | ✅ | ✅ | ✅ | ✅ bypass |

**File**: `api/routes/users/user.routes.ts`  
**What it does**: Lists all users belonging to the organization. Available to all org roles since reading is non-destructive.

### Admin (Platform-Level)

These routes use `requireAuth` + `requireSuperAdmin`. There is **no org context** — these are platform-wide routes.

| Method | Path | Middleware | Who can access |
|---|---|---|---|
| `GET` | `/api/v1/admin/email-insights` | `requireSuperAdmin` | Super admins only |

**File**: `api/routes/admin/email-insights.routes.ts`

### Auth

These are custom app auth routes that wrap Better Auth's API server-side:

| Method | Path | Auth required | Who can access |
|---|---|---|---|
| `POST` | `/api/v1/auth/signup-with-org` | None | Anyone (public signup) |

**File**: `api/routes/auth/auth.routes.ts`

---

## Adding a New Protected Route

When adding a new route that requires permission checks:

1. **Decide** if the action maps to an existing resource/action pair in `shared/auth/permissions.ts` — if yes, use it directly.
2. **If a new resource is needed**, add it to `statement` in `permissions.ts` and update each role's definition accordingly.
3. **Apply the middleware** in the route definition:

```typescript
import { requirePermission } from '@api/middleware/require-permission.middleware';

const myRoute = createRoute({
    method: 'delete',
    path: '/orgs/{organizationId}/something/{id}',
    // Requires member:delete — only admin and owner
    middleware: [requirePermission('member', ['delete'])] as const,
    // ...
});
```

4. **Update this document** to add the new route to the App Route Permissions table.

---

## Key Files

| File | Purpose |
|---|---|
| [`shared/auth/permissions.ts`](../shared/auth/permissions.ts) | Source of truth for all custom resource/action definitions and role assignments |
| [`api/middleware/require-permission.middleware.ts`](../api/middleware/require-permission.middleware.ts) | The `requirePermission` middleware factory |
| [`api/middleware/org-membership.middleware.ts`](../api/middleware/org-membership.middleware.ts) | `requireOrgMembership` — validates membership and sets context |
| [`api/middleware/auth.middleware.ts`](../api/middleware/auth.middleware.ts) | `requireAuth` — validates session, sets `isSuperAdmin` |
| [`api/lib/auth/config/plugins/organization.plugin.ts`](../api/lib/auth/config/plugins/organization.plugin.ts) | Better Auth organization plugin config — passes `ac` and `roles` to the plugin |
