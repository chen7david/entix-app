# Middleware

Middleware in Entix-App is built using [Hono](https://hono.dev/) and processes requests in a specific order before they reach route handlers.

## Middleware Execution Order

```mermaid
graph LR
    Request[Incoming Request] --> CORS[CORS Middleware]
    CORS --> Logger[Logger Middleware]
    Logger --> Route{Route Exists?}
    Route -->|Yes| Handler[Route Handler]
    Route -->|No| NotFound[Not Found Handler]
    Handler --> Response[Response]
    NotFound --> Response
    Handler -.Error.-> GlobalError[Global Error Handler]
    Middleware -.Error.-> GlobalError
    GlobalError --> ErrorResponse[Error Response]
```

## CORS Middleware

**File**: `api/lib/app.lib.ts`

The CORS middleware is configured to allow cross-origin requests from specific origins during development and production.

### Configuration

```typescript
app.use('*', cors({
    origin: (origin, c) => {
        const allowedOrigins = [
            'http://localhost:3000',     // API server
            'http://localhost:8000',     // Vite dev server
            c.env.FRONTEND_URL,          // Dynamic frontend URL
            'https://entix.org',         // Production
            'https://staging.entix.org'  // Staging
        ];
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

- **Dynamic Origin Check**: Uses a function to validate origins against an allowlist
- **Environment Awareness**: Includes `c.env.FRONTEND_URL` for environment-specific origin
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

## Authentication Middleware

**Files**: 
- `api/middleware/auth.middleware.ts`
- `api/middleware/org-membership.middleware.ts`
- `api/lib/auth-middleware.lib.ts`

Entix-App uses a **two-layer authentication architecture** to secure routes:

1. **Layer 1**: `requireAuth` - Validates user session
2. **Layer 2**: `requireOrgMembership` - Validates organization membership

### Layer 1: requireAuth

Validates that the user has a valid session and sets `userId` in the request context.

**File**: `api/middleware/auth.middleware.ts`

```typescript
export const requireAuth = async (c: AppContext, next: Next) => {
    const authClient = auth(c);
    const session = await authClient.api.getSession({ 
        headers: c.req.raw.headers 
    });

    if (!session || !session.user) {
        throw new UnauthorizedError("Authentication required");
    }

    c.set("userId", session.user.id);
    await next();
};
```

**What it does**:
- Checks for valid session using Better Auth
- Stores `userId` in context for downstream handlers
- Throws `UnauthorizedError` (401) if no valid session

**Applied to**: All routes starting with `/api/v1/organizations/*`

### Layer 2: requireOrgMembership

Validates that the authenticated user is a member of the organization in the route.

**File**: `api/middleware/org-membership.middleware.ts`

```typescript
export const requireOrgMembership = async (c: AppContext, next: Next) => {
    const userId = c.get('userId');
    const organizationId = c.req.param('organizationId');
    
    if (!userId) {
        throw new UnauthorizedError("Authentication required");
    }
    
    const db = getDbClient(c);
    const membership = await db.query.member.findFirst({
        where: and(
            eq(schema.member.userId, userId),
            eq(schema.member.organizationId, organizationId)
        )
    });
    
    if (!membership) {
        throw new ForbiddenError(
            `You are not a member of organization: ${organizationId}`
        );
    }
    
    // Store membership details in context
    c.set('organizationId', organizationId);
    c.set('membershipId', membership.id);
    c.set('membershipRole', membership.role);
    
    await next();
};
```

**What it does**:
- Extracts `organizationId` from route params
- Queries database to verify user is a member
- Stores `organizationId`, `membershipId`, and `membershipRole` in context
- Throws `ForbiddenError` (403) if not a member

**Applied to**: All routes matching `/api/v1/organizations/:organizationId/*`

### Middleware Chain

```mermaid
graph LR
    Request[Request] --> RequireAuth[requireAuth]
    RequireAuth -->|Sets userId| RequireOrgMembership[requireOrgMembership]
    RequireOrgMembership -->|Sets org context| Handler[Route Handler]
    RequireAuth -.No session.-> Unauthorized[401 Unauthorized]
    RequireOrgMembership -.Not member.-> Forbidden[403 Forbidden]
```

### Context Variables

After both middleware layers run, handlers have access to:

```typescript
const userId = c.get('userId')!;              // From requireAuth
const organizationId = c.get('organizationId')!;  // From requireOrgMembership
const membershipId = c.get('membershipId')!;      // From requireOrgMembership
const membershipRole = c.get('membershipRole')!;  // From requireOrgMembership
```

**Note**: Use `!` (non-null assertion) because middleware guarantees these exist.

### Example Handler

With both middleware layers, handlers are simplified:

```typescript
export class LessonHandler {
    static create: AppHandler = async (c) => {
        // No need to check auth or membership - middleware did it!
        const userId = c.get('userId')!;
        const organizationId = c.get('organizationId')!;
        const role = c.get('membershipRole')!;
        
        const data = c.req.valid("json");
        
        // Create resource with org and user context
        const lesson = await db.insert(schema.lesson).values({
            id: nanoid(),
            userId,
            organizationId,
            ...data,
        }).returning();
        
        return c.json(lesson[0]);
    };
}
```

**Benefits**:
- ✅ No repeated membership checks in handlers
- ✅ Single database query per request (cached in context)
- ✅ Clean, readable handlers
- ✅ Type-safe context access

### Mounting Middleware

Both layers are mounted in `api/lib/auth-middleware.lib.ts`:

```typescript
export const mountAuthMiddleware = (app: AppOpenApi) => {
    // Layer 1: Authentication (sets userId in context)
    app.use('/api/v1/organizations/*', requireAuth);

    // Layer 2: Organization membership (sets org context)
    app.use('/api/v1/organizations/:organizationId/*', requireOrgMembership);
};
```

**Execution order**:
1. Request to `/api/v1/organizations/org-123/lessons`
2. `requireAuth` runs → validates session → sets `userId`
3. `requireOrgMembership` runs → validates membership → sets `organizationId`, `membershipId`, `membershipRole`
4. Handler runs → has access to all context variables

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

