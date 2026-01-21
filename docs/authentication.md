# Authentication Module

This module handles authentication for the Entix application using [Better Auth](https://better-auth.com).

## Structure

- **`auth.ts`**: The main entry point for the authentication library. It exports the `auth` instance and the `mountBetterAuth` function.
- **`config/`**: Contains all configuration logic.
    - **`global.config.ts`**: Global Better Auth options.
    - **`plugins.config.ts`**: Plugin configuration.
    - **`features/`**: Feature-specific configurations (e.g., email/password, email verification).
- **`rbac/`**: Role-Based Access Control definitions.

## Adding New Features/Plugins

When adding a new feature or plugin that requires runtime dependencies (like `ctx` or `mailer`), follow these steps:

1.  **Create a Config Factory**: Create a file in `config/features/` or `config/plugins/` that exports a function returning the configuration.
2.  **Optional Dependencies**: Ensure the factory function accepts dependencies as **optional** arguments. This is crucial for the CLI to generate the schema without needing the runtime environment.

```typescript
// Example: config/features/my-feature.ts
import { AppContext } from "@api/helpers/types.helpers";
import { Mailer } from "../../mail/mailer.lib";

export const getMyFeatureConfig = (ctx?: AppContext, mailer?: Mailer) => ({
    myFeature: {
        enabled: true,
        someHook: async () => {
            // Guard against missing dependencies
            if (!ctx || !mailer) return;
            // Use dependencies
        }
    }
});
```

3.  **Register Config**: Import and use your factory in `auth.ts` (for features) or `config/plugins.config.ts` (for plugins).

## CLI Usage

The Better Auth CLI uses `better-auth.config.ts` in the root directory. This file imports the configuration factories but does not provide runtime dependencies. This is why optional dependencies are required.

To generate the schema:
```bash
npm run auth:generate
```
