# Setup & Development

## Quick Start

### Setup
Install dependencies for both root and web projects:

```bash
npm run dev:init
```

### Run Development Server
Start both API and web servers:

```bash
npm run dev
```

- **Web**: [http://localhost:8000](http://localhost:8000)
- **API**: [http://localhost:3000](http://localhost:3000)

### Initialize Database
The local database is automatically created by Miniflare when you:
1. Start `npm run dev`
2. Hit an API endpoint that accesses the database

After the database is created, apply migrations:

```bash
npm run db:migrate:development
```

---

## Environment Variables

### Local Development Configuration

Create a `.dev.vars` file in the project root for local development environment variables.

**Example `.dev.vars`:**

```bash
# Local D1 Database Identifier
# This is the SQLite filename created by Miniflare in .wrangler/state/v3/d1/miniflare-D1DatabaseObject/
CLOUDFLARE_D1_LOCAL_DB=your-database-id-here.sqlite

# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars
```

**Important Notes:**
- `.dev.vars` is gitignored and should **never** be committed
- This file is only used for local development
- The `CLOUDFLARE_D1_LOCAL_DB` variable tells Drizzle which local SQLite file to use
- The `BETTER_AUTH_URL` should match your local API server URL
- The `BETTER_AUTH_SECRET` must be at least 32 characters for security
- To find your database ID, check `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` after running `npm run dev` and hitting a database endpoint

---

## Development Workflow

### 1. Install Dependencies
```bash
npm run dev:init
```

### 2. Start Development Servers
```bash
npm run dev
```

### 3. Initialize Local Database
Make a request to the API (e.g., open the web app) to trigger Miniflare database creation.

### 4. Apply Migrations
```bash
npm run db:migrate:development
```

### 5. Develop Features
- Create/modify routes in `api/routes/`
- Update schemas in `api/db/schema.db.ts`
- Generate migrations: `npm run db:generate`
- Apply migrations: `npm run db:migrate:development`

### 6. Frontend API Usage
Always use **relative paths** in frontend code:

```typescript
// ✅ Correct
const res = await axios.get("/api/v1/users");

// ❌ Incorrect (Don't hardcode localhost)
const res = await axios.get("http://localhost:3000/api/v1/users");
```

---

## Scripts Reference

| Script | Description |
|:---|:---|
| `npm run dev` | Starts API and Web in development mode |
| `npm run dev:init` | Installs all dependencies (Root + Web) |
| `npm run dev:api` | Starts only the API server (Wrangler) |
| `npm run dev:web` | Starts only the Web server (Vite) |
| `npm run build:web` | Builds the React frontend to `web/dist` |
| `npm run db:generate` | Generates SQL migrations from `schema.db.ts` |
| `npm run db:studio` | Opens Drizzle Studio for database inspection |
| `npm run db:migrate:development` | Applies migrations to local Miniflare database |
| `npm run db:migrate:staging` | Applies migrations to staging D1 database |
| `npm run db:migrate:production` | Applies migrations to production D1 database |
| `npm run deploy:staging` | Migrates DB + deploys to Staging |
| `npm run deploy:production` | Migrates DB + deploys to Production |
| `npm run auth:generate` | Generates Better Auth migrations using the temporary `better-auth.config.ts` |
| `npm run cf-typegen` | Generates TypeScript types for Cloudflare bindings (e.g., `env.DB`) |
