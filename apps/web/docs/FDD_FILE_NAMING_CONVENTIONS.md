# Feature-Driven Development (FDD) File Naming Conventions

## Overview

This document outlines the standardized file naming conventions and purposes for the Feature-Driven Development (FDD) architecture used in the Entix application.

## Directory Structure

```
src/features/
├── {feature-name}/
│   ├── components/          # UI components specific to this feature
│   ├── hooks/              # Custom hooks for business logic
│   ├── pages/              # Page components (route-level)
│   ├── services/           # API service layer
│   ├── store/              # State management (Jotai atoms)
│   ├── types/              # TypeScript type definitions
│   └── index.ts            # Public API exports
```

## File Naming Conventions

### 1. Components (`/components/`)

**Purpose**: Reusable UI components specific to the feature.

**Naming Pattern**: `kebab-case.tsx`

**Examples**:

- `login-form.tsx` - Form component for login functionality
- `users-table.tsx` - Table component for displaying users
- `user-detail-card.tsx` - Card component for user details
- `create-user-modal.tsx` - Modal component for creating users

**Guidelines**:

- Use descriptive, action-oriented names
- Include the component type in the name (form, table, modal, card, etc.)
- Keep names concise but clear

### 2. Hooks (`/hooks/`)

**Purpose**: Custom React hooks that encapsulate business logic and state management.

**Naming Pattern**: `use-{feature}-{action}.ts` or `use{Feature}{Action}.ts`

**Examples**:

- `use-auth.ts` - Authentication-related hooks
- `use-users.ts` - Users management hooks
- `use-permissions.ts` - Permission checking hooks
- `use-navigation.ts` - Navigation logic hooks

**Guidelines**:

- Always start with `use` (React hook convention)
- Use camelCase for the rest of the name
- Be specific about the functionality

### 3. Pages (`/pages/`)

**Purpose**: Route-level components that compose other components.

**Naming Pattern**: `{PageName}Page.tsx`

**Examples**:

- `LoginPage.tsx` - Login page component
- `UsersPage.tsx` - Users management page
- `ProfilePage.tsx` - User profile page
- `DashboardPage.tsx` - Dashboard page

**Guidelines**:

- Always end with `Page`
- Use PascalCase
- Keep pages lightweight - they should compose components, not contain business logic

### 4. Services (`/services/`)

**Purpose**: API service layer for data operations.

**Naming Pattern**: `{feature}.service.ts`

**Examples**:

- `auth.service.ts` - Authentication API services
- `users.service.ts` - Users API services
- `roles.service.ts` - Roles API services

**Guidelines**:

- End with `.service.ts`
- Use kebab-case
- Focus on API communication

### 5. Store (`/store/`)

**Purpose**: State management using Jotai atoms.

**Naming Pattern**: `{feature}.store.ts`

**Examples**:

- `auth.store.ts` - Authentication state atoms
- `users.store.ts` - Users state atoms
- `app.store.ts` - Global application state

**Guidelines**:

- End with `.store.ts`
- Use kebab-case
- Export atoms and selectors

### 6. Types (`/types/`)

**Purpose**: TypeScript type definitions specific to the feature.

**Naming Pattern**: `{feature}.types.ts`

**Examples**:

- `auth.types.ts` - Authentication-related types
- `users.types.ts` - User-related types
- `navigation.types.ts` - Navigation-related types

**Guidelines**:

- End with `.types.ts`
- Use kebab-case
- Export interfaces, types, and enums

## Shared Layer Conventions

### Shared Components (`/shared/components/`)

**Purpose**: Reusable components across multiple features.

**Structure**:

```
shared/components/
├── ui/                     # Basic UI components
│   ├── button.tsx
│   ├── loading-spinner.tsx
│   └── index.ts
├── layout/                 # Layout components
│   ├── auth-layout.tsx
│   ├── dashboard-layout.tsx
│   └── index.ts
└── index.ts               # Main export file
```

