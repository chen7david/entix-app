# Service Layer Pattern - Best Practices

## Overview

This document outlines our service layer architecture pattern and explains why we should **never call APIs directly in components**. Instead, we use a layered approach: **Services → Hooks → Components**.

## Architecture Pattern

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Components  │───▶│    Hooks    │───▶│   Services  │
│   (UI)      │    │ (Business)  │    │   (API)     │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Why Use Service Layer Pattern?

### 1. **Separation of Concerns**

- **Components**: Focus purely on UI rendering and user interactions
- **Hooks**: Handle business logic, state management, and data transformation
- **Services**: Handle API communication and data formatting

### 2. **Testability**

- Services can be easily mocked for unit tests
- Hooks can be tested independently of UI
- Components can be tested with mocked hooks

### 3. **Reusability**

- Services can be reused across different hooks
- Hooks can be reused across different components
- Business logic is centralized and consistent

### 4. **Error Handling**

- Centralized error handling in services
- Consistent error messages and user feedback
- Better debugging and logging

### 5. **Type Safety**

- Full TypeScript support with proper type inference
- Compile-time error checking
- Better IDE support and autocomplete

### 6. **Maintainability**

- Changes to API endpoints only require service updates
- Business logic changes are isolated to hooks
- UI changes don't affect data layer

## ❌ What NOT to Do

```typescript
// ❌ BAD: Direct API calls in components
import { apiClient } from '@lib/api-client';

export const UserProfile = () => {
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const data = await apiClient.users.getUser(id); // Direct API call
      setUser(data);
    } catch (error) {
      // Error handling scattered across components
      console.error(error);
    }
  };

  return <div>{user?.name}</div>;
};
```

## ✅ What TO Do

```typescript
// ✅ GOOD: Service layer pattern
// 1. Service (handles API communication)
export class UserService {
  async getUser(id: string) {
    return apiClient.users.getUser(id);
  }
}

// 2. Hook (handles business logic)
export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUser(id),
  });
};

// 3. Component (handles UI only)
export const UserProfile = () => {
  const { data: user, isLoading, error } = useUser(id);

  if (isLoading) return <Spin />;
  if (error) return <ErrorDisplay error={error} />;

  return <div>{user?.name}</div>;
};
```

## Service Layer Benefits

### 1. **Centralized API Logic**

```typescript
// All API calls in one place
export class AuthService {
  async login(credentials: LoginDto) {
    return apiClient.auth.login(credentials);
  }

  async logout() {
    return apiClient.auth.logout();
  }

  async verifySession() {
    return apiClient.auth.verifySession();
  }
}
```

### 2. **Consistent Error Handling**

```typescript
// Centralized error handling
export class UserService {
  async getUser(id: string) {
    try {
      return await apiClient.users.getUser(id);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Failed to load user data');
    }
  }
}
```

### 3. **Data Transformation**

```typescript
// Transform API data to match frontend needs
export class UserService {
  async getUsers() {
    const users = await apiClient.users.getUsers();
    return users.map(user => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
      isActive: !user.disabledAt,
    }));
  }
}
```

## Hook Layer Benefits

### 1. **State Management**

```typescript
export const useUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchTerm, selectedStatus],
    queryFn: () => userService.getUsers(),
  });

  const filteredUsers = useMemo(() => {
    return (
      users?.filter(
        user => user.username.includes(searchTerm) && (selectedStatus === 'all' || user.status === selectedStatus),
      ) || []
    );
  }, [users, searchTerm, selectedStatus]);

  return {
    users: filteredUsers,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
  };
};
```

### 2. **Business Logic**

```typescript
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserDto) => userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('User created successfully');
    },
    onError: error => {
      message.error('Failed to create user');
    },
  });
};
```

### 3. **Permission Integration**

```typescript
export const useUsers = () => {
  const { hasPermission } = usePermissions();

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: hasPermission(PermissionCode.GET_USERS),
  });

  return { users };
};
```

## Component Layer Benefits

### 1. **Pure UI Logic**

```typescript
export const UsersPage = () => {
  const {
    users,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
  } = useUsers();

  const { mutate: createUser, isPending } = useCreateUser();

  return (
    <div>
      <UsersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />
      <UsersTable users={users} loading={isLoading} />
      <CreateUserForm onSubmit={createUser} loading={isPending} />
    </div>
  );
};
```

### 2. **No API Knowledge**

Components don't need to know about:

- API endpoints
- Request/response formats
- Error handling details
- Authentication tokens
- API client configuration

## Best Practices

### 1. **Service Naming**

```typescript
// ✅ Good
export class UserService {}
export class AuthService {}
export class RoleService {}

// ❌ Bad
export class UserAPI {}
export class AuthClient {}
```

### 2. **Hook Naming**

```typescript
// ✅ Good
export const useUsers = () => {};
export const useCreateUser = () => {};
export const useUserRoles = () => {};

// ❌ Bad
export const useUserData = () => {};
export const useUserMutation = () => {};
```

### 3. **Error Handling**

```typescript
// ✅ Good: Centralized in services
export class UserService {
  async getUser(id: string) {
    try {
      return await apiClient.users.getUser(id);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Failed to load user data');
    }
  }
}

// ✅ Good: User feedback in hooks
export const useUser = (id: string) => {
  const { message } = App.useApp();

  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUser(id),
    onError: () => {
      message.error('Failed to load user data');
    },
  });
};
```

### 4. **Type Safety**

```typescript
// ✅ Good: Proper typing
export class UserService {
  async getUser(id: string): Promise<User> {
    return apiClient.users.getUser(id);
  }
}

export const useUser = (id: string) => {
  return useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => userService.getUser(id),
  });
};
```

## Migration Guide

### From Direct API Calls to Service Layer

1. **Create Service**

```typescript
// Create service file
export class UserService {
  async getUsers() {
    return apiClient.users.getUsers();
  }
}
```

2. **Create Hook**

```typescript
// Create hook file
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });
};
```

3. **Update Component**

```typescript
// Update component to use hook
export const UsersPage = () => {
  const { data: users, isLoading } = useUsers();
  return <UsersTable users={users} loading={isLoading} />;
};
```

## Common Anti-Patterns to Avoid

### 1. **Direct API Calls in Components**

```typescript
// ❌ Don't do this
const handleSubmit = async data => {
  await apiClient.auth.login(data);
};
```

### 2. **Business Logic in Components**

```typescript
// ❌ Don't do this
const filteredUsers = users.filter(user => user.username.includes(searchTerm));
```

### 3. **Error Handling in Components**

```typescript
// ❌ Don't do this
try {
  const data = await apiClient.users.getUsers();
} catch (error) {
  console.error(error);
  message.error('Failed to load users');
}
```

## Conclusion

The service layer pattern provides:

- **Better code organization**
- **Improved testability**
- **Enhanced maintainability**
- **Consistent error handling**
- **Type safety**
- **Reusable business logic**

Always follow the pattern: **Services → Hooks → Components** for a clean, maintainable, and scalable codebase.
