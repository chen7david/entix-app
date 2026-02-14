# Frontend

The frontend is a modern **React** application built with **Vite** and **TypeScript**, providing a fast development experience and optimized production builds.

## Tech Stack

- **React 18** - UI library with hooks and functional components
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React Router** - Client-side routing
- **Ant Design Icons** - Icon library
- **Jotai** - State management

## Project Structure

```
web/src/
├── components/       # Reusable UI components
├── pages/           # Page-level components (mapped to routes)
├── layouts/         # Layout components (wrappers for pages)
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helper functions
├── providers/       # React context providers
├── theme/           # Theme configuration and styling
├── constants/       # Application constants
├── assets/          # Static assets (images, fonts, etc.)
├── App.tsx          # Main application component with routing
├── main.tsx         # Application entry point
└── index.css        # Global styles
```

### Key Directories

#### `/components`
Reusable, composable UI components used across multiple pages.

**Examples**:
- Button components
- Form inputs
- Card components
- Navigation bars
- Modals and dialogs

**Best Practice**: Components should be small, focused, and reusable. Avoid page-specific logic in components.

#### `/pages`
Page-level components that represent complete views in the application.

**Examples**:
- `HomePage.tsx`
- `LoginPage.tsx`
- `DashboardPage.tsx`
- `UserProfilePage.tsx`

**Routing**: Pages are mapped to routes in `App.tsx` using React Router.

#### `/layouts`
Layout components that wrap pages with common UI elements like headers, footers, and navigation.

**Examples**:
- `MainLayout.tsx` - Standard layout with header and footer
- `AuthLayout.tsx` - Layout for authentication pages
- `DashboardLayout.tsx` - Layout for dashboard pages

**Usage**:
```tsx
<MainLayout>
  <HomePage />
</MainLayout>
```

#### `/hooks`
Custom React hooks for shared logic and state management.

**Examples**:
- `useAuth.ts` - Authentication state and methods
- `useApi.ts` - API request handling
- `useLocalStorage.ts` - Local storage management
- `useDebounce.ts` - Debouncing values

**Best Practice**: Extract complex logic into hooks to keep components clean.

#### `/providers`
React context providers for global state management.

**Examples**:
- Authentication provider
- Theme provider
- User settings provider

**Pattern**:
```tsx
export const AuthProvider = ({ children }) => {
  // State and logic
  return (
    <AuthContext.Provider value={...}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### `/theme`
Theme configuration including colors, typography, spacing, and other design tokens.

**Purpose**: Centralize styling constants for consistency across the application.

#### `/lib`
Utility functions and helper modules.

**Examples**:
- API client configuration
- Date formatting utilities
- Validation helpers
- Type guards

## API Integration

### Using Relative Paths

**Critical**: Always use relative paths for API requests to ensure compatibility across environments.

```typescript
// ✅ Correct - Works in dev and production
const response = await fetch('/api/v1/users');

// ❌ Incorrect - Hardcoded URL breaks in production
const response = await fetch('http://localhost:3000/api/v1/users');
```

### Environment-Specific Behavior

| Environment | Frontend URL | API URL | How It Works |
|------------|--------------|---------|--------------|
| **Development** | `http://localhost:8000` | `http://localhost:3000` | Vite proxy forwards `/api/*` to port 3000 |
| **Production** | `https://entix.org` | Same origin | Cloudflare Worker serves both frontend and API |

### Vite Proxy Configuration

In development, Vite's dev server proxies API requests to the Cloudflare Worker:

**File**: `web/vite.config.ts`

```typescript
server: {
  port: 8000,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

This allows you to make requests to `/api/v1/users` from the frontend, and Vite automatically forwards them to `http://localhost:3000/api/v1/users`.

## Authentication Integration

The frontend integrates with Better Auth for authentication.

### Auth State Management

Authentication state is typically managed using:
- **Jotai atoms** for global auth state
- **Custom hooks** (`useAuth`) for auth operations
- **Context providers** for auth data

### Making Authenticated Requests

```typescript
// Include credentials for cookie-based auth
const response = await fetch('/api/v1/protected-route', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

The `credentials: 'include'` option ensures cookies are sent with the request.

## Build Process

### Development Build

Start the development server:

```bash
npm run dev:web
```

This runs Vite's dev server with:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- API proxy to backend

### Production Build

Build for production:

```bash
npm run build:web
```

**Build Steps**:
1. Install dependencies: `cd web && npm install`
2. Run Vite build: `npm run build`
3. Build VuePress docs: `npm run build:docs`
4. Output: `web/dist/`

**Build Output** (`web/dist/`):
```
dist/
├── index.html           # Entry HTML file
├── assets/
│   ├── index-{hash}.js  # Bundled JavaScript
│   ├── index-{hash}.css # Bundled CSS
│   └── ...              # Other assets (images, fonts)
└── docs/                # VuePress documentation
```

### Asset Serving in Production

In production, Cloudflare Workers serves the `web/dist` directory:

**wrangler.jsonc** (staging/production):
```jsonc
"assets": {
  "binding": "ASSETS",
  "directory": "./web/dist",
  "not_found_handling": "single-page-application",
  "run_worker_first": [
    "/api/*"
  ]
}
```

**How it works**:
1. Requests to `/api/*` → Routed to Worker (API handler)
2. All other requests → Served from `web/dist` (static files)
3. 404s → Return `index.html` (SPA routing)

## Development Workflow

### 1. Start Development Servers

From project root:
```bash
npm run dev
```

This starts both:
- API server on `localhost:3000`
- Frontend server on `localhost:8000`

### 2. Make Changes

- Edit files in `web/src/`
- Changes auto-reload via HMR
- No manual refresh needed

### 3. Test API Integration

- API calls automatically proxied to backend
- Check Network tab in DevTools
- Verify request/response format

### 4. Build for Production

```bash
npm run build:web
```

Test the production build locally before deploying.

## Common Patterns

### Fetching Data

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/v1/users')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    })
    .catch(error => console.error(error));
}, []);
```

### Form Submission

```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const response = await fetch('/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
    credentials: 'include',
  });
  
  if (response.ok) {
    // Handle success
  } else {
    // Handle error
  }
};
```

### Protected Routes

```typescript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Usage in App.tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

## Styling

The application uses a combination of:
- **Global CSS** (`index.css`) for base styles
- **Theme system** for design tokens
- **Component-specific styles** (CSS modules or styled-components)

### Best Practices

1. **Use theme variables** for colors and spacing
2. **Avoid inline styles** for maintainability
3. **Keep styles co-located** with components
4. **Use consistent naming** (BEM or similar)

## TypeScript

The frontend is fully typed with TypeScript.

### Shared Types

Import types from `@shared` for API responses:

```typescript
import type { UserDTO } from '@shared';

const users: UserDTO[] = await response.json();
```

This ensures frontend and backend stay in sync with shared type definitions.
