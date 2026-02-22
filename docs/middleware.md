# Middleware

Middleware in Entix-App is built using [Hono](https://hono.dev/) and processes requests in a specific order before they reach route handlers.

## Middleware Execution Order

1.  **Incoming Request**
2.  **CORS Middleware**: Validates Origin and handles OPTIONS preflight.
3.  **Logger Middleware**: Structures log context for tracing.
4.  **Route Matcher**:
    *   If **Yes**: Executes the matched **Route Handler** and proceeds to Response.
    *   If **No**: Executes the **Not Found (404) Handler** and proceeds to Response.
5.  **Global Error Handler**: Any unhandled exception dropped by a Middleware or Route Handler is swept here, returning a unified Error Response payloads.

## CORS Middleware

**File**: `api/lib/app.lib.ts`

The CORS middleware is configured to allow cross-origin requests from specific origins during development and production.

### Configuration

```typescript
app.use('*', cors({
    origin: (origin, ctx) => {
        const allowedOrigins = getCorsOrigins(ctx);
        return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
}));
```

### Key Points

- **Environment-Driven Origins**: Parses external domains dynamically via the `CORS_ORIGINS` comma-separated environment variable (set inside `wrangler.jsonc` or Cloudflare dashboard).
- **Dynamic Preview Branch Support**: `getCorsOrigins` intrinsically wraps `getFrontendUrl()`, automatically whitelisting live Cloudflare Preview URLs at runtime without manual compilation bypasses.
- **Credentials Support**: `credentials: true` allows cookies and authentication headers
- **Preflight Caching**: `maxAge: 600` caches preflight responses for 10 minutes
- **Security**: Rejects requests from unlisted origins by returning `null`

### Why This Matters

In development, Vite serves the frontend on `localhost:8000` while the API runs on `localhost:3000`. CORS allows the frontend to make API requests despite different ports.

## Logger Middleware

**File**: `api/middleware/logger.middleware.ts`

Uses [hono-pino](https://github.com/maou-shonen/hono-pino) for structured logging.

### Configuration

```typescript
import { logger as pinoLogger } from 'hono-pino';

export const logger = () => pinoLogger({
    pino: pino({
        level: 'info',
    }),
});
```

### What Gets Logged

- **HTTP Requests**: Method, path, status code, response time
- **Request ID**: Unique identifier for each request
- **Timestamp**: ISO 8601 formatted timestamp
- **User Agent**: Client information

### Log Format

Logs are output in JSON format for easy parsing:

```json
{
  "level": 30,
  "time": 1708100000000,
  "pid": 1,
  "hostname": "worker",
  "method": "GET",
  "path": "/api/v1/users",
  "status": 200,
  "duration": 45
}
```

### Log Levels

- **`info`** (default): Standard request/response logging
- **`warn`**: Potential issues
- **`error`**: Error conditions

## Global Error Handler

**File**: `api/middleware/global-error.middleware.ts`

Catches all errors thrown during request processing and returns standardized error responses.

### Error Types Handled

#### 1. Zod Validation Errors

When request validation fails, Zod throws a `ZodError`:

```typescript
if (err instanceof ZodError) {
    const flattened = z.treeifyError(err);
    return c.json(
        {
            success: false,
            message: 'Validation failed',
            details: 'properties' in flattened ? flattened.properties : flattened,
        },
        { status: 400 }
    );
}
```

**Example Response**:
```json
{
  "success": false,
  "message": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Must be at least 8 characters"
  }
}
```

#### 2. Custom AppError

For application-specific errors, use the `AppError` class:

```typescript
if (err instanceof AppError) {
    return c.json(
        {
            success: false,
            message: err.message,
            ...(err.details ? { details: err.details } : {}),
        },
        err.status
    );
}
```

**AppError Definition** (`api/errors/app.error.ts`):
```typescript
export class AppError extends Error {
    constructor(
        public message: string,
        public status: number = 500,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AppError';
    }
}
```

**Usage Example**:
```typescript
throw new AppError('User not found', 404);
throw new AppError('Insufficient balance', 400, { current: 100, required: 200 });
```

#### 3. Generic Errors

All other errors are caught and returned as 500 Internal Server Error:

```typescript
return c.json(
    {
        success: false,
        message: 'Internal Server Error',
    },
    500
);
```

### Standardized Error Response Format

All errors follow this structure:

```typescript
{
  success: boolean;      // Always false for errors
  message: string;       // Human-readable error message
  details?: object;      // Optional additional error information
}
```

### Error Logging

All errors are logged to the console before being returned:

```typescript
console.error('Caught error:', err);
```

This helps with debugging while ensuring users don't see sensitive stack traces.

## Not Found Handler

**File**: `api/middleware/not-found.middleware.ts`

Returns a standardized 404 response for routes that don't exist.

### Implementation

```typescript
export const notFoundHandler = (c: Context) => {
    return c.json(
        {
            success: false,
            message: 'Not Found',
        },
        404
    );
};
```

### When It's Triggered

- When a request matches no defined routes
- After all route handlers are checked
- Before the global error handler

**Example**:
```bash
GET /api/v1/nonexistent
→ 404 Not Found
{
  "success": false,
  "message": "Not Found"
}
```

## Authentication & Authorization

**Files**: 
- `api/middleware/auth.middleware.ts`
- `api/middleware/org-membership.middleware.ts`
- `api/middleware/require-permission.middleware.ts`
- `api/lib/auth-middleware.lib.ts`

Entix-App uses a **four-layer security architecture** to protect organization-scoped routes:

1. **Layer 1**: `requireAuth` — Validates user session, detects super admins
2. **Layer 2**: `requireOrgMembership` — Validates organization membership
3. **Layer 3**: `requirePermission` — Validates specific resource permissions
4. **Layer 4**: Super admin bypass (cross-cuts layers 2 and 3)

### Middleware Chain

1.  `requireAuth`: Validates session validity.
    *   *If Pass*: Sets `userId` and `isSuperAdmin` in context.
    *   *If Fail*: **401 Unauthorized**
2.  `requireOrgMembership`: Validates tenant authorization block.
    *   *If Pass*: Sets `organizationId`, `membershipRole`, and `membershipId` in context.
    *   *If Fail*: **403 Forbidden**
3.  `requirePermission`: Validates the Action Matrix execution parameters.
    *   *If Pass*: Reaches the intended **Route Handler**.
    *   *If Fail*: **403 Forbidden**

> **Super admins** bypass layers 2 and 3 entirely.

### Admin Disambiguation

The term "admin" has two meanings in this app:

| Concept | Entity | Field | Values | Scope |
|---------|--------|-------|--------|-------|
| **Super Admin** | `user` | `user.role` | `"user"` / `"admin"` | Platform-wide |
| **Org Admin** | `member` | `member.role` | `"member"` / `"admin"` / `"owner"` | Per-organization |

In code, use `isSuperAdmin` (context variable) for platform-level admins and `membershipRole` for org-level roles.

---

### Layer 1: requireAuth

Validates that the user has a valid session, sets `userId` and `isSuperAdmin` in context.

**File**: `api/middleware/auth.middleware.ts`

```typescript
export const requireAuth = async (c: AppContext, next: Next) => {
    const authClient = auth(c);
    const session = await authClient.api.getSession({ headers: c.req.raw.headers });

    if (!session || !session.user) {
        throw new UnauthorizedError("Authentication required");
    }

    c.set("userId", session.user.id);
    c.set("isSuperAdmin", session.user.role === "admin");
    await next();
};
```

**What it does**:
- Checks for valid session using Better Auth
- Stores `userId` and `isSuperAdmin` in context
- Throws `UnauthorizedError` (401) if no valid session

---

### Layer 2: requireOrgMembership

Validates that the authenticated user is a member of the organization in the route. **Super admins bypass this check**.

**File**: `api/middleware/org-membership.middleware.ts`

```typescript
export const requireOrgMembership = async (c: AppContext, next: Next) => {
    const userId = c.get('userId');
    const organizationId = c.req.param('organizationId');

    // Super admins bypass org membership check
    if (c.get('isSuperAdmin')) {
        c.set('organizationId', organizationId);
        c.set('membershipRole', 'owner'); // Treat as owner
        await next();
        return;
    }

    const memberRepo = new MemberRepository(c);
    const membership = await memberRepo.findMembership(userId, organizationId);

    if (!membership) {
        throw new ForbiddenError(`You are not a member of organization: ${organizationId}`);
    }

    c.set('organizationId', organizationId);
    c.set('membershipId', membership.id);
    c.set('membershipRole', membership.role);
    await next();
};
```

---

### Layer 3: requirePermission

Validates that the user's **org role** has the necessary permission for a specific resource and action. Uses static permissions defined in `shared/auth/permissions.ts`. **Super admins bypass this check**.

**File**: `api/middleware/require-permission.middleware.ts`

```typescript
export const requirePermission = (
    resource: keyof typeof statement,
    actions: (typeof statement)[keyof typeof statement][number][]
) => {
    return async (c: AppContext, next: Next) => {
        // Super admins bypass all permission checks
        if (c.get('isSuperAdmin')) {
            await next();
            return;
        }

        const currentRole = c.get('membershipRole');
        const roleDefinition = roles[currentRole];
        const result = roleDefinition.authorize({ [resource]: actions });

        if (!result.success) {
            throw new ForbiddenError(
                `You are not allowed to access resource: ${resource}`
            );
        }

        await next();
    };
};
```

#### Permissions Definition

Permissions are defined statically in `shared/auth/permissions.ts`:

```typescript
export const statement = {
    project: ["create", "share", "update", "delete"],
    invitation: ["create", "cancel"],
    member: ["create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
    member: ac.newRole({
        project: ["create"],
    }),
    admin: ac.newRole({
        project: ["create", "update"],
        invitation: ["create", "cancel"],
        member: ["create", "update", "delete"],
    }),
    owner: ac.newRole({
        project: ["create", "update", "delete"],
        invitation: ["create", "cancel"],
        member: ["create", "update", "delete"],
    }),
} as const;
```

**Performance**: These are static objects — permission checks are simple in-memory lookups with **zero database queries**.

---

### Protecting Routes

Here's how to protect routes with different levels of authorization:

#### Basic: Auth + org membership only

```typescript
// Any org member can access
const orgRoutes = createRouter()
    .openapi(MyRoutes.listProjects, MyHandler.listProjects);
// requireAuth + requireOrgMembership are applied globally via mountAuthMiddleware
```

#### Permission-based: Specific resource + action

```typescript
import { requirePermission } from '@api/middleware/require-permission.middleware';

// Only users with 'member:create' permission (admin, owner)
const createMember = createRoute({
    method: 'post',
    path: '/orgs/{organizationId}/members',
    middleware: [requirePermission('member', ['create'])] as const,
    // ...
});

// Only users with 'project:update' permission (admin, owner)
const updateProject = createRoute({
    method: 'put',
    path: '/orgs/{organizationId}/projects/{projectId}',
    middleware: [requirePermission('project', ['update'])] as const,
    // ...
});

// Only users with 'project:delete' permission (owner only)
const deleteProject = createRoute({
    method: 'delete',
    path: '/orgs/{organizationId}/projects/{projectId}',
    middleware: [requirePermission('project', ['delete'])] as const,
    // ...
});
```

#### Permission matrix by role

| Resource | Action | Member | Admin | Owner | Super Admin |
|----------|--------|--------|-------|-------|-------------|
| project | create | ✅ | ✅ | ✅ | ✅ (bypass) |
| project | update | ❌ | ✅ | ✅ | ✅ (bypass) |
| project | delete | ❌ | ❌ | ✅ | ✅ (bypass) |
| invitation | create | ❌ | ✅ | ✅ | ✅ (bypass) |
| member | create | ❌ | ✅ | ✅ | ✅ (bypass) |

---

### Context Variables

After all middleware layers run, handlers have access to:

```typescript
const userId = c.get('userId')!;              // From requireAuth
const isSuperAdmin = c.get('isSuperAdmin');    // From requireAuth
const organizationId = c.get('organizationId')!;  // From requireOrgMembership
const membershipId = c.get('membershipId')!;      // From requireOrgMembership
const membershipRole = c.get('membershipRole')!;  // From requireOrgMembership
```

**Note**: Use `!` (non-null assertion) because middleware guarantees these exist.

### Example Handler

```typescript
export class MemberHandler {
    static createMember: AppHandler<typeof MemberRoutes.createMember> = async (c) => {
        // No need to check auth, membership, or permissions — middleware did it!
        const userId = c.get('userId')!;
        const organizationId = c.get('organizationId')!;
        const { email, name, role } = c.req.valid("json");
        
        // Create the member...
        return c.json(result, 201);
    };
}
```

---

### Mounting Middleware

Both base layers are mounted in `api/lib/auth-middleware.lib.ts`:

```typescript
export const mountAuthMiddleware = (app: AppOpenApi) => {
    // Layer 1: Authentication (sets userId, isSuperAdmin)
    app.use('/api/v1/orgs/*', requireAuth);

    // Layer 2: Organization membership (sets organizationId, membershipId, membershipRole)
    app.use('/api/v1/orgs/:organizationId/*', requireOrgMembership);
};
```

Layer 3 (`requirePermission`) is applied per-route via the `middleware` option in route definitions.

### Error Responses

**Unauthenticated** (no session):
```json
{
  "success": false,
  "message": "Authentication required"
}
```
Status: `401 Unauthorized`

**Not a member** (valid session, but not in org):
```json
{
  "success": false,
  "message": "You are not a member of organization: org-123"
}
```
Status: `403 Forbidden`

**Insufficient permissions** (org member, but lacks required permission):
```json
{
  "success": false,
  "message": "You are not allowed to access resource: member"
}
```
Status: `403 Forbidden`

## Middleware Registration

Middleware is registered in `api/lib/app.lib.ts` in the `createApp()` function:

```typescript
export const createApp = () => {
    const app = new OpenAPIHono<AppEnv>({ strict: false });

    // 1. CORS (first - allows preflight)
    app.use('*', cors({ ... }));

    // 2. Logger (logs all requests)
    app.use(logger());
    
    // 3. Authentication (mounts requireAuth and requireOrgMembership)
    mountAuthMiddleware(app);

    // 4. Not Found (catches unmatched routes)
    app.notFound(notFoundHandler);

    // 5. Error Handler (catches all errors)
    app.onError(globalErrorHandler);

    return app;
};
```

**Important**: Order matters! CORS must run first to handle preflight OPTIONS requests.