**Naming Pattern**: `kebab-case.tsx`

### Shared Utils (`/shared/utils/`)

**Purpose**: Utility functions used across features.

**Naming Pattern**: `{category}.utils.ts` or `{specific-function}.helper.ts`

**Examples**:

- `validation.utils.ts` - Validation utility functions
- `date.utils.ts` - Date manipulation utilities
- `string.utils.ts` - String manipulation utilities
- `config.helper.ts` - Configuration helper functions

## Index Files

### Feature Index (`/features/{feature}/index.ts`)

**Purpose**: Public API for the feature.

**Structure**:

```typescript
// Components
export * from './components';

// Hooks
export * from './hooks';

// Types
export * from './types';

// Pages
export { LoginPage } from './pages/LoginPage';
export { SignUpPage } from './pages/SignUpPage';
```

### Component Index (`/components/index.ts`)

**Purpose**: Export all components from the feature.

**Structure**:

```typescript
export * from './login-form';
export * from './signup-form';
export * from './users-table';
```

## Import Conventions

### Feature Imports

```typescript
// Import from feature public API
import { LoginPage, useAuth } from '@/features/auth';
import { UsersTable } from '@/features/users';
```

### Shared Imports

```typescript
// Import from shared components
import { Button, LoadingSpinner } from '@/shared/components/ui';
import { ResponsiveContainer } from '@/shared/components/layout';
```

### Utility Imports

```typescript
// Import utilities
import { formatDate } from '@/shared/utils/date.utils';
import { validateEmail } from '@/shared/utils/validation.utils';
```

## Best Practices

### 1. Separation of Concerns

- **Pages**: Lightweight containers that compose components
- **Components**: Reusable UI pieces with minimal business logic
- **Hooks**: Business logic and state management
- **Services**: API communication
- **Types**: Type definitions and interfaces

### 2. File Size Guidelines

- **Pages**: < 50 lines (should be lightweight)
- **Components**: < 200 lines (break down if larger)
- **Hooks**: < 150 lines (extract if complex)
- **Services**: < 100 lines (focus on API calls)

### 3. Naming Consistency

- Use consistent naming patterns across all features
- Follow established conventions strictly
- Document any deviations with clear reasoning

### 4. Export Strategy

- Export through index files for clean imports
- Use named exports for better tree-shaking
- Avoid default exports for components

## Examples

### Good Structure

```
features/auth/
├── components/
│   ├── login-form.tsx
│   ├── signup-form.tsx
│   └── index.ts
├── hooks/
│   ├── use-auth.ts
│   └── index.ts
├── pages/
│   ├── LoginPage.tsx
│   └── SignUpPage.tsx
├── types/
│   ├── auth.types.ts
│   └── index.ts
└── index.ts
```

### Good Naming

- `useUsers.ts` - Hook for users management
- `users-table.tsx` - Table component for users
- `create-user-form.tsx` - Form for creating users
- `auth.service.ts` - Authentication service
- `user.types.ts` - User-related types

### Avoid

- `UserManagement.tsx` - Inconsistent casing
- `useUserManagement.ts` - Too generic
- `userTable.tsx` - Missing hyphen
- `auth.ts` - Unclear purpose

## Migration Guidelines

When refactoring existing code:

1. **Identify the feature** the code belongs to
2. **Determine the appropriate layer** (component, hook, service, etc.)
3. **Apply consistent naming** conventions
4. **Update imports** throughout the codebase
5. **Update index files** to maintain clean exports
6. **Test thoroughly** to ensure no breaking changes

## Conclusion

Following these naming conventions ensures:

- **Consistency** across the codebase
- **Maintainability** through clear organization
- **Scalability** as features grow
- **Developer Experience** with predictable patterns
- **Code Quality** through enforced structure

Always refer to this document when creating new files or refactoring existing code to maintain consistency across the project.
