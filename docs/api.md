# API & Error Handling

## API Documentation

The Worker serves OpenAPI documentation:

- **OpenAPI Specification (JSON)**: [/api/v1/openapi](/api/v1/openapi)
  - Raw JSON definition of all endpoints, schemas, and responses
- **Interactive API Reference**: [/api/v1/api-reference](/api/v1/api-reference)
  - Interactive documentation powered by **Scalar**
  - Test endpoints directly from the browser
  - View request/response schemas
  - Generate client code snippets

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
