# Naming Rules

Follow these standards to keep the codebase searchable and clean.

## 1. Variables & Functions
Use `camelCase`.
- `const activeUser = ...`
- `function getMemberById() { ... }`

## 2. Components & Classes
Use `PascalCase`.
- `const SidebarMenu = () => { ... }`
- `class MemberRepository { ... }`

## 3. Files & Folders
Use `kebab-case`.
- `user-profile.tsx`
- `api/routes/auth.routes.ts`

## 4. Database (Drizzle)
Use `snake_case` for SQL table and column names. Use `camelCase` for TypeScript exports.
```typescript
export const orgMember = sqliteTable("org_member", {
    userId: text("user_id"),
});
```

## 5. Routes (URL)
Use `kebab-case`.
- `/api/v1/auth/signup-with-org`
- `/dashboard/settings/change-password`

## 6. DTOs & Validation
Define all request/response schemas in `shared/schemas/dto/`.
- Use the `jsonContent` or `jsonContentRequired` helpers in route definitions.
- Use the inferred `*DTO` types in the Service layer.

## 7. Middleware & Type Flow
1. **Idiomatic Middleware**: Always use `createMiddleware<AppEnv>` from `hono/factory` to define middleware. This ensures that context variables are correctly typed and propagate downstream.
2. **Type Safe Variables**: Declare all context variables in `AppEnv.Variables`. If a middleware guarantees a variable's presence (e.g., `requireAuth` sets `userId`), prefer non-optional types in `AppEnv` to improve ergonomics in protected route handlers.
3. **Safe Session Parsing**: Use Zod's `safeParse` for session validation in auth middleware to prevent schema leakage and ensure a `401 Unauthorized` status for malformed sessions.
4. **Factory Consistency**: Always use factory functions (e.g., `getMemberRepository(ctx)`) inside middleware and handlers instead of direct class instantiation.

## 8. Database Types (Drizzle)
Always use named exports for inferred types in `shared/db/schema/`.
- `export type AuthUser = typeof authUsers.$inferSelect;`
- `export type NewAuthUser = typeof authUsers.$inferInsert;`
- Always prefer these named types over inline `$inferSelect` calls in Repositories and Services.

[Why enforce strict standards?](../why/naming.md)

Last updated: 2026-03-26
[Back to Documentation Guide](../how-to-write-docs.md)
