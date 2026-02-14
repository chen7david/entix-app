# Database & Authentication




## Database

### Environments
The project uses **Cloudflare D1** (SQLite) across three environments:

| Environment | Database | Binding |
|:---|:---|:---|
| **Development** | Local SQLite (Miniflare) | `DB` |
| **Staging** | `entix-app-staging` (Cloudflare D1) | `DB` |
| **Production** | `entix-app-production` (Cloudflare D1) | `DB` |

All environments use the same binding name: `DB`.

### Local Database (Development)

**Location**: `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`

The local database is **automatically created** by Miniflare, but only after:
1. `npm run dev` is running
2. An API endpoint that accesses the database is hit

**Important**: Drizzle must point to this exact SQLite file for migrations to work correctly.

#### Handling Local Database Drift

If you encounter issues where migrations appear applied but tables are missing:

1. **Stop** the dev server
2. **Delete** `.wrangler/` directory
3. **Restart** `npm run dev`
4. **Hit** a database-backed endpoint (to recreate the DB file)
5. **Re-apply** migrations: `npm run db:migrate:development`

### Database Tools

- **Drizzle Kit**: Generates migration files (`.sql`) from `schema.db.ts`. **Never applies migrations.**
- **Wrangler**: Applies migrations to local and remote databases.

**Rule**: Drizzle generates, Wrangler applies.

### Database Workflow

1. **Modify schema**: Edit `api/db/schema.db.ts`
2. **Generate migration**: `npm run db:generate`
3. **Apply migration**:
   - Development: `npm run db:migrate:development`
   - Staging: `npm run db:migrate:staging`
   - Production: `npm run db:migrate:production`

---

## Better Auth Setup

This project uses [Better Auth](https://www.better-auth.com/) for authentication, configured specifically for **Cloudflare Workers** and **D1 databases**.

### Architecture Overview

Better Auth is integrated into the application with a **dual-configuration architecture**:

1. **Runtime Configuration** (`api/lib/better-auth/index.ts`)
   - Used by the Cloudflare Worker at runtime
   - Connects to Cloudflare D1 via Drizzle ORM
   - Receives environment bindings dynamically

2. **CLI Configuration** (`better-auth.config.ts`)
   - **Temporary file** used only for running Better Auth CLI commands
   - Connects to the local SQLite database in `.wrangler/state/`
   - Required for generating migrations during initial setup

### Why Two Configurations?

Cloudflare Workers have a unique runtime environment that differs from traditional Node.js applications:

| Aspect | Cloudflare Workers | Traditional Node.js |
|:---|:---|:---|
| **Database Access** | Via bindings (`env.DB`) | Direct connection strings |
| **Environment Variables** | Injected at runtime | Loaded from `.env` files |
| **File System** | No file system access | Full file system access |

**The Problem**: Better Auth's CLI tools (like `npx @better-auth/cli generate`) expect a traditional Node.js environment with file system access and direct database connections.

**The Solution**: We maintain two separate configurations:
- **Runtime config** for the Worker (uses D1 bindings)
- **CLI config** for migration generation (uses direct SQLite access)

> [!IMPORTANT]
> The `better-auth.config.ts` file is **only needed during initial setup** when generating Better Auth migrations. Once migrations are created and applied, this file can be safely deleted.

### Configuration Files

#### Runtime Configuration

**File**: `api/lib/better-auth/index.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { betterAuthOptions } from "./options";
import * as schema from "./../../db/schema.db";

export const auth = (env: CloudflareBindings) => {
    const db = drizzle(env.DB, { schema });

    return betterAuth({
        ...betterAuthOptions,
        baseURL: env.BETTER_AUTH_URL,
        secret: env.BETTER_AUTH_SECRET,
        emailAndPassword: {
            enabled: true,
        },
        database: drizzleAdapter(db, { provider: "sqlite" }),
    });
};

export const mountBetterAuth = (app: AppOpenApi) => {
    app.on(["GET", "POST"], "/api/v1/auth/*", (c) => auth(c.env).handler(c.req.raw));
}
```

**Key Points**:
- ✅ Uses Cloudflare D1 binding (`env.DB`)
- ✅ Receives environment variables from Worker runtime
- ✅ Dynamically creates auth instance per request
- ✅ This is the **permanent** configuration

#### CLI Configuration (Temporary)

**File**: `better-auth.config.ts`

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { betterAuthOptions } from "./api/lib/better-auth/options";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".dev.vars" });

const d1DatabaseName = process.env.CLOUDFLARE_D1_LOCAL_DB;
if (!d1DatabaseName) throw new Error("Missing CLOUDFLARE_D1_LOCAL_DB");

const url = `./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${d1DatabaseName}`;

const sqlite = new Database(url);
const db = drizzle(sqlite);

export const auth = betterAuth({
    ...betterAuthOptions,
    baseURL: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
    database: drizzleAdapter(db, { provider: "sqlite" }),
});
```

**Key Points**:
- ⚠️ Uses `better-sqlite3` for direct file access
- ⚠️ Points to local `.wrangler/state/` database
- ⚠️ Loads environment variables from `.dev.vars`
- ⚠️ **Only used for CLI commands** (not runtime)

### Environment Variables

Add these to your `.dev.vars` file for local development:

```bash
# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars

# Local D1 Database (required for better-auth.config.ts)
CLOUDFLARE_D1_LOCAL_DB=your-database-id.sqlite
```

For **staging** and **production**, add these as environment variables in the Cloudflare dashboard or via Wrangler secrets:

```bash
# Staging
wrangler secret put BETTER_AUTH_URL --env staging
wrangler secret put BETTER_AUTH_SECRET --env staging

