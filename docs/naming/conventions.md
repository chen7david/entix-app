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

[Why enforce strict naming?](../why/naming.md)

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
