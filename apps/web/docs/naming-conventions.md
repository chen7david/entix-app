# Naming Conventions - Web Project

This document defines the naming conventions used throughout the web project to ensure consistency and maintainability.

## Table of Contents

1. [File Naming](#file-naming)
2. [Variable and Function Naming](#variable-and-function-naming)
3. [Component Naming](#component-naming)
4. [Hook Naming](#hook-naming)
5. [Type and Interface Naming](#type-and-interface-naming)
6. [Service Naming](#service-naming)
7. [Directory Structure](#directory-structure)
8. [Import/Export Conventions](#importexport-conventions)
9. [Constants Naming](#constants-naming)
10. [CSS/SCSS Naming](#cssscss-naming)
11. [API and Database Naming](#api-and-database-naming)
12. [Migration Guidelines](#migration-guidelines)

## File Naming

### General Rules

- Use **camelCase** for all files
- Use descriptive names that clearly indicate the file's purpose
- Include the file type/extension in the name when multiple similar files exist

### Specific File Types

#### React Components

```typescript
// ✅ Correct
UserProfile.tsx;
CreateUserForm.tsx;
UsersTable.tsx;
LoadingSpinner.tsx;

// ❌ Incorrect
user - profile.tsx;
create - user - form.tsx;
users_table.tsx;
loading - spinner.tsx;
```

#### Hooks

```typescript
// ✅ Correct
useUsers.ts;
useAuth.ts;
usePermissions.ts;
useProfile.ts;

// ❌ Incorrect
use - users.ts;
use_auth.ts;
usePermissionsHook.ts;
```

#### Services

```typescript
// ✅ Correct
usersService.ts;
authService.ts;
apiClient.ts;
baseApiService.ts;

// ❌ Incorrect
users - service.ts;
auth_service.ts;
api - client.ts;
```

#### Types/Interfaces

```typescript
// ✅ Correct
users.types.ts;
auth.types.ts;
common.types.ts;
api.types.ts;

// ❌ Incorrect
user - types.ts;
auth_types.ts;
types.ts;
```

#### Utilities

```typescript
// ✅ Correct
dateUtils.ts;
validationUtils.ts;
stringUtils.ts;
formatUtils.ts;

// ❌ Incorrect
date - utils.ts;
validation_utils.ts;
utils.ts;
```

## Variable and Function Naming

### Variables

```typescript
// ✅ Correct
const userName = 'john';
const isUserActive = true;
const userList = [];
const selectedUserId = '123';

// ❌ Incorrect
const user_name = 'john';
const is_user_active = true;
const userlist = [];
const selected_user_id = '123';
```

### Functions

```typescript
// ✅ Correct
const handleUserCreate = () => {};
const fetchUserData = () => {};
const validateUserInput = () => {};
const formatUserName = () => {};

// ❌ Incorrect
const handle_user_create = () => {};
const fetch_user_data = () => {};
const validateUserInput = () => {};
const format_user_name = () => {};
```

### Boolean Variables

```typescript
// ✅ Correct
const isLoading = true;
const hasPermission = false;
const isModalVisible = true;
const canEdit = true;

// ❌ Incorrect
const loading = true;
const permission = false;
const modalVisible = true;
const edit = true;
```

## Component Naming

### React Components

```typescript
// ✅ Correct
export const UserProfile: React.FC<UserProfileProps> = () => {};
export const CreateUserForm: React.FC<CreateUserFormProps> = () => {};
export const UsersTable: React.FC<UsersTableProps> = () => {};

// ❌ Incorrect
export const userProfile: React.FC<UserProfileProps> = () => {};
export const createUserForm: React.FC<CreateUserFormProps> = () => {};
export const users_table: React.FC<UsersTableProps> = () => {};
```

### Component Props Types

```typescript
// ✅ Correct
type UserProfileProps = {
  userId: string;
  onUpdate: (data: UserData) => void;
  isLoading?: boolean;
};

// ❌ Incorrect
type userProfileProps = {
  user_id: string;
  on_update: (data: UserData) => void;
  loading?: boolean;
};
```

## Hook Naming

### Custom Hooks

```typescript
// ✅ Correct
export const useUsers = () => {};
export const useAuth = () => {};
export const usePermissions = () => {};
export const useProfile = () => {};

// ❌ Incorrect
export const use_users = () => {};
export const useAuthHook = () => {};
export const use_permissions = () => {};
```

### Hook Return Types

```typescript
// ✅ Correct
type UseUsersReturn = {
  users: User[];
  isLoading: boolean;
  createUser: (data: CreateUserParamsDto) => Promise<void>;
  updateUser: (id: string, data: UpdateUserParamsDto) => Promise<void>;
};

// ❌ Incorrect
type useUsersReturn = {
  users: User[];
  loading: boolean;
  create_user: (data: CreateUserParamsDto) => Promise<void>;
  update_user: (id: string, data: UpdateUserParamsDto) => Promise<void>;
};
```

## Type and Interface Naming

### Interfaces

```typescript
// ✅ Correct
interface User {
  id: string;
  username: string;
  email: string;
}

interface CreateUserParamsDto {
  username: string;
  email: string;
  password: string;
}

// ❌ Incorrect
interface user {
  id: string;
  username: string;
  email: string;
}

interface create_user_params_dto {
  username: string;
  email: string;
  password: string;
}
```

### Type Aliases

```typescript
// ✅ Correct
type UserStatus = 'active' | 'inactive' | 'pending';
type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

// ❌ Incorrect
type user_status = 'active' | 'inactive' | 'pending';
type api_response<T> = {
  data: T;
  message: string;
  success: boolean;
};
```

## Service Naming

### Service Classes

```typescript
// ✅ Correct
class UsersService {
  async getUsers(): Promise<User[]> {}
  async createUser(data: CreateUserParamsDto): Promise<User> {}
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {}
  async logout(): Promise<void> {}
}

// ❌ Incorrect
class users_service {
  async get_users(): Promise<User[]> {}
  async create_user(data: CreateUserParamsDto): Promise<User> {}
}
```

### Service Instances

```typescript
// ✅ Correct
export const usersService = new UsersService();
export const authService = new AuthService();
export const apiClient = new ApiClient();

// ❌ Incorrect
export const users_service = new UsersService();
export const auth_service = new AuthService();
export const api_client = new ApiClient();
```

## Directory Structure

### Feature-Based Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── SignUpPage.tsx
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── users/
│       ├── components/
│       │   ├── UsersTable.tsx
│       │   ├── CreateUserForm.tsx
│       │   └── index.ts
│       ├── hooks/
│       │   ├── useUsers.ts
│       │   └── index.ts
│       └── ...
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── utils/
└── lib/
    ├── api-client.ts
    └── constants.ts
```

## Import/Export Conventions

### Named Exports

```typescript
// ✅ Correct
export const useUsers = () => {};
export const UsersTable: React.FC = () => {};
export type User = {};

// ❌ Incorrect
export const use_users = () => {};
export const users_table: React.FC = () => {};
export type user = {};
```

### Default Exports

```typescript
// ✅ Correct
export default function UsersPage() {}
export default UsersTable;

// ❌ Incorrect
export default function users_page() {}
export default users_table;
```

### Import Statements

```typescript
// ✅ Correct
import { useUsers } from '@/features/users/hooks/useUsers';
import { UsersTable } from '@/features/users/components/UsersTable';
import type { User } from '@/features/users/types/users.types';

// ❌ Incorrect
import { use_users } from '@/features/users/hooks/use-users';
import { users_table } from '@/features/users/components/users-table';
import type { user } from '@/features/users/types/user-types';
```

## Constants Naming

### General Constants

```typescript
// ✅ Correct
export const API_BASE_URL = 'https://api.example.com';
export const DEFAULT_PAGE_SIZE = 10;
export const USER_STATUSES = ['active', 'inactive', 'pending'] as const;

// ❌ Incorrect
export const api_base_url = 'https://api.example.com';
export const default_page_size = 10;
export const user_statuses = ['active', 'inactive', 'pending'] as const;
```

### Enum Values

```typescript
// ✅ Correct
export enum PermissionCode {
  GET_USERS = 1,
  CREATE_USER = 2,
  UPDATE_USER = 3,
  DELETE_USER = 4,
}

// ❌ Incorrect
export enum permission_code {
  get_users = 1,
  create_user = 2,
  update_user = 3,
  delete_user = 4,
}
```

## CSS/SCSS Naming

### CSS Classes

```typescript
// ✅ Correct
className = 'user-profile';
className = 'create-user-form';
className = 'users-table';
className = 'loading-spinner';

// ❌ Incorrect
className = 'userProfile';
className = 'createUserForm';
className = 'users_table';
className = 'loadingSpinner';
```

### CSS Variables

```typescript
// ✅ Correct
--primary-color: #1890ff;
--border-radius: 6px;
--font-size-large: 16px;

// ❌ Incorrect
--primaryColor: #1890ff;
--borderRadius: 6px;
--fontSizeLarge: 16px;
```

## API and Database Naming

### API Endpoints

```typescript
// ✅ Correct
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id

// ❌ Incorrect
GET /api/user
POST /api/user
PUT /api/user/:id
DELETE /api/user/:id
```

### Database Tables

```typescript
// ✅ Correct
users;
roles;
permissions;
user_roles;
role_permissions;

// ❌ Incorrect
user;
role;
permission;
userRole;
rolePermission;
```

## Migration Guidelines

### When Refactoring Existing Code

1. **Identify Inconsistent Files**

   - Look for snake_case files (e.g., `use-users.ts`)
   - Find camelCase inconsistencies
   - Check for mixed naming patterns

2. **Create Migration Plan**

   - List all files to be renamed
   - Update all import statements
   - Update all references in code

3. **Execute Migration**

   - Rename files one at a time
   - Update imports immediately
   - Test after each change
   - Commit changes incrementally

4. **Update Documentation**
   - Update README files
   - Update import examples
   - Update component documentation

### Example Migration

```bash
# Before
src/features/users/hooks/use-users.ts
src/features/users/components/users-table.tsx

# After
src/features/users/hooks/useUsers.ts
src/features/users/components/UsersTable.tsx
```

```typescript
// Before
import { use_users } from './use-users';
import { users_table } from './users-table';

// After
import { useUsers } from './useUsers';
import { UsersTable } from './UsersTable';
```

## Summary

- **Files:** Use camelCase (`useUsers.ts`, `UsersTable.tsx`)
- **Variables/Functions:** Use camelCase (`userName`, `handleUserCreate`)
- **Components:** Use PascalCase (`UserProfile`, `CreateUserForm`)
- **Hooks:** Use camelCase with `use` prefix (`useUsers`, `useAuth`)
- **Types/Interfaces:** Use PascalCase (`User`, `CreateUserParamsDto`)
- **Services:** Use camelCase (`usersService`, `authService`)
- **Constants:** Use UPPER_SNAKE_CASE (`API_BASE_URL`, `DEFAULT_PAGE_SIZE`)
- **CSS Classes:** Use kebab-case (`user-profile`, `create-user-form`)

This ensures consistency across the entire web project and makes the codebase more maintainable and professional.
