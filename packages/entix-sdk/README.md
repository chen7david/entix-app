# Entix SDK

A shared SDK for the Entix application that provides:

1. Type definitions shared between frontend and backend
2. API client for making type-safe API requests
3. Validation schemas for request/response data
4. Common utility types for consistent development

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get up and running in 5 minutes
- **[Architecture Guide](./ARCHITECTURE.md)** - Deep dive into SDK architecture and best practices

## Installation

```bash
pnpm add @repo/entix-sdk
```

## Quick Usage

```typescript
import { EntixApiClient } from '@repo/entix-sdk';

// Create API client
const api = new EntixApiClient({
  baseURL: 'http://localhost:3000',
  getAuthToken: () => localStorage.getItem('token'),
  refreshAuthToken: async () => {
    // Your refresh logic
    return newToken;
  },
  onTokenRefreshed: token => {
    localStorage.setItem('token', token);
  },
});

// Use the client
const users = await api.users.getUsers();
const roles = await api.roles.getRoles();
await api.auth.login({ email: 'user@example.com', password: 'password' });
```

## Available Services

- **Authentication** (`api.auth`) - Login, signup, password reset
- **Users** (`api.users`) - User management operations
- **Roles** (`api.roles`) - Role management
- **Permissions** (`api.permissions`) - Permission management
- **User Roles** (`api.userRoles`) - User-role assignments
- **Role Permissions** (`api.rolePermissions`) - Role-permission assignments

## Type Safety

All API methods are fully typed with TypeScript:

```typescript
import { User, createUserSchema } from '@repo/entix-sdk';

// Type-safe API calls
const user: User = await api.users.createUser({
  username: 'newuser',
  email: 'user@example.com',
  password: 'password123',
  invitationCode: '123456',
});

// Validation with Zod schemas
const result = createUserSchema.safeParse(userInput);
if (result.success) {
  // Data is valid
  const validData = result.data;
}
```

## Common Types

The SDK provides common utility types:

```typescript
import { BaseEntity, CreateRequest, UpdateRequest, PaginatedResponse } from '@repo/entix-sdk';

// Use in your own types
type Product = BaseEntity & {
  name: string;
  price: number;
};

type CreateProductRequest = CreateRequest<Product>;
type UpdateProductRequest = UpdateRequest<Product>;
```

## Development

```bash
# Build the SDK
pnpm build

# Watch for changes
pnpm dev

# Run tests (when available)
pnpm test
```

## Architecture

The SDK follows a clean, layered architecture:

- **Models** - Core domain entities
- **Schemas** - Zod validation rules
- **DTOs** - API request/response types
- **Client** - HTTP API services

See the [Architecture Guide](./ARCHITECTURE.md) for detailed information.

## Contributing

1. Read the [Quick Start Guide](./QUICK_START.md) for new features
2. Follow the [Architecture Guide](./ARCHITECTURE.md) for best practices
3. Keep it simple - follow the KISS principle
4. Use relative imports (no path aliases)
5. Add tests for new functionality

## Recent Improvements

- ✅ Fixed path alias issues for better build compatibility
- ✅ Added comprehensive documentation
- ✅ Added common utility types
- ✅ Improved type safety and consistency
- ✅ Standardized naming conventions
