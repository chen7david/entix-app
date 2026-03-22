# Environment Setup

How to configure your local environment for development.

## 1. Prerequisites
- **Node.js**: v20+
- **Wrangler CLI**: `npm install -g wrangler`

## 2. Secrets & Variables
We use `.dev.vars` for local secrets.

1. Copy the example:
   ```bash
   cp example.dev.vars .dev.vars
1. Fill in the values:
   - `BETTER_AUTH_SECRET`: Generate a random string.
   - `RESEND_API_KEY`: Get from Resend dashboard.
   - `CLOUDFLARE_D1_LOCAL_DB`: Name of your local dev DB.

## 3. Database Initialization
Local D1 state is stored in `.wrangler/`. To reset it:
```bash
rm -rf .wrangler/state/v3/d1
npm run db:migrate:development
```

> [!WARNING]
> **Setup Stage: Security Notice**
> Right after installing the packages, you **must run the migrations** (`npm run db:migrate:development`). Once complete, log in with the default credentials:
> - **Email**: `root@admin.com`
> - **Password**: `password`
>
> ### Securing Your Environment:
> 1. In the sidebar, navigate to the **Admin Organizations** (`http://localhost:8000/admin/organizations`) page.
> 2. Click **Create Org + User** to provision your permanent organization and personal user account.
> 3. Go to the **Admin Users** page (`http://localhost:8000/admin/users`), locate the user you just created, and **promote them to `admin`**.
> 4. **Retrieve Setup Link:**
>    - *Staging/Production*: Check your email inbox for the activation link.
>    - *Development*: Email sending is mocked. Check your active local terminal logs for the printed activation URL, and paste it into your browser.
>    - After activation, sign out and log back in as your newly created user.
> 5. Returning to the Admin panels, **demote and ban** the default `root@admin.com` user (since users cannot be permanently deleted), and securely delete its linked testing organization.
> 
> *Do not leave the default user exposed in production since it holds root admin access.*

[Why use .dev.vars?](../why/dev-vars.md)

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
