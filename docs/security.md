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
* `userId` (The identity of the user making the request)
* `organizationId` (The tenant/organization the user is requesting access to)
* `membershipRole` (The role the user possesses within that organization)

**How it works:**
The `requireOrgMembership` middleware intercepts the request, reads the `:organizationId` from the URL, queries the database to cryptographically prove the user belongs to that organization, and **injects it into the trusted Hono Context** (`c.set('organizationId', id)`).

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
static createProject = async (c) => {
    // ✅ SECURE: Trusting the middleware-verified context
    const organizationId = c.get('organizationId')!; 
    
    // ... create project using this organizationId
}
```

By strictly using `ctx.get('organizationId')`, you guarantee that a handler can never accidentally act upon an organization that the middleware hasn't explicitly authorized.

---

### 2. Target Resource Identifiers (`ctx.req.valid('param')`)

If a piece of information defines the **Specific Object** being acted upon *within* the authorized scope, it is a Target Resource Identifier.

Examples include:
* `projectId`
* `memberId`
* `invitationId`

**How it works:**
These identifiers are not implicitly trusted. The handler extracts them from the URL parameter and executes a database query that is **strictly scoped** by the trusted context variables.

**The Correct Pattern:**
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
