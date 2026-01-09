# Troubleshooting

[← Back to Table of Contents](../README.md)


### Local Database Issues
If tables are missing or migrations aren't applying:
1. Stop `npm run dev`
2. Delete `.wrangler/` directory
3. Restart `npm run dev`
4. Hit a database endpoint to recreate the DB
5. Run `npm run db:migrate:development`

### Type Inference Not Working
Ensure validation schemas are in `createRoute.request`, not in middleware.

### Frontend Can't Reach API
Verify you're using relative paths (`/api/v1/...`) not absolute URLs.

### Common Issues & Solutions

#### "Cannot find name 'mountBetterAuth'"

**Cause**: Missing import in `api/app.ts`

**Solution**: Add the import and mount the auth routes:

```typescript
import { mountBetterAuth } from "./lib/better-auth";

const app = createApp();
configureOpenApi(app);
mountBetterAuth(app);  // Add this line
mountRoutes({ app, routes, prefix: '/api/v1' });
```

#### "No configuration file found"

**Cause**: Running Better Auth CLI without `better-auth.config.ts`

**Solution**: 
- If generating migrations: Create `better-auth.config.ts` (see reference above)
- If migrations are done: You don't need to run CLI commands anymore

#### Database Schema Mismatch

**Cause**: Better Auth's expected schema doesn't match your Drizzle schema

**Solution**:
1. Ensure your schema matches Better Auth requirements
2. Run `npm run db:generate` to create Drizzle migration
3. Run `npm run db:migrate:development` to apply migration
4. Run `npx @better-auth/cli generate` to sync Better Auth
