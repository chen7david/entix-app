<!-- AI_CONTEXT -->
<!-- This document explains why repositories are isolated from external APIs. -->

# Why: No External Dependencies in Repositories

In Entix-App, repositories are strictly limited to direct database interactions (`AppDb`). They are **forbidden** from importing or using any external API clients, such as `BetterAuth` or `Stripe`.

## The Problem with External Leakage

When a repository calls an external service, it violates the **Single Responsibility Principle (SRP)**.

1.  **Orchestration vs Data Access**: Creating a user record is a data access task. Sending a verification email (via `auth.api.signUpEmail`) is a business workflow orchestration task.
2.  **Mocking Complexity**: If a repository depends on `BetterAuth`, unit testing the database layer requires mocking a nested identity provider, making tests fragile and hard to maintain.
3.  **Failure Modes**: A repository should only fail due to database-related issues (e.g., uniqueness constraints, timeouts). If it fails because an external API is down, it creates confusing and untraceable error states.

## The Right Way: Service Layer Orchestration

All interactions with non-database systems belong in the **Service Layer**.

### ❌ Incorrect Pattern (Repository Leakage)
```typescript
// member.repository.ts
async createUser(input: NewUser) {
    // VIOLATION: Repository is calling an external auth provider!
    const authResult = await auth.api.signUpEmail(input);
    return await this.db.insert(users).values({ ...input, id: authResult.id });
}
```

### ✅ Correct Pattern (Service Orchestration)
```typescript
// member.service.ts
async signUp(input: SignUpInput) {
    // 1. Service orchestrates the external identity provider
    const authUser = await this.auth.api.signUpEmail(input);
    
    // 2. Service uses the repository for persistence
    await this.memberRepo.insertMember({ ...input, id: authUser.id });
}
```

## Benefits of Isolation
- **Dumb Repositories**: Easier to test with a real local D1 instance.
- **Predictable Errors**: Database errors stay in the repository; integration errors stay in the service.
- **Flexibility**: We can swap identity providers or payment gateways without touching our core database logic.

---
Last updated: 2026-03-30
