# Entix SDK Architecture Guide

## Quick Start for New Contributors 🚀

This guide helps new developers quickly understand and contribute to the Entix SDK. We follow the **KISS principle** (Keep It Simple Stupid) - minimal code, maximum clarity.

## Current Architecture Overview

The Entix SDK is a **shared TypeScript library** used by both frontend and backend applications. It provides:

1. **Type-safe API client** for making HTTP requests
2. **Shared type definitions** (models, DTOs)
3. **Validation schemas** using Zod
4. **Unified interfaces** between frontend and backend

### Project Structure

```
packages/entix-sdk/
├── src/
│   ├── models/          # Core domain entities
│   ├── dtos/            # Data transfer objects
│   ├── schemas/         # Zod validation schemas
│   ├── client/          # API client implementation
│   ├── shared/          # Common utilities
│   └── index.ts         # Main exports
├── dist/                # Built output (CJS + ESM)
├── package.json         # Package configuration
└── tsconfig.json        # TypeScript configuration
```

## Architecture Layers (Bottom → Top)

```
┌─────────────────────────────────────┐
│           CLIENT LAYER              │ ← API services (UserApi, RoleApi)
├─────────────────────────────────────┤
│           SCHEMA LAYER              │ ← Validation schemas (Zod)
├─────────────────────────────────────┤
│            DTO LAYER                │ ← Request/Response types
├─────────────────────────────────────┤
│           MODEL LAYER               │ ← Core domain entities
└─────────────────────────────────────┘
```

### Dependency Rules

- **Client** depends on DTOs and Models
- **DTOs** depend on Schemas and Models
- **Schemas** are independent (only Zod)
- **Models** are independent (pure types)

## Where Things Go 📂

### 1. Models (`src/models/`)

**Purpose**: Core domain entities - the "what" of your system

**When to add**: When you have a new business entity

```typescript
// src/models/user.model.ts
export type User = {
  id: string;
  email: string;
  username: string;
  // Core properties only
};
```

**Rules**:

- ✅ Pure TypeScript types only
- ✅ Represent business concepts
- ❌ No dependencies on other layers
- ❌ No validation logic

### 2. Schemas (`src/schemas/`)

**Purpose**: Validation rules using Zod

**When to add**: When you need to validate request data

```typescript
// src/schemas/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});
```

**Rules**:

- ✅ Only validation logic
- ✅ Input validation for APIs
- ❌ No business logic
- ❌ No direct model imports

### 3. DTOs (`src/dtos/`)

**Purpose**: API request/response types - the "how" data flows

**When to add**: When you have new API endpoints

```typescript
// src/dtos/user.dto.ts
import { User } from '@models/user.model';
import { createUserSchema } from '@schemas/user.schema';
import { z } from 'zod';

export type CreateUserParamsDto = z.infer<typeof createUserSchema>;
export type CreateUserResultDto = User;
```

**Rules**:

- ✅ API-focused types
- ✅ Use schema inference
- ✅ Clear naming: `<Action><Entity><Params|Result>Dto`
- ❌ No business logic

### 4. Client (`src/client/`)

**Purpose**: API service classes for making HTTP requests

**When to add**: When you have new API resources

```typescript
// src/client/user-api.ts
export class UserApi {
  constructor(private client: ApiClient) {}

  async createUser(params: CreateUserParamsDto): Promise<CreateUserResultDto> {
    return this.client.post('/v1/users', params);
  }
}
```

**Rules**:

- ✅ One service per resource
- ✅ Use DTOs for types
- ✅ HTTP method mapping
- ❌ No business logic in services

## Import Conventions

We use **path aliases** for cleaner imports:

```typescript
// ✅ Preferred - Clean and readable
import { User } from '@models/user.model';
import { createUserSchema } from '@schemas/user.schema';
import { CreateUserParamsDto } from '@dtos/user.dto';

// ❌ Avoid - Harder to read and maintain
import { User } from '../../../models/user.model';
import { createUserSchema } from '../../../schemas/user.schema';
```

**Available Path Aliases**:

- `@models/*` → `src/models/*`
- `@schemas/*` → `src/schemas/*`
- `@dtos/*` → `src/dtos/*`
- `@shared/*` → `src/shared/*`

## Development Workflow 🔄

### Adding a New Feature (Example: Products)

**Step 1**: Create the model

```typescript
// src/models/product.model.ts
export type Product = {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
};
```

**Step 2**: Create validation schemas

```typescript
// src/schemas/product.schema.ts
export const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});
```

**Step 3**: Create DTOs

```typescript
// src/dtos/product.dto.ts
import { Product } from '@models/product.model';
import { createProductSchema } from '@schemas/product.schema';
import { z } from 'zod';

export type CreateProductParamsDto = z.infer<typeof createProductSchema>;
export type CreateProductResultDto = Product;
export type GetProductsResultDto = Product[];
```

**Step 4**: Create API service

```typescript
// src/client/product-api.ts
import { ApiClient } from './api-client';
import { CreateProductParamsDto, CreateProductResultDto, GetProductsResultDto } from '@dtos/product.dto';

export class ProductApi {
  constructor(private client: ApiClient) {}

  async getProducts(): Promise<GetProductsResultDto> {
    return this.client.get('/v1/products');
  }

  async createProduct(params: CreateProductParamsDto): Promise<CreateProductResultDto> {
    return this.client.post('/v1/products', params);
  }
}
```

**Step 5**: Export everything

