# Entix SDK

A shared SDK for the Entix application that provides:

1. Type definitions shared between frontend and backend
2. API client for making type-safe API requests
3. Validation schemas for request/response data

## Installation

```bash
pnpm add @repo/entix-sdk
```

## Usage

### API Client

The SDK provides a fully typed API client for making API requests:

```typescript
import { EntixApiClient } from '@repo/entix-sdk';

// Create an API client instance
const api = new EntixApiClient({
  baseURL: 'http://localhost:3000',
  getToken: () => localStorage.getItem('token'),
  refreshToken: async () => {
    // Refresh token logic
    return newToken;
  },
  onTokenRefreshed: token => {
    localStorage.setItem('token', token);
  },
  onAuthError: error => {
    // Handle authentication errors
  },
});

// Use the client
const users = await api.users.getUsers();
const roles = await api.roles.getRoles();
await api.auth.login({ email: 'user@example.com', password: 'password' });
```

### Types

The SDK exports all types used in the API:

```typescript
import { User, Role, GetUsersResultDto, CreateRoleParamsDto } from '@repo/entix-sdk';

// Use the types
const user: User = {
  id: '123',
  email: 'user@example.com',
  // ...
};
```

### Schemas

The SDK exports Zod schemas for validation:

```typescript
import { createUserSchema, loginSchema } from '@repo/entix-sdk';

// Validate data
const result = createUserSchema.safeParse({
  username: 'user',
  email: 'user@example.com',
  password: 'password',
  invitationCode: '123456',
});

if (!result.success) {
  console.error(result.error);
}
```

## Architecture

The SDK follows a clean architecture pattern with clear separation of concerns:

### Models

Base type definitions that represent core domain entities:

```typescript
export type User = {
  id: string;
  email: string;
  username: string;
  // ...
};
```

### DTOs (Data Transfer Objects)

Types used for API requests and responses:

```typescript
export type GetUserResultDto = User;
export type CreateUserParamsDto = z.infer<typeof createUserSchema>;
```

### Schemas

Zod validation schemas for request data:

```typescript
export const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  // ...
});
```

### Client

API client classes for making API requests:

```typescript
export class UserApi {
  async getUsers(): Promise<GetUsersResultDto> {
    // ...
  }
}
```

## Type System Conventions

We follow a consistent naming convention:

- `<Entity>` - Core domain entity type
- `<Action><Entity>ParamsDto` - DTO for API request parameters
- `<Action><Entity>ResultDto` - DTO for API response data

## Development

```bash
# Build the SDK
pnpm build

# Watch for changes
pnpm dev
```
