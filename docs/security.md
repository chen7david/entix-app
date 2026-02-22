# Security & Best Practices

## Data Extraction: Context vs URL Parameters

A critical mechanism in API security is correctly determining **who** is making a request and **what scope** they are authorized to operate within. 

There is a severe security anti-pattern where a handler trusts a client-provided URL parameter to determine the authorization scope, rather than trusting the cryptographically verified middleware session.

This application enforces a strict architectural boundary on how data is extracted inside Route Handlers (`api/routes/*`).

### The Golden Rule

1. **Authorization Scope Identifiers** MUST be read from `ctx.get(...)`.
2. **Target Resource Identifiers** MUST be read from `ctx.req.param(...)` or `ctx.req.valid('param')`.

---

### 1. Authorization Scope Identifiers (`ctx.get`)

If a piece of information defines the **Boundary of Trust**, it is an Authorization Scope. 

Examples include:
*   `userId` (The identity of the user making the request)
*   `organizationId` (The tenant/organization the user is requesting access to)
*   `membershipRole` (The role the user possesses within that organization)

**How it works:**
The `requireOrgMembership` middleware intercepts the request, reads the `:organizationId` from the URL, queries the database to cryptographically prove the user belongs to that organization, and **injects it into the trusted Hono Context** (`c.set('organizationId', id)`).

### 2. Target Resource Identifiers (`ctx.req.valid('param')`)

If a piece of information defines the **Specific Object** being acted upon *within* the authorized scope, it is a Target Resource Identifier.

Examples include:
* `projectId`
* `memberId`
* `invitationId`

**How it works:**
These identifiers are not implicitly trusted. The handler extracts them from the URL parameter and executes a database query that is **strictly scoped** by the trusted context variables.

**The Anti-Pattern (Vulnerable):**
```typescript
static createProject = async (c) => {
    // ❌ DANGEROUS: Trusting the user-provided URL parameter
    const organizationId = c.req.valid('param').organizationId; 
    
    // ... create project using this organizationId
}
```

**The Correct Pattern (Secure):**
```typescript
static deleteProject = async (c) => {
    // 1. Get the trusted scope
    const organizationId = c.get('organizationId')!;
    
    // 2. Get the target resource being requested
    const projectId = c.req.valid('param').projectId;
    
    // 3. SECURE: Delete only if it matches BOTH
    await db.delete(project).where(
        and(
            eq(project.id, projectId),
            eq(project.organizationId, organizationId) // Binds the action to the trusted scope!
        )
    );
}
```

### 3. Contextual Data Leakage Rule

It is equally important that **Target Resource Identifiers are NEVER parsed if they belong to a higher Authorization Scope Level.** 

For example, when creating a project for a specific user, the `userId` is an Authorization Scope variable, NOT a target parameter.

```typescript
// SECURE: User ID extracted strictly from middleware context
export const getProjects = async (c: AppContext) => {
    const userId = c.get('userId')!; // Verifiably the authenticated actor
    const targetUserId = c.req.valid('param').targetUserId; // Acted upon

    if (userId !== targetUserId) {
        throw new ForbiddenError("Cannot access another user's projects");
    }
};
```

---

## React Route Guards: Hierarchical Authorization

The frontend enforces access control through a strict hierarchy of React Router guards. **Route Guards must never overlap or mask each other.** They are designed to operate as a cascade.

### 1. The Core Hierarchy

| Guard | Condition for Access | Purpose |
|------|--------------------|---------|
| `GuestGuard` | `!session.data?.user` | Prevents authenticated users from seeing Auth screens (Sign-in/Sign-up). Redirects active sessions to their active Tenant Dashboard. |
| `AuthGuard` | `session.data?.user` | Protects the private application. Verifies valid session and email verification. Unauthenticated users are sent to `/auth/sign-in`. |
| `OrgGuard` | `activeOrganization` | Restricts access to a specific Tenant Workspace (`/org/:slug`). Users without access to the slug in the URL are bounced (403 or 404). |
| `AdminGuard` | `session.data?.user.role === 'admin'` | Restricts access to Global Application Super Administrators. |

### 2. Guard Nesting Anti-Patterns

Route guards should be structurally decoupled. Nesting them logically causes redundant authorization checks, infinite loops, and structurally orphaned contexts.

#### The "Admin inside Org" Flaw
**Bad:** Placing `AdminGuard` inside `OrgGuard` (`/org/:slug/admin`).
*   **Why it's wrong:** A Global Super Administrator operates *above* organizations. Forcing them to navigate through a specific tenant's slug to access global application settings incorrectly ties platform administration to tenant context.
*   **Fix:** `AdminGuard` must sit as a sibling to `OrgGuard`, directly beneath the root `AuthGuard` (`/admin`).

#### The "Redundant Check" Flaw
**Bad:** Re-asserting `!session.data.user` or returning `Navigate /sign-in` inside `OrgGuard` or `AdminGuard`.
*   **Why it's wrong:** Because both guards exist *underneath* the `AuthGuard` wrapper in React Router, they are mathematically guaranteed to have an authenticated session to even mount. Re-checking auth causes render delays and bloated component logic.
*   **Fix:** Sub-guards should strictly extract their required data (Role, Slug, Membership) and explicitly assume Identity verification has already passed the parent boundary.