# Production
wrangler secret put BETTER_AUTH_URL --env production
wrangler secret put BETTER_AUTH_SECRET --env production
```

### Database Schema

Better Auth requires four tables in your database. These are defined in `api/db/schema.db.ts`:

1. **`user`** - User accounts
2. **`session`** - Active user sessions
3. **`account`** - OAuth provider accounts and password hashes
4. **`verification`** - Email verification tokens

The schema follows Better Auth's requirements while using Drizzle ORM conventions.

### Initial Setup Workflow

> [!WARNING]
> This workflow is **only needed once** during initial Better Auth integration. After migrations are created, you don't need to repeat these steps.

1. **Install Dependencies**
   ```bash
   npm install better-auth
   npm install -D @better-auth/cli
   ```

2. **Define Database Schema**
   - Create Better Auth tables in `api/db/schema.db.ts`
   - Follow Better Auth's schema requirements

3. **Generate Drizzle Migration**
   ```bash
   npm run db:generate
   ```
   This creates a migration file in `api/db/migrations/`

4. **Apply Migration to Local Database**
   ```bash
   npm run db:migrate:development
   ```

5. **Create CLI Config** (Temporary)
   - Create `better-auth.config.ts` in project root
   - Point to local `.wrangler/state/` database

6. **Generate Better Auth Migration**
   ```bash
   npx @better-auth/cli@latest generate
   ```
   This ensures Better Auth's internal schema matches your database

7. **Verify Setup**
   - Test authentication endpoints at `/api/v1/auth/*`
   - Check that sessions are created correctly

8. **Clean Up** (Optional but Recommended)
   - Delete `better-auth.config.ts` once migrations are complete
   - Keep a backup copy in this README (see below)

### Migration Reference (For Future Use)

If you need to regenerate Better Auth migrations in the future, here's the complete `better-auth.config.ts` file:

<details>
<summary>Click to view better-auth.config.ts</summary>

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";
import { betterAuthOptions } from "./api/lib/better-auth/options";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".dev.vars" });

const d1DatabaseName = process.env.CLOUDFLARE_D1_LOCAL_DB;
if (!d1DatabaseName) throw new Error("Missing CLOUDFLARE_D1_LOCAL_DB");

const url = `./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${d1DatabaseName}`;

const sqlite = new Database(url);
const db = drizzle(sqlite);

export const auth = betterAuth({
    ...betterAuthOptions,
    baseURL: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
    database: drizzleAdapter(db, { provider: "sqlite" }),
});
```

**Usage**:
1. Create this file in project root
2. Ensure `.dev.vars` has `CLOUDFLARE_D1_LOCAL_DB` set
3. Run `npx @better-auth/cli@latest generate`
4. Delete the file after migration is complete

</details>

### Authentication Endpoints

Better Auth automatically provides these endpoints at `/api/v1/auth/*`:

| Endpoint | Method | Description |
|:---|:---|:---|
| `/api/v1/auth/sign-up/email` | POST | Register with email/password |
| `/api/v1/auth/sign-in/email` | POST | Sign in with email/password |
| `/api/v1/auth/sign-out` | POST | Sign out current session |
| `/api/v1/auth/session` | GET | Get current session |
| `/api/v1/auth/verify-email` | POST | Verify email address |

---

## Wrangler Configuration

**File**: `wrangler.jsonc`

Wrangler configures how Cloudflare Workers runs your application across different environments.

### Environment Structure

```jsonc
{
  "name": "entix-app",
  "main": "api/main.ts",
  "env": {
    "development": { ... },
    "staging": { ... },
    "production": { ... }
  }
}
```

### Bindings

Bindings connect your Worker to Cloudflare resources like databases and static assets.

#### D1 Database Binding

**All environments use the same binding name**: `DB`

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "entix-app-development",
    "database_id": "...",
    "migrations_dir": "api/db/migrations"
  }
]
```

**Usage in code**:
```typescript
const db = drizzle(env.DB, { schema });
```

The `env.DB` binding is automatically injected by Cloudflare Workers runtime.

#### Assets Binding (Staging/Production)

Serves the frontend static files:

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
- Requests to `/api/*` → Handled by Worker (API logic)
- All other requests → Served from `web/dist` (React app)
- 404s → Return `index.html` (SPA client-side routing)

### Environment Variables

Each environment has its own variables:

```jsonc
"vars": {
  "SECRET_KEY": "value",
  "API_TOKEN": "value",
  "FRONTEND_URL": "http://localhost:8000",
  "BETTER_AUTH_URL": "http://localhost:3000"
}
```

**Sensitive values** (secrets) should be set via Wrangler CLI:
```bash
wrangler secret put SECRET_NAME --env production
```

### Environment-Specific Configuration

| Configuration | Development | Staging | Production |
|---------------|-------------|---------|------------|
| **Frontend URL** | `http://localhost:8000` | `https://staging.entix.org` | `https://entix.org` |
| **Better Auth URL** | `http://localhost:3000` | `https://staging.entix.org` | `https://entix.org` |
| **Assets** | None (Vite proxy) | `web/dist` | `web/dist` |
| **Database** | Local Miniflare | `entix-app-staging` | `entix-app-production` |

### Key Settings

- **`nodejs_compat`**: Enables Node.js compatibility for packages like Better Auth
- **`preview_urls`**: Generates preview URLs for deployments
- **`observability.enabled`**: Enables logging and monitoring