```typescript
// src/models/index.ts
export * from './product.model';

// src/schemas/index.ts
export * from './product.schema';

// src/dtos/index.ts
export * from './product.dto';

// src/client/index.ts
export * from './product-api';

// Update EntixApiClient constructor
readonly products: ProductApi;
this.products = new ProductApi(this.client);
```

## Current Issues & Improvements 🔧

### Issue 1: Inconsistent Naming

**Problem**: Mixed naming conventions (`user_role.model.ts` vs `user-auth.model.ts`)

**Solution**: Standardize to kebab-case

```bash
# Rename files
user_role.model.ts → user-role.model.ts
role_permission.model.ts → role-permission.model.ts
```

### Issue 2: Unnecessary Complexity

**Problem**: Three separate layers (models, dtos, schemas) when we could simplify

**Better Approach**: Domain-driven organization

```
src/
├── domains/
│   ├── user/
│   │   ├── user.types.ts      # Model + DTOs
│   │   ├── user.schemas.ts    # Validation
│   │   └── user.service.ts    # API service
│   ├── auth/
│   └── roles/
├── client/
│   ├── api-client.ts          # Base HTTP client
│   └── index.ts               # Main EntixApiClient
└── index.ts
```

### Issue 3: Path Mapping Issues

**Problem**: Path aliases work in development but break in builds

**Solution**: Use relative imports for better compatibility

```typescript
// Instead of
import { User } from '@models/user.model';

// Use
import { User } from '../models/user.model';
```

## Recommended Minimal Architecture 🎯

### Option A: Current Structure (Minimal Changes)

Keep existing structure but fix issues:

1. **Standardize naming**: All kebab-case
2. **Keep path aliases**: They work well with modern tooling
3. **Consolidate exports**: Single index per layer
4. **Add type utilities**: Common types in one place

### Option B: Domain-Driven (Recommended)

Reorganize by business domains:

```
src/
├── domains/
│   ├── auth/
│   │   ├── auth.types.ts
│   │   ├── auth.schemas.ts
│   │   └── auth.service.ts
│   ├── users/
│   └── roles/
├── shared/
│   ├── types.ts               # Common types
│   └── client.ts              # Base HTTP client
└── index.ts
```

**Benefits**:

- Related code stays together
- Easier to find and modify
- Better for team ownership
- Scales better

## Implementation Plan (Non-Breaking) 📋

### Phase 1: Fix Current Issues

1. **Standardize file names**
2. **Keep path aliases** - They work well with modern tooling
3. **Add missing exports**
4. **Improve documentation**

### Phase 2: Gradual Migration (Optional)

1. **Create new domain structure**
2. **Move one domain at a time**
3. **Update imports gradually**
4. **Deprecate old structure**

## Best Practices 📝

### 1. Type Naming Convention

```typescript
// Models (domain entities)
export type User = { ... };
export type Role = { ... };

// DTOs (API contracts)
export type CreateUserRequest = { ... };
export type GetUsersResponse = User[];

// Schemas (validation)
export const createUserSchema = z.object({ ... });
```

### 2. API Service Pattern

```typescript
export class UserService {
  constructor(private client: ApiClient) {}

  // CRUD operations
  async list(): Promise<User[]> { ... }
  async get(id: string): Promise<User> { ... }
  async create(data: CreateUserRequest): Promise<User> { ... }
  async update(id: string, data: UpdateUserRequest): Promise<User> { ... }
  async delete(id: string): Promise<void> { ... }
}
```

### 3. Error Handling

```typescript
// Define error types
export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

// Handle in client
export class ApiClient {
  async request<T>(...args): Promise<T> {
    try {
      return await this.httpClient.request(...args);
    } catch (error) {
      throw this.transformError(error);
    }
  }
}
```

## Testing Strategy 🧪

### Unit Tests (Per Domain)

```typescript
// domains/users/users.service.test.ts
describe('UserService', () => {
  it('should create user with valid data', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
// Test with real HTTP client
describe('EntixApiClient', () => {
  it('should authenticate and fetch users', async () => {
    // End-to-end test
  });
});
```

## Common Pitfalls ⚠️

### 1. Over-Engineering

**Don't**: Create too many abstractions

```typescript
// Too complex
abstract class BaseService<T, C, U> {
  abstract create(data: C): Promise<T>;
  abstract update(id: string, data: U): Promise<T>;
}
```

**Do**: Keep it simple

```typescript
// Simple and clear
export class UserService {
  async createUser(data: CreateUserRequest): Promise<User> {
    return this.client.post('/v1/users', data);
  }
}
```

### 2. Circular Dependencies

**Don't**: Import between same-level modules

```typescript
// user.service.ts imports role.service.ts
// role.service.ts imports user.service.ts
```

**Do**: Use composition or events

```typescript
// Both use shared types/interfaces
// Communicate through API calls or events
```

### 3. Tight Coupling

**Don't**: Services that know too much about each other

```typescript
export class UserService {
  async createUser(data: CreateUserRequest) {
    const user = await this.create(data);
    await this.roleService.assignDefaultRole(user.id); // Tight coupling
    return user;
  }
}
```

**Do**: Keep services focused

```typescript
export class UserService {
  async createUser(data: CreateUserRequest): Promise<User> {
    return this.client.post('/v1/users', data);
  }
}

// Handle role assignment at application level
```

## Getting Help 🆘

### Code Review Checklist

- [ ] Follows naming conventions
- [ ] No circular dependencies
- [ ] Uses proper TypeScript types
- [ ] Has appropriate error handling
- [ ] Includes JSDoc comments
- [ ] No over-engineering
- [ ] Uses path aliases for clean imports

### Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

_Remember: The best code is code that doesn't exist. Always ask "Do we really need this?" before adding complexity._
