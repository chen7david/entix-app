# Entix SDK - Quick Start Guide 🚀

Get up and running with the Entix SDK in under 5 minutes.

## Installation

```bash
pnpm add @repo/entix-sdk
```

## Basic Usage

### 1. Create API Client

```typescript
import { EntixApiClient } from '@repo/entix-sdk';

const api = new EntixApiClient({
  baseURL: 'http://localhost:3000',
  getAuthToken: () => localStorage.getItem('token'),
  refreshAuthToken: async () => {
    // Your token refresh logic
    return newToken;
  },
  onTokenRefreshed: token => {
    localStorage.setItem('token', token);
  },
});
```

### 2. Use API Services

```typescript
// Authentication
const loginResult = await api.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// User management
const users = await api.users.getUsers();
const user = await api.users.createUser({
  username: 'newuser',
  email: 'new@example.com',
  password: 'password123',
  invitationCode: '123456',
});

// Roles & Permissions
const roles = await api.roles.getRoles();
const permissions = await api.permissions.getPermissions();
```

### 3. Use Types & Validation

```typescript
import { User, createUserSchema } from '@repo/entix-sdk';

// Type-safe data
const user: User = {
  id: '123',
  sub: 'auth0|123',
  email: 'user@example.com',
  username: 'user',
  // ...
};

// Validate input
const result = createUserSchema.safeParse(userInput);
if (result.success) {
  // Data is valid
  const validData = result.data;
}
```

## Adding New Features

### Step 1: Add the Model

```typescript
// src/models/product.model.ts
export type Product = {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};
```

### Step 2: Add Validation Schema

```typescript
// src/schemas/product.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
});

export const updateProductSchema = createProductSchema.partial();
```

### Step 3: Add DTOs

```typescript
// src/dtos/product.dto.ts
import { Product } from '../models/product.model';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';
import { z } from 'zod';

export type CreateProductParamsDto = z.infer<typeof createProductSchema>;
export type CreateProductResultDto = Product;
export type UpdateProductParamsDto = z.infer<typeof updateProductSchema>;
export type UpdateProductResultDto = Product;
export type GetProductsResultDto = Product[];
export type GetProductResultDto = Product;
```

### Step 4: Add API Service

```typescript
// src/client/product-api.ts
import { ApiClient } from './api-client';
import {
  CreateProductParamsDto,
  CreateProductResultDto,
  UpdateProductParamsDto,
  UpdateProductResultDto,
  GetProductsResultDto,
  GetProductResultDto,
} from '../dtos/product.dto';

export class ProductApi {
  private readonly client: ApiClient;
  private readonly basePath = '/v1/products';

  constructor(client: ApiClient) {
    this.client = client;
  }

  async getProducts(): Promise<GetProductsResultDto> {
    return this.client.get<GetProductsResultDto>(this.basePath);
  }

  async getProduct(id: string): Promise<GetProductResultDto> {
    return this.client.get<GetProductResultDto>(`${this.basePath}/${id}`);
  }

  async createProduct(params: CreateProductParamsDto): Promise<CreateProductResultDto> {
    return this.client.post<CreateProductResultDto>(this.basePath, params);
  }

  async updateProduct(id: string, params: UpdateProductParamsDto): Promise<UpdateProductResultDto> {
    return this.client.patch<UpdateProductResultDto>(`${this.basePath}/${id}`, params);
  }

  async deleteProduct(id: string): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`);
  }
}
```

### Step 5: Export Everything

```typescript
// src/models/index.ts
export * from './product.model';

// src/schemas/index.ts
export * from './product.schema';

// src/dtos/index.ts
export * from './product.dto';

// src/client/index.ts
export * from './product-api';

// Update EntixApiClient in src/client/index.ts
export class EntixApiClient {
  // Add to constructor
  readonly products: ProductApi;

  constructor(config: ApiClientConfig) {
    // ...existing code...
    this.products = new ProductApi(this.client);
  }
}
```

## Common Patterns

### CRUD Operations

All API services follow the same CRUD pattern:

```typescript
// List all
await api.{resource}.get{Resource}s();

// Get by ID
await api.{resource}.get{Resource}(id);

// Create
await api.{resource}.create{Resource}(data);

// Update
await api.{resource}.update{Resource}(id, data);

// Delete (if applicable)
await api.{resource}.delete{Resource}(id);
```

### Error Handling

```typescript
try {
  const result = await api.users.createUser(userData);
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation errors
  } else if (error.response?.status === 401) {
    // Handle authentication errors
  }
}
```

### Type Guards

```typescript
import { User } from '@repo/entix-sdk';

function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'email' in obj && 'username' in obj;
}
```

## Development Commands

```bash
# Build the SDK
pnpm build

# Watch for changes
pnpm dev

# Run tests (when available)
pnpm test
```

## File Naming Conventions

- **Models**: `entity-name.model.ts` (e.g., `user.model.ts`, `user-role.model.ts`)
- **DTOs**: `entity-name.dto.ts` (e.g., `user.dto.ts`)
- **Schemas**: `entity-name.schema.ts` (e.g., `user.schema.ts`)
- **APIs**: `entity-name-api.ts` (e.g., `user-api.ts`)

## Best Practices

1. **Keep it simple** - Don't over-engineer
2. **Use relative imports** - No path aliases
3. **Follow naming conventions** - Consistent file and type names
4. **One concern per file** - Models are types, schemas are validation
5. **Export everything** - Through index files for clean imports

## Need Help?

1. Check the [Architecture Guide](./ARCHITECTURE.md) for detailed explanations
2. Look at existing implementations for patterns
3. Ask the team for code reviews

---

_Remember: The best SDK is one that's easy to use and understand. Keep it simple!_
