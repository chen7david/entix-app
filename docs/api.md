# API & Error Handling




## API Documentation

The Worker serves OpenAPI documentation:

- **OpenAPI Specification (JSON)**: [https://entix.org/api/v1/openapi](https://entix.org/api/v1/openapi)
  - Raw JSON definition of all endpoints, schemas, and responses
- **Interactive API Reference**: [https://entix.org/api/v1/api-reference](https://entix.org/api/v1/api-reference)
  - Interactive documentation powered by **Scalar**
  - Includes both **Main API** and **Authentication API**
  - Test endpoints directly from the browser
  - View request/response schemas
  - Generate client code snippets

---

## OpenAPI & Scalar Integration

The application uses **Scalar** for beautiful, interactive API documentation.

### Configuration

**File**: `api/lib/open-api.lib.ts`

```typescript
app.get('/api/v1/api-reference', Scalar({
  pageTitle: 'Entix API Reference',
  theme: 'purple',
  layout: 'classic',
  defaultHttpClient: {
    targetKey: 'js',
    clientKey: 'fetch',
  },
  sources: [
    {
      url: '/api/v1/openapi',
      title: 'Main API',
    },
    {
      url: '/api/v1/auth/open-api/generate-schema',
      title: 'Authentication API',
    }
  ]
}))
```

### Features

- **Dual API Sources**: Combines Main API and Better Auth API documentation in one interface
- **Interactive Testing**: Test endpoints directly from the docs
- **Client Code Generation**: Auto-generate code snippets in multiple languages (fetch, axios, curl, etc.)
- **Theme**: Purple theme for visual consistency
- **Classic Layout**: Traditional sidebar navigation

### Accessing Documentation

- **Local Development**: `/api/v1/api-reference`
- **Production**: [https://entix.org/api/v1/api-reference](https://entix.org/api/v1/api-reference)

---

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured to allow the frontend to communicate with the API across different origins.

### Configuration

**File**: `api/lib/app.lib.ts`

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

### Key Features

- **Dynamic Origin Validation**: Checks request origin against allowlist
- **Environment-Aware**: Uses `c.env.FRONTEND_URL` for deployment flexibility
- **Credentials Support**: `credentials: true` allows cookies and auth headers
- **Preflight Caching**: `maxAge: 600` caches preflight responses for 10 minutes
- **Security**: Rejects requests from non-allowlisted origins

### Why CORS Matters

In development:
- Frontend runs on `http://localhost:8000` (Vite)
- API runs on `http://localhost:3000` (Wrangler)
- Different ports = different origins = CORS required

In production:
- Both frontend and API served from same origin
- CORS still validates for security

---

## Error Handling & Validation

### Centralized Error Handling
All errors return a standardized JSON response:

```json
{
  "success": false,
  "message": "Error description",
  "details": { ... },
  "status": 400
}
```

### Validation Rules
We use **Zod** and **@hono/zod-openapi** for request validation.

**Critical**: Validation schemas must be defined in the `request` property of `createRoute`:

```typescript
// ✅ Correct: Type inference works
createRoute({
  request: {
    body: jsonContentRequired(userSchema, 'User data'),
  }
})

// ❌ Incorrect: No type inference
createRoute({
  middleware: [validator('json', userSchema)]
})
```

**Validation locations**:
- **Body**: `request.body.content['application/json'].schema`
- **Query**: `request.query`
- **Params**: `request.params`
- **Headers**: `request.headers`

### 404 Handling
Non-existent routes return a standard 404 response from the central error handler.
