# Middleware & Guards

How we protect routes and handle cross-cutting concerns.

## 1. Auth Guard (Frontend)
Protects React routes. Redirects to login if no session exists.
```tsx
<Route element={<AuthGuard />}>
    <Route path="/dashboard" element={<DashboardPage />} />
</Route>
```

## 2. Org Guard (Frontend)
Ensures a user is a member of the organization in the URL.
```tsx
<Route element={<OrgGuard />}>
    <Route path="/org/:orgId/settings" element={<OrgSettings />} />
</Route>
```

## 3. RBAC Middleware (API)
Enforces roles on the backend using `better-auth`.
```typescript
handler.use(orgMembershipMiddleware);
handler.openapi(route, async (c) => {
    // Member record is automatically attached to context
    const member = c.get("member"); 
});
```

## 4. Error Handling
We use a centralized `AppError` class.
```typescript
if (!user) {
    throw new NotFoundError("User not found");
}
```

[Why use Guards?](../why/guards.md)

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
