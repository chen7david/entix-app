# Feature-Driven Development (FDD) Architecture Guide

## Table of Contents

1. [Introduction](#introduction)
2. [What is Feature-Driven Development?](#what-is-feature-driven-development)
3. [Why Choose FDD?](#why-choose-fdd)
4. [Core Principles](#core-principles)
5. [Architecture Layers](#architecture-layers)
6. [Project Structure](#project-structure)
7. [Implementation Guidelines](#implementation-guidelines)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)
10. [Scaling Considerations](#scaling-considerations)
11. [Migration Guide](#migration-guide)
12. [FAQ](#faq)

## Introduction

This document serves as a comprehensive guide to Feature-Driven Development (FDD) architecture as implemented in our React/TypeScript application. Whether you're a new team member or an experienced developer looking to understand our architectural decisions, this guide will help you navigate and contribute effectively to our codebase.

## What is Feature-Driven Development?

Feature-Driven Development (FDD) is an architectural methodology that organizes code around business features rather than technical concerns. Instead of grouping files by their type (components, services, utils), FDD groups them by the business value they provide.

### Traditional vs Feature-Driven Architecture

**Traditional Structure (Technical Layers):**

```
src/
├── components/
├── hooks/
├── services/
├── utils/
├── types/
└── pages/
```

**Feature-Driven Structure (Business Features):**

```
src/
├── features/
│   ├── authentication/
│   ├── user-management/
│   └── dashboard/
├── shared/
├── pages/
└── app/
```

## Why Choose FDD?

Based on industry research and real-world implementation across companies like Spotify, Airbnb, and Netflix, FDD provides several key advantages:

### 1. **Scalability** 🚀

- **Team Independence**: Teams can own complete features without conflicts
- **Parallel Development**: Multiple features can be developed simultaneously
- **Code Isolation**: Changes in one feature don't impact others

### 2. **Maintainability** 🔧

- **High Cohesion**: Related code stays together
- **Low Coupling**: Features have minimal dependencies
- **Clear Boundaries**: Easy to understand what code belongs where

### 3. **Developer Experience** 👩‍💻

- **Faster Onboarding**: New developers can focus on one feature at a time
- **Easier Navigation**: Find everything related to a feature in one place
- **Reduced Cognitive Load**: Smaller, focused modules to understand

### 4. **Business Alignment** 💼

- **Domain-Driven**: Architecture mirrors business requirements
- **Feature Ownership**: Clear mapping of code to business features
- **Agile-Friendly**: Perfect for feature-based development cycles

## Core Principles

### 1. Feature-First Organization

Organize code by **what it does** (business value) rather than **what it is** (technical type).

```typescript
// ❌ Technical grouping
src/components/UserProfile.tsx
src/hooks/useUserData.ts
src/services/userApi.ts

// ✅ Feature grouping
src/features/user-profile/
├── components/UserProfile.tsx
├── hooks/useUserData.ts
└── services/userApi.ts
```

### 2. Explicit Dependencies

Features should explicitly declare their dependencies through well-defined public APIs.

```typescript
// features/authentication/index.ts
export { LoginForm, SignupForm } from './components';
export { useAuth } from './hooks';
export { authService } from './services';
export type { User, AuthCredentials } from './types';
```

### 3. Separation of Concerns

Each layer has a specific responsibility and dependency direction.

### 4. Modular Independence

Features should be as self-contained as possible, minimizing cross-feature dependencies.

## Architecture Layers

Our FDD implementation uses a layered architecture with clear dependency rules:

```
┌─────────────────────────────────────────┐
│                 APP                     │ ← Application initialization
├─────────────────────────────────────────┤
│                PAGES                    │ ← Route-level components
├─────────────────────────────────────────┤
│              FEATURES                   │ ← Business features
├─────────────────────────────────────────┤
│               SHARED                    │ ← Reusable utilities
└─────────────────────────────────────────┘
```

### Layer Dependencies

- **Top → Bottom Only**: Higher layers can import from lower layers
- **No Circular Dependencies**: Features cannot import from each other directly
- **Shared Layer Exception**: All layers can import from shared

### Layer Descriptions

#### 1. App Layer

**Purpose**: Application-wide configuration and initialization

**Contains**:

- Providers (React Context, Theme, etc.)
- Global error boundaries
- Application routing setup
- Global configuration

```typescript
// app/providers/index.ts
export const AppProviders = ({ children }: { children: ReactNode }) => (
  <AuthProvider>
    <ThemeProvider>
      <QueryClientProvider>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  </AuthProvider>
)
```

#### 2. Pages Layer

**Purpose**: Route-level components that compose features

**Contains**:

- Page components
- Route-specific layouts
- SEO metadata
- Page-level data fetching

```typescript
// pages/DashboardPage.tsx
import { DashboardLayout } from '@/layouts'
import { UserProfile } from '@/features/user-profile'
import { Analytics } from '@/features/analytics'

export const DashboardPage = () => (
  <DashboardLayout>
    <UserProfile />
    <Analytics />
  </DashboardLayout>
)
```

#### 3. Features Layer

**Purpose**: Self-contained business features

**Contains**:

- Feature-specific components
- Business logic hooks
- API services
- Type definitions
- Feature state management

#### 4. Shared Layer

**Purpose**: Reusable code not tied to specific business features

**Contains**:

- UI component library
- Utility functions
- Common hooks
- Type definitions
- Configuration

## Project Structure

Our current project follows this structure:

```
apps/web/src/
├── app/                    # Application initialization
│   ├── providers/         # Global providers
│   └── index.ts          # App entry point
│
├── pages/                 # Route-level components
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   └── index.ts         # Page exports
│
├── features/              # Business features
│   ├── authentication/   # User auth feature
│   │   ├── components/   # Auth-specific components
│   │   ├── hooks/        # Auth hooks
│   │   ├── services/     # Auth API services
│   │   ├── types/        # Auth types
│   │   └── index.ts     # Public API
│   │
│   ├── user-management/   # User management feature
│   └── dashboard/        # Dashboard feature
│
├── shared/               # Reusable utilities
│   ├── components/       # UI component library
│   │   ├── ui/          # Basic UI components
│   │   └── layout/      # Layout components
│   ├── hooks/           # Reusable hooks
│   ├── services/        # Shared services
│   ├── types/           # Global types
│   └── utils/           # Utility functions
│
├── layouts/              # Application layouts
├── assets/              # Static assets
└── config/              # Application configuration
```

### Feature Structure Template

Each feature follows this internal structure:

```
features/[feature-name]/
├── components/           # Feature-specific UI components
│   ├── FeatureComponent.tsx
│   ├── FeatureForm.tsx
│   └── index.ts         # Component exports
│
├── hooks/               # Feature-specific hooks
│   ├── useFeatureData.ts
│   ├── useFeatureActions.ts
│   └── index.ts        # Hook exports
│
├── services/            # Feature API services
│   ├── featureApi.ts
│   ├── featureService.ts
│   └── index.ts        # Service exports
│
├── types/              # Feature type definitions
│   ├── feature.types.ts
│   └── index.ts       # Type exports
│
├── utils/              # Feature-specific utilities
│   └── index.ts       # Utility exports
│
└── index.ts            # Feature public API
```

## Implementation Guidelines

### 1. Creating a New Feature

**Step 1**: Create the feature directory structure

```bash
mkdir -p src/features/my-feature/{components,hooks,services,types}
```

**Step 2**: Implement the feature components

```typescript
// features/my-feature/components/MyFeatureComponent.tsx
export const MyFeatureComponent = () => {
  // Component implementation
};
```

**Step 3**: Create the public API

```typescript
// features/my-feature/index.ts
export * from './components';
export * from './hooks';
export * from './services';
export type * from './types';
```

### 2. Feature Communication

Features should communicate through:

#### Shared State (Preferred)

```typescript
// shared/stores/userStore.ts
export const useUserStore = create<UserState>(set => ({
  user: null,
  setUser: user => set({ user }),
}));
```

#### Event System

```typescript
// shared/events/eventBus.ts
export const eventBus = new EventEmitter();

// Feature A emits
eventBus.emit('user:updated', userData);

// Feature B listens
eventBus.on('user:updated', handleUserUpdate);
```

#### Props Passing (Page Level)

```typescript
// pages/DashboardPage.tsx
export const DashboardPage = () => {
  const { user } = useAuth()

  return (
    <>
      <UserProfile user={user} />
      <UserSettings user={user} />
    </>
  )
}
```

### 3. Dependency Management

**Rule**: Features cannot directly import from other features.

```typescript
// ❌ Forbidden - Direct feature import
import { UserProfile } from '@/features/user-profile'

// ✅ Allowed - Through shared state
const { user } = useUserStore()

// ✅ Allowed - Through props at page level
<UserProfile user={user} />
```

## Best Practices

### 1. Naming Conventions

**Features**: Use kebab-case, descriptive names

- `user-authentication`
- `product-catalog`
- `order-management`

**Components**: Use PascalCase with feature context

- `UserAuthenticationForm`
- `ProductCatalogGrid`
- `OrderManagementTable`

**Files**: Use camelCase for TypeScript, kebab-case for directories

- `userAuthentication.service.ts`
- `useProductCatalog.ts`
- `order-management/`

### 2. Type Definitions

**Feature Types**: Prefix with feature name

```typescript
// features/user-authentication/types/auth.types.ts
export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthCredentials = {
  email: string;
  password: string;
};
```

**Shared Types**: Use generic names

```typescript
// shared/types/common.types.ts
export type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};
```

### 3. API Services

**Feature Services**: Focus on feature-specific endpoints

```typescript
// features/user-authentication/services/auth.service.ts
export const authService = {
  login: (credentials: AuthCredentials): Promise<AuthUser> => {
    return apiClient.post('/auth/login', credentials);
  },

  logout: (): Promise<void> => {
    return apiClient.post('/auth/logout');
  },
};
```

**Shared Services**: Provide common functionality

```typescript
// shared/services/api.service.ts
export const apiClient = {
  get: <T>(url: string): Promise<T> => {
    // Implementation
  },

  post: <T>(url: string, data: unknown): Promise<T> => {
    // Implementation
  },
};
```

### 4. Component Organization

**Smart Components**: Handle logic and state

```typescript
// features/user-profile/components/UserProfileContainer.tsx
export const UserProfileContainer = () => {
  const { user, updateUser } = useUserProfile()

  return (
    <UserProfileView
      user={user}
      onUpdate={updateUser}
    />
  )
}
```

**Presentational Components**: Handle only UI

```typescript
// features/user-profile/components/UserProfileView.tsx
type UserProfileViewProps = {
  user: User;
  onUpdate: (user: User) => void;
};

export const UserProfileView = ({ user, onUpdate }: UserProfileViewProps) => {
  // UI only
};
```

### 5. Testing Strategy

**Feature Tests**: Test complete feature workflows

```typescript
// features/user-authentication/__tests__/auth.test.tsx
describe('Authentication Feature', () => {
  it('should login user successfully', async () => {
    // Test complete login flow
  });
});
```

**Unit Tests**: Test individual components/functions

```typescript
// features/user-authentication/components/__tests__/LoginForm.test.tsx
describe('LoginForm', () => {
  it('should validate email format', () => {
    // Test specific component behavior
  });
});
```

## Common Patterns

### 1. Feature Hooks Pattern

Create custom hooks for feature logic:

```typescript
// features/user-profile/hooks/useUserProfile.ts
export const useUserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await userService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    fetchUser,
    updateUser: userService.updateUser,
  };
};
```

### 2. Service Layer Pattern

Encapsulate API calls in services:

```typescript
// features/user-profile/services/user.service.ts
class UserService {
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/users/${userId}`, userData);
    return response.data;
  }
}

export const userService = new UserService();
```

### 3. Feature Factory Pattern

For similar features with variations:

```typescript
// shared/factories/createCrudFeature.ts
export const createCrudFeature = <T>(entityName: string) => {
  return {
    useEntityList: () => {
      // Generic list logic
    },

    useEntityForm: () => {
      // Generic form logic
    },

    EntityService: class {
      async getAll(): Promise<T[]> {
        return apiClient.get(`/${entityName}`);
      }

      async create(data: Partial<T>): Promise<T> {
        return apiClient.post(`/${entityName}`, data);
      }
    },
  };
};

// features/products/index.ts
export const productFeature = createCrudFeature<Product>('products');
```

## Scaling Considerations

### 1. Feature Size Management

**Keep features focused**: If a feature becomes too large, consider splitting:

```
// Before - Large feature
features/user-management/

// After - Split into focused features
features/user-profile/
features/user-settings/
features/user-roles/
```

### 2. Cross-Feature Dependencies

**Minimize direct dependencies**: Use these patterns instead:

```typescript
// ❌ Direct dependency
import { userService } from '@/features/user-management';

// ✅ Shared service
import { apiClient } from '@/shared/services';

// ✅ Event communication
eventBus.emit('user:updated', user);

// ✅ Shared state
const { user } = useGlobalUserStore();
```

### 3. Team Ownership

**Feature ownership matrix**:

| Feature         | Team          | Primary Contact |
| --------------- | ------------- | --------------- |
| authentication  | Security Team | @security-lead  |
| user-management | Backend Team  | @backend-lead   |
| dashboard       | Frontend Team | @frontend-lead  |

### 4. Performance Optimization

**Code splitting by feature**:

```typescript
// pages/LazyDashboard.tsx
const Dashboard = lazy(() => import('@/features/dashboard'))
const UserProfile = lazy(() => import('@/features/user-profile'))

export const DashboardPage = () => (
  <Suspense fallback={<Loading />}>
    <Dashboard />
    <UserProfile />
  </Suspense>
)
```

## Migration Guide

### Migrating from Traditional Architecture

**Step 1**: Identify business features

- Map existing components to business capabilities
- Group related files together

**Step 2**: Create feature directories

```bash
mkdir -p src/features/{auth,dashboard,profile}
```

**Step 3**: Move files gradually

```bash
# Move auth-related files
mv src/components/Login* src/features/auth/components/
mv src/hooks/useAuth* src/features/auth/hooks/
mv src/services/auth* src/features/auth/services/
```

**Step 4**: Update imports

```typescript
// Before
import { LoginForm } from '@/components/LoginForm';

// After
import { LoginForm } from '@/features/auth';
```

**Step 5**: Create public APIs

```typescript
// features/auth/index.ts
export * from './components';
export * from './hooks';
export * from './services';
```

### Migration Checklist

- [ ] Features identified and mapped
- [ ] Directory structure created
- [ ] Files moved to appropriate features
- [ ] Public APIs created for each feature
- [ ] Imports updated throughout codebase
- [ ] Tests updated and passing
- [ ] Documentation updated

## FAQ

### Q: When should I create a new feature vs adding to existing?

**A**: Create a new feature when:

- It represents a distinct business capability
- It can be developed/maintained by a separate team
- It has minimal dependencies on existing features
- It would make an existing feature too large/complex

### Q: How do I handle shared components between features?

**A**: Options:

1. **Move to shared/components** if truly reusable
2. **Duplicate the component** if features may diverge
3. **Create a compound feature** if they belong together
4. **Use composition** to share behavior, not components

### Q: Can features share state?

**A**: Yes, through:

- **Global state stores** (Zustand, Redux)
- **React Context** at app level
- **Event system** for loose coupling
- **URL state** for sharing navigation state

### Q: How do I handle feature-specific routing?

**A**: Two approaches:

**1. Centralized routing** (recommended for smaller apps):

```typescript
// app/router.tsx
const routes = [
  { path: '/auth/*', component: lazy(() => import('@/features/auth/routes')) },
  { path: '/dashboard/*', component: lazy(() => import('@/features/dashboard/routes')) },
];
```

**2. Feature-based routing** (for larger apps):

```typescript
// features/auth/routes.tsx
export const authRoutes = [
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignupPage },
];
```

### Q: What about shared utilities?

**A**: Place in shared/ based on reusability:

- **shared/utils**: Pure functions, formatters, validators
- **shared/hooks**: Reusable React hooks
- **shared/services**: Common API utilities, storage
- **shared/components**: UI library components

### Q: How do I handle feature flags?

**A**: Implement at the feature level:

```typescript
// features/new-dashboard/index.ts
import { featureFlags } from '@/shared/config';

export const Dashboard = featureFlags.newDashboard
  ? lazy(() => import('./NewDashboard'))
  : lazy(() => import('./LegacyDashboard'));
```

### Q: Should I split features by technical concerns?

**A**: No, split by business concerns. Group all technical aspects of a business feature together:

```
// ❌ Technical split
features/user-ui/
features/user-api/
features/user-state/

// ✅ Business split
features/user-authentication/
features/user-profile/
features/user-settings/
```

---

## Resources and Further Reading

- [Feature-Sliced Design Official Documentation](https://feature-sliced.design/)
- [Domain-Driven Design in Frontend](https://martinfowler.com/articles/micro-frontends.html)
- [React Architecture Best Practices](https://reactjs.org/docs/thinking-in-react.html)
- [Modular Architecture Patterns](https://patterns.dev/posts/module-pattern/)

---

_This document is a living guide that evolves with our architecture. Please contribute improvements and share your experiences._
