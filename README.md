# Entix Application

A modern, scalable application built with a monorepo structure using PNPM workspaces.

## Project Structure

This project is organized as a monorepo with the following structure:

```
entix-app/
├── apps/
│   ├── api/      # Backend API server
│   └── web/      # Frontend web application
└── packages/
    ├── entix-sdk/ # Shared SDK for API types and client
    └── errors/    # Shared error handling
```

## Architecture

The application follows a clean architecture pattern with clear separation of concerns:

### Backend (apps/api)

- **Database Layer**: Uses Drizzle ORM for type-safe database access
- **Service Layer**: Business logic implementation
- **Controller Layer**: API endpoints and request handling
- **Repository Layer**: Data access abstraction

### Frontend (apps/web)

- **React**: UI components and pages
- **React Query**: Data fetching and state management
- **Ant Design**: UI component library
- **Tailwind CSS**: Utility-first CSS framework

### Shared SDK (packages/entix-sdk)

- **Types**: Shared type definitions between frontend and backend
- **API Client**: Type-safe API client for the frontend
- **Schemas**: Zod validation schemas

## Type System Conventions

We follow a consistent naming convention across the codebase:

### Database Layer

- `<Entity>` - Direct Drizzle inference type
- `New<Entity>` - Direct Drizzle insert type
- `<Entity>Update` - Partial omit of New<Entity>

### Service Layer

- `<Action><Entity>Params` - Input parameters for service methods
- `<Action><Entity>Result` - Return type for service methods

### Controller Layer

- `<Action><Entity>ParamsDto` - DTO for controller input (validated by Zod)
- `<Action><Entity>ResultDto` - DTO for controller output

### SDK Layer

- Re-exports controller DTOs for client use
- Defines Zod schemas for validation

## API Client

The SDK provides a fully typed API client for the frontend:

```typescript
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

## Development

### Prerequisites

- Node.js 18+
- PNPM 9.0.0+

### Setup

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

### Building

```bash
# Build all packages and applications
pnpm build
```

### Testing

```bash
# Run tests
pnpm test
```

## Best Practices

1. **Type Safety**: Always use proper typing and avoid `any`
2. **Documentation**: Add TSDoc comments to all functions, methods, and types
3. **DRY Code**: Avoid code duplication by creating reusable components and utilities
4. **Error Handling**: Use custom error classes with meaningful error codes
5. **Consistent Naming**: Follow the established naming conventions
6. **Testing**: Write tests for critical functionality
