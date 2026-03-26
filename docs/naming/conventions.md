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

## 7. Database Types (Drizzle)
Always use named exports for inferred types in `shared/db/schema/`.
- `export type AuthUser = typeof authUsers.$inferSelect;`
- `export type NewAuthUser = typeof authUsers.$inferInsert;`
- Always prefer these named types over inline `$inferSelect` calls in Repositories and Services.

[Why enforce strict standards?](../why/naming.md)

Last updated: 2026-03-26
[Back to Documentation Guide](../how-to-write-docs.md)
