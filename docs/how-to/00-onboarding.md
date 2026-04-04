# Developer Onboarding & Setup

This guide explains how to set up your local development environment and safely transition from the bootstrap `root` account to your own administrative user.

## 1. Environment Configuration

Before running the application, you must set up your environment variables.

1.  **Local Development**: Create a `.dev.vars` file in the project root (used by Wrangler).
    ```bash
    # Example .dev.vars
    BETTER_AUTH_SECRET="your-secret-here"
    RESEND_API_KEY="re_..."
    SKIP_EMAIL_VERIFICATION="true" # Set to true to skip verification locally
    ```
2.  **Web Application**: Ensure `web/.env` is configured (usually managed by Vite defaults).

## 2. Database Initialization

Reset your local database to apply all migrations and seeds:

```bash
npm run db:reset:dev
```

## 3. The "Bootstrap" Workflow

Once the database is reset, follow these steps to set up your primary developer account:

### Step A: Initial Login
- **URL**: `http://localhost:3000` (or your dev port)
- **Email**: `root@admin.com`
- **Password**: `r00tme`

### Step B: Create Your Organization
1. Navigate to the **Admin Dashboard**.
2. Go to the **Organizations** tab.
3. Create a new organization (e.g., "My Dev Corp") using **your actual email address**.

### Step C: Wallet Activation (Via Impersonation)
1. In the **Users** tab, find your newly created user.
2. Click **Impersonate**.
3. While impersonating, navigate to **Finance -> Accounts**.
4. Activate the currencies you want to fund (e.g., ETD, CNY, USD).
5. Click **Stop Impersonation** at the top of the screen to return to the Root Admin.

### Step D: Funding Your Accounts
1. Go back to the **Finance Oversight** (Admin view).
2. Find the **Platform Treasury** account for the currency you just activated.
3. Use the "Admin Credit" or "Transfer" feature to fund your newly activated organization account from the Treasury.

### Step E: Account Promotion & Verification
1. Go to the **Users** tab in the Admin dashboard.
2. Promote your new user to the **Admin** role.
3. Click "Send Verification Email" (requires `RESEND_API_KEY` or manual DB update if not skipping).
4. **Logout** of the Root user.

### Step F: Secure the System
1. Verify your email (if required) and **Login** with your new credentials.
2. Navigate back to **Admin -> Users**.
3. Find the `root@admin.com` user.
4. **Demote** them from Admin and **Block** the user (since we do not delete users for ledger integrity).
5. *Alternatively*: You can update the root password to something random while authenticated, but the email flow will not work as the email is fake.

---

> [!CAUTION]
> **Production Security**: The root account should ALWAYS be blocked/demoted immediately after the first admin is created in any environment.
