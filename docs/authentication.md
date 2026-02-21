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

## Registration Flow

Entix utilizes a unified, atomic registration flow for all user creation to guarantee data integrity across the `User`, `Account`, `Member`, and `Organization` domains.

### The `RegistrationService`

All user creation passes through `RegistrationService` rather than calling Better Auth directly or writing raw queries from the route handlers. This explicitly prevents orphaned data (e.g., a "User" existing without an associated "Member").

It implements two primary atomic flows using Cloudflare D1's `db.batch()`:

1. **`signupWithOrg`**: Called when a new user registers organically. It atomically inserts a `User`, a `Credential Account`, an `Organization`, and a `Member` record designating them as the owner.
2. **`createUserAndMember`**: Called when an admin explicitly invites a new user to an existing organization. It atomically inserts a `User`, a `Credential Account`, and a `Member` record.

### The "Invited User" Flow

When an admin invites a user via `createUserAndMember`:

1. The service generates a securely hashed dummy password to create the credential account.
2. The user is inserted with `emailVerified: false`.
3. The service triggers Better Auth's password reset flow.

Because the user is explicitly invited, we want to give them a seamless onboarding experience. Instead of sending a generic "Reset Password" email, our application intercepts the BetterAuth password reset callback. If the user's `emailVerified` flag is `false`, we explicitly dispatch a `welcome-initial-password-setup` email template through our mailer instead, creating a smooth welcome experience.

When the invited user clicks the email link and successfully sets their password on the frontend, the backend intercepts this event:

```typescript
// api/lib/auth/config/features/email-and-password.feature.ts
async onPasswordReset({ user }) {
    if (!ctx) return;
    const userRepo = new UserRepository(ctx);
    await userRepo.updateUser(user.id, { emailVerified: true });
}
```

When the invited user clicks the email link and successfully sets their password on the frontend, the backend intercepts this event and automatically enforces `emailVerified = true`.
