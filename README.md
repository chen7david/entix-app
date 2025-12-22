# Entix-App

Entix-App is a full-stack application built on Cloudflare Workers (API) and a Vite + React frontend.

## Project Structure

- **`api/`**: Source code for the Cloudflare Worker (API).
- **`web/`**: Source code for the Vite + React frontend.
- **`shared/`**: Shared TypeScript contracts, Zod schemas, and DTOs used by both `api` and `web`.

## Architecture

### Development
In development, the application runs as two separate processes:
1.  **Vite Dev Server**: Serves the frontend and proxies API requests to the Worker.
2.  **Wrangler Dev Server**: Runs the Worker API locally using Miniflare.

### Staging & Production
In staging and production, the application is deployed as a **single Cloudflare Worker**. This Worker handles:
-   API requests (e.g., `/api/*`).
-   Serving static frontend assets (bundled from `web/`).

## Database

The project uses **Cloudflare D1** (SQLite) for the database.

### Environments
-   **Development**: Uses a local SQLite file managed by Miniflare.
-   **Staging**: Uses a dedicated D1 database on Cloudflare.
-   **Production**: Uses a separate, dedicated D1 database on Cloudflare.

All environments use the same binding name: `DB`.

### Local Database (Development)
The local database is **automatically created** by Miniflare, but only after:
1.  `npm run dev` is running.
2.  An API endpoint that accesses the database is hit.

**Location**: The local database file is stored in:
`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`

**Important**: Drizzle must point to this exact SQLite file to generate migrations correctly against the local state.

#### Handling Local Drift
Miniflare may create multiple SQLite files if configuration changes. If you encounter issues where migrations seem applied but tables are missing:
1.  **Stop** the dev server.
2.  **Delete** the `.wrangler/` directory.
3.  **Restart** `npm run dev`.
4.  **Hit** a database-backed endpoint (to recreate the DB file).
5.  **Re-apply** migrations using `npm run db:migrate:development`.

### Database Tools
-   **Drizzle Kit**: Used **ONLY** to generate migration files (`.sql`) from the schema.
-   **Wrangler**: Used to **apply** migrations to the database (local and remote). Drizzle is *never* used to apply migrations directly.

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts both API and Web in development mode. |
| `npm run dev:init` | Installs dependencies for Root and Web. |
| `npm run db:generate` | Generates SQL migrations from `schema.db.ts`. |
| `npm run db:migrate:development` | Applies migrations to the **local** Miniflare database. |
| `npm run db:migrate:staging` | Applies migrations to the **staging** D1 database. |
| `npm run db:migrate:production` | Applies migrations to the **production** D1 database. |
| `npm run deploy:staging` | Deploys the application to the Staging environment. |
| `npm run deploy:production` | Deploys the application to the Production environment. |

## Routing Architecture

The API follows a strict **3-file pattern** for every route to ensure type safety.

1.  **`*.routes.ts`**: Defines the OpenAPI specification using `createRoute`.
    *   **Rule**: Validation schemas **MUST** be defined in `request.body`, `request.query`, etc.
    *   **Rule**: Do **NOT** use validator middleware; it breaks type inference.
2.  **`*.handlers.ts`**: Implements the route logic.
    *   **Rule**: Use `AppHandler<typeof Route>` to infer types automatically from the route definition.
3.  **`*.index.ts`**: Binds the route to the handler using `createRouter().openapi()`.

## Error Handling

The API uses a centralized error handling strategy.
-   All errors return a standardized JSON response.
-   404 errors are handled consistently across the API.

## Development Workflow

1.  **Install**: `npm run dev:init`
2.  **Start**: `npm run dev`
3.  **Initialize DB**: Make a request to the API (e.g., open the app) to trigger Miniflare DB creation.
4.  **Migrate**: `npm run db:migrate:development`
5.  **Develop**: Create features, generate new migrations (`npm run db:generate`), and apply them.

## Deployment

-   **Staging**: Automatically deployed via GitHub Actions on Pull Requests.
-   **Production**: Manually deployed using `npm run deploy:production`.

## API Documentation

The Worker serves OpenAPI documentation directly:
-   **OpenAPI JSON**: `/api/v1/openapi`
-   **Interactive Reference**: `/api/v1/api-reference`
