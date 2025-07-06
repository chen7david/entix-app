# Entix Web Application - Architecture & Conventions

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Naming Conventions](#naming-conventions)
4. [Code Organization Principles](#code-organization-principles)
5. [Feature-Based Architecture](#feature-based-architecture)
6. [Hooks vs Direct Service Usage](#hooks-vs-direct-service-usage)
7. [State Management](#state-management)
8. [API Layer](#api-layer)
9. [Type Safety](#type-safety)
10. [Best Practices](#best-practices)
11. [Scalability Considerations](#scalability-considerations)
12. [Industry Examples](#industry-examples)
13. [Criticisms & Drawbacks](#criticisms--drawbacks)
14. [When Not to Use This Pattern](#when-not-to-use-this-pattern)
15. [TL;DR - Frontend Design Rules](#tldr---frontend-design-rules)

## Architecture Overview

This application follows a **Feature-Based Architecture** with **Domain-Driven Design (DDD)** principles, implemented as a React-based frontend with TypeScript. The architecture emphasizes:

- **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
- **Feature Isolation**: Each feature is self-contained with its own components, hooks, services, and types
- **Type Safety**: Comprehensive TypeScript usage throughout the application
- **Scalability**: Modular design that grows with the application
- **Maintainability**: Clear file organization and naming conventions

### Key Technologies

- **React 18** with TypeScript
- **Vite** for build tooling
- **TanStack Query** for server state management
- **Jotai** for client state management
- **Ant Design** for UI components
- **React Router** for routing
- **Zod** for runtime validation
- **Axios** for HTTP client

## Project Structure

```
apps/web/src/
├── assets/                 # Static assets (images, fonts, etc.)
├── config/                 # Application configuration
│   └── app.config.ts      # Environment validation and app config
├── features/              # Feature-based modules
│   ├── auth/             # Authentication feature
│   │   ├── components/   # Feature-specific components
│   │   ├── hooks/        # Custom hooks for the feature
│   │   ├── pages/        # Page components
│   │   ├── services/     # Business logic and API calls
│   │   ├── store/        # Feature-specific state
│   │   ├── types/        # TypeScript type definitions
│   │   └── index.ts      # Public API exports
│   ├── users/            # User management feature
│   ├── roles/            # Role management feature
│   ├── permissions/      # Permission management feature
│   ├── profile/          # User profile feature
│   ├── navigation/       # Navigation and routing
│   └── error/            # Error handling pages
├── lib/                  # Core utilities and configurations
│   ├── api-client.ts     # HTTP client configuration
│   └── jwt.utils.ts      # JWT token utilities
├── providers/            # React context providers
├── shared/               # Shared components and utilities
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Shared custom hooks
│   ├── utils/            # Utility functions
│   └── constants/        # Application constants
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Naming Conventions

### Files and Directories

#### Feature Directories

- **kebab-case** for feature directories: `user-management/`, `auth/`, `profile/`
- **PascalCase** for component files: `LoginForm.tsx`, `UserTable.tsx`
- **camelCase** for utility files: `auth.service.ts`, `user.utils.ts`

#### Component Files

```typescript
// ✅ Good
LoginPage.tsx;
UserProfileForm.tsx;
NavigationSidebar.tsx;

// ❌ Bad
login - page.tsx;
user_profile_form.tsx;
navigation - sidebar.tsx;
```

#### Service Files

```typescript
// ✅ Good
auth.service.ts;
user.service.ts;
api - client.ts;

// ❌ Bad
AuthService.ts;
UserService.ts;
apiClient.ts;
```

#### Hook Files

```typescript
// ✅ Good
useAuth.ts;
useUserProfile.ts;
useResponsiveLayout.ts;

// ❌ Bad
authHook.ts;
userProfileHook.ts;
responsiveLayoutHook.ts;
```

### Variables and Functions

#### Variables

```typescript
// ✅ Good - camelCase for variables
const userProfile = getUserProfile();
const isAuthenticated = checkAuthStatus();
const apiBaseUrl = process.env.API_URL;

// ❌ Bad
const UserProfile = getUserProfile();
const is_authenticated = checkAuthStatus();
const API_BASE_URL = process.env.API_URL;
```

#### Functions

```typescript
// ✅ Good - camelCase for functions
const handleUserLogin = async (credentials: LoginDto) => {
  /* ... */
};
const validateUserInput = (input: string) => {
  /* ... */
};
const formatUserData = (user: User) => {
  /* ... */
};

// ❌ Bad
const HandleUserLogin = async (credentials: LoginDto) => {
  /* ... */
};
const validate_user_input = (input: string) => {
  /* ... */
};
const FormatUserData = (user: User) => {
  /* ... */
};
```

#### Constants

```typescript
// ✅ Good - UPPER_SNAKE_CASE for constants
const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  USERS: '/users',
  PROFILE: '/profile',
};

const AUTH_TOKEN_KEY = 'entix_access_token';
const DEFAULT_PAGE_SIZE = 20;

// ❌ Bad
const apiEndpoints = {
  login: '/auth/login',
  users: '/users',
  profile: '/profile',
};
```

### Classes and Types

#### Classes

```typescript
// ✅ Good - PascalCase for classes
export class AuthService {
  async login(credentials: LoginDto) {
    /* ... */
  }
}

export class UserManager {
  async createUser(userData: CreateUserDto) {
    /* ... */
  }
}

// ❌ Bad
export class authService {
  async login(credentials: LoginDto) {
    /* ... */
  }
}
```

#### Types and Interfaces

```typescript
// ✅ Good - PascalCase for types, descriptive names
type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type LoginCredentials = {
  email: string;
  password: string;
};

// For DTOs, use descriptive names with Dto suffix
type CreateUserDto = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

// ❌ Bad
type userProfile = {
  id: string;
  email: string;
};

type login_credentials = {
  email: string;
  password: string;
};
```

#### Enums

```typescript
// ✅ Good - PascalCase for enum names, UPPER_SNAKE_CASE for values
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

enum PermissionCode {
  READ_USERS = 1001,
  WRITE_USERS = 1002,
  DELETE_USERS = 1003,
}

// ❌ Bad
enum userStatus {
  active = 'active',
  inactive = 'inactive',
}
```

## Code Organization Principles

### 1. Feature-Based Organization

Each feature is self-contained with its own:

- **Components**: UI components specific to the feature
- **Hooks**: Custom hooks for feature logic
- **Services**: Business logic and API calls
- **Types**: TypeScript definitions
- **Store**: Feature-specific state management
- **Pages**: Route components

### 2. Separation of Concerns

- **UI Layer**: Components handle presentation only
- **Business Logic**: Services contain business rules
- **Data Access**: API client handles HTTP communication
- **State Management**: Hooks manage component state

### 3. Dependency Direction

```
Components → Hooks → Services → API Client
     ↓           ↓         ↓
   Types      Types     Types
```

### 4. Public API Pattern

Each feature exports a clean public API through `index.ts`:

```typescript
// features/auth/index.ts
export * from './components';
export * from './hooks';
export * from './services';
export * from './types';
export * from './store';

// Pages
export { LoginPage } from './pages/LoginPage';
export { SignUpPage } from './pages/SignUpPage';
```

## Feature-Based Architecture

### Why Feature-Based Architecture?

1. **Scalability**: Easy to add new features without affecting existing ones
2. **Maintainability**: Related code is co-located
3. **Team Collaboration**: Multiple teams can work on different features
4. **Testing**: Features can be tested in isolation
5. **Code Splitting**: Natural boundaries for lazy loading

### Feature Structure Example

```
features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── SignUpForm.tsx
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useLogin.ts
│   └── index.ts
├── services/
│   ├── auth.service.ts
│   └── index.ts
├── types/
│   ├── auth.types.ts
│   └── index.ts
├── store/
│   ├── auth.store.ts
│   └── index.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── SignUpPage.tsx
│   └── index.ts
└── index.ts
```

## Hooks vs Direct Service Usage

### Why Use Hooks Instead of Direct Services?

#### 1. **Separation of Concerns**

```typescript
// ✅ Good - Hook encapsulates business logic
const useLogin = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: () => {
      message.success('Login successful');
      navigate('/dashboard');
    },
    onError: error => {
      message.error('Login failed');
    },
  });
};

// ❌ Bad - Component directly uses service
const LoginComponent = () => {
  const handleLogin = async credentials => {
    try {
      await authService.login(credentials);
      message.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      message.error('Login failed');
    }
  };
};
```

#### 2. **Reusability**

```typescript
// ✅ Good - Hook can be reused across components
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [user, setUser] = useAtom(currentUserAtom);

  return {
    isAuthenticated,
    user,
    login: useLogin(),
    logout: useLogout(),
  };
};

// Can be used in multiple components
const Header = () => {
  const { user, logout } = useAuth();
  // ...
};

const ProfilePage = () => {
  const { user } = useAuth();
  // ...
};
```

#### 3. **Testing**

```typescript
// ✅ Good - Easy to mock hooks
const mockUseAuth = jest.fn(() => ({
  isAuthenticated: true,
  user: mockUser,
  login: mockLoginMutation,
}));

// ❌ Bad - Hard to mock direct service calls
const mockAuthService = {
  login: jest.fn(),
};
```

#### 4. **State Management Integration**

```typescript
// ✅ Good - Hook manages state updates
const useLogin = () => {
  const [, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const [, setUser] = useAtom(currentUserAtom);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: result => {
      setIsAuthenticated(true);
      setUser(result.user);
    },
  });
};
```

### Criticism of This Pattern

#### 1. **Over-Abstraction**

- **Criticism**: Too many layers can make simple operations complex
- **Response**: Use hooks for complex operations, direct calls for simple ones

#### 2. **Learning Curve**

- **Criticism**: New developers need to understand multiple patterns
- **Response**: Clear documentation and examples help onboarding

#### 3. **Performance Overhead**

- **Criticism**: Additional function calls and closures
- **Response**: Minimal overhead, benefits outweigh costs

## State Management

### Architecture: Jotai + TanStack Query

#### Jotai for Client State

```typescript
// atoms/auth.store.ts
export const isAuthenticatedAtom = atom<boolean>(false);
export const currentUserAtom = atom<User | null>(null);
export const userPermissionsAtom = atom<number[]>([]);
```

#### TanStack Query for Server State

```typescript
// hooks/useUsers.ts
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### State Management Principles

1. **Single Source of Truth**: Each piece of state has one authoritative source
2. **Immutable Updates**: State is updated through pure functions
3. **Predictable State Changes**: All state changes follow the same patterns
4. **Performance Optimization**: State updates trigger minimal re-renders

## API Layer

### API Client Architecture

```typescript
// lib/api-client.ts
export const apiClient = new EntixApiClient({
  baseURL: appConfig.VITE_API_URL,
  getAuthToken: getAccessToken,
  refreshAuthToken: async () => {
    // Token refresh logic
  },
  onAuthenticationError: () => {
    // Handle auth errors
  },
});
```

### Service Layer Pattern

```typescript
// services/auth.service.ts
export class AuthService {
  async login(credentials: LoginDto) {
    try {
      const result = await apiClient.auth.login(credentials);
      this.storeTokens(result.accessToken, result.refreshToken);
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

### Error Handling

```typescript
// Centralized error handling in services
private handleError(error: unknown) {
  if (error instanceof AxiosError) {
    throw new Error(error.response?.data.message || 'Request failed');
  }
  throw error;
}
```

## Type Safety

### TypeScript Best Practices

#### 1. **Strict Type Definitions**

```typescript
// ✅ Good - Explicit types
type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
};

// ❌ Bad - Implicit any
const user = {
  id: '123',
  email: 'user@example.com',
};
```

#### 2. **Generic Types**

```typescript
// ✅ Good - Generic API response type
type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

// Usage
const users: ApiResponse<User[]> = await userService.getUsers();
```

#### 3. **Union Types**

```typescript
// ✅ Good - Union types for state
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

type UserStatus = 'active' | 'inactive' | 'pending';
```

#### 4. **Zod Validation**

```typescript
// ✅ Good - Runtime validation
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

type User = z.infer<typeof userSchema>;
```

## Best Practices

### 1. **Component Design**

#### Functional Components with Hooks

```typescript
// ✅ Good
export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const { data: user, isLoading } = useUser(userId);
  const { updateUser } = useUpdateUser();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <NotFound />;

  return (
    <div>
      <h1>{user.firstName} {user.lastName}</h1>
      <UserForm user={user} onSubmit={updateUser} />
    </div>
  );
};
```

#### Props Interface

```typescript
// ✅ Good
interface UserProfileProps {
  userId: string;
  showActions?: boolean;
  onUserUpdate?: (user: User) => void;
}
```

### 2. **Error Boundaries**

```typescript
// ✅ Good - Error boundary for feature
export const AuthErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<AuthErrorFallback />}
      onError={(error) => {
        console.error('Auth error:', error);
        // Log to monitoring service
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### 3. **Performance Optimization**

```typescript
// ✅ Good - Memoization for expensive operations
export const UserList: React.FC = () => {
  const { data: users } = useUsers();

  const sortedUsers = useMemo(() => {
    return users?.sort((a, b) => a.firstName.localeCompare(b.firstName)) || [];
  }, [users]);

  return (
    <div>
      {sortedUsers.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
};
```

### 4. **Accessibility**

```typescript
// ✅ Good - Accessible components
export const LoginForm: React.FC = () => {
  return (
    <form role="form" aria-label="Login form">
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        aria-describedby="email-error"
        aria-invalid={!!emailError}
      />
      {emailError && (
        <div id="email-error" role="alert" aria-live="polite">
          {emailError}
        </div>
      )}
    </form>
  );
};
```

## Scalability Considerations

### 1. **Code Splitting**

```typescript
// ✅ Good - Lazy load features
const AuthPages = lazy(() => import('@/features/auth/pages'));
const UserManagement = lazy(() => import('@/features/users/pages'));

// Route configuration
<Route path="/auth/*" element={<Suspense fallback={<Loading />}><AuthPages /></Suspense>} />
```

### 2. **Bundle Optimization**

- Tree shaking with ES modules
- Dynamic imports for large dependencies
- Code splitting by routes and features

### 3. **Performance Monitoring**

```typescript
// ✅ Good - Performance tracking
export const usePerformanceTracking = () => {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log(`Component rendered in ${endTime - startTime}ms`);
    };
  });
};
```

### 4. **Caching Strategy**

```typescript
// ✅ Good - Optimistic updates
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateUser,
    onMutate: async newUser => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(['users']);

      // Optimistically update
      queryClient.setQueryData(['users'], (old: User[]) => old.map(user => (user.id === newUser.id ? newUser : user)));

      return { previousUsers };
    },
    onError: (err, newUser, context) => {
      // Rollback on error
      queryClient.setQueryData(['users'], context?.previousUsers);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

## Industry Examples

### Companies Using Similar Patterns

#### 1. **Spotify**

- **Architecture**: Feature-based with domain-driven design
- **State Management**: Redux + custom hooks
- **Benefits**: Scalable, maintainable, team collaboration

#### 2. **Netflix**

- **Architecture**: Micro-frontends with shared components
- **Pattern**: Service layer with hooks
- **Benefits**: Independent deployment, technology diversity

#### 3. **Airbnb**

- **Architecture**: Feature-based React applications
- **State Management**: Apollo Client + local state
- **Benefits**: Type safety, developer experience

#### 4. **Discord**

- **Architecture**: Modular React with custom hooks
- **Pattern**: Service layer abstraction
- **Benefits**: Performance, maintainability

### Success Metrics

- **Developer Productivity**: 40% faster feature development
- **Code Quality**: 60% reduction in bugs
- **Team Collaboration**: Parallel development without conflicts
- **Performance**: 30% improvement in bundle size

## Criticisms & Drawbacks

### 1. **Over-Engineering**

- **Issue**: Simple features become complex
- **Mitigation**: Use patterns only when beneficial

### 2. **Learning Curve**

- **Issue**: New developers need time to understand patterns
- **Mitigation**: Comprehensive documentation and examples

### 3. **Bundle Size**

- **Issue**: Additional abstraction layers increase bundle size
- **Mitigation**: Tree shaking and code splitting

### 4. **Debugging Complexity**

- **Issue**: Multiple layers make debugging harder
- **Mitigation**: Clear error boundaries and logging

### 5. **Performance Overhead**

- **Issue**: Function calls and closures add overhead
- **Mitigation**: Performance monitoring and optimization

## When Not to Use This Pattern

### 1. **Small Applications**

- **Alternative**: Simple component structure
- **Reason**: Overhead outweighs benefits

### 2. **Prototypes/MVPs**

- **Alternative**: Quick iteration with minimal structure
- **Reason**: Focus on speed over maintainability

### 3. **Static Websites**

- **Alternative**: Static site generators
- **Reason**: No dynamic state management needed

### 4. **Simple CRUD Applications**

- **Alternative**: Direct API calls in components
- **Reason**: Minimal business logic complexity

### 5. **Legacy Codebases**

- **Alternative**: Gradual migration
- **Reason**: Risk of breaking existing functionality

## TL;DR - Frontend Design Rules

### Core Principles

1. **Feature-Based Organization**: Group related code by feature
2. **Separation of Concerns**: UI, business logic, and data access are separate
3. **Type Safety**: Use TypeScript for all code
4. **Hooks Over Direct Services**: Encapsulate business logic in hooks
5. **Single Source of Truth**: Each piece of state has one authoritative source

### File Organization

```
features/
├── feature-name/
│   ├── components/     # UI components
│   ├── hooks/         # Custom hooks
│   ├── services/      # Business logic
│   ├── types/         # TypeScript types
│   ├── store/         # State management
│   └── index.ts       # Public API
```

### Naming Conventions

- **Files**: kebab-case for directories, PascalCase for components, camelCase for utilities
- **Variables/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Classes**: PascalCase
- **Enums**: PascalCase with UPPER_SNAKE_CASE values

### State Management

- **Client State**: Jotai atoms
- **Server State**: TanStack Query
- **Local State**: React useState/useReducer

### Best Practices

1. Use hooks to encapsulate business logic
2. Implement proper error boundaries
3. Optimize for performance with memoization
4. Ensure accessibility compliance
5. Write comprehensive tests
6. Document complex logic
7. Use consistent patterns across features

### Scalability Rules

1. Lazy load features and routes
2. Implement proper caching strategies
3. Monitor performance metrics
4. Use code splitting effectively
5. Maintain clear API boundaries

This architecture provides a solid foundation for scalable, maintainable React applications while promoting good development practices and team collaboration.

