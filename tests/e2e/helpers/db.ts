import { readdirSync } from "node:fs";
import { join } from "node:path";
import { hashPassword } from "better-auth/crypto";
import Database from "better-sqlite3";

const D1_DIR = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";

function resolveLocalD1Path() {
    const entries = readdirSync(D1_DIR).filter((entry) => entry.endsWith(".sqlite"));
    const appDb = entries.find((entry) => entry !== "metadata.sqlite");
    if (!appDb) {
        throw new Error(`Unable to find local D1 sqlite database in ${D1_DIR}`);
    }
    return join(D1_DIR, appDb);
}

export async function getLatestResetTokenForEmail(email: string): Promise<string> {
    const startedAt = Date.now();
    const timeoutMs = 15000;

    while (Date.now() - startedAt < timeoutMs) {
        const dbPath = resolveLocalD1Path();
        const db = new Database(dbPath, { readonly: true });
        try {
            const row = db
                .prepare(
                    `
                    SELECT value
                    FROM auth_verifications
                    WHERE identifier = ?
                       OR identifier LIKE ?
                    ORDER BY created_at DESC
                    LIMIT 1
                    `
                )
                .get(email, `%${email}%`) as { value?: string } | undefined;

            if (row?.value) {
                return row.value;
            }
        } finally {
            db.close();
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error(`No password reset token found for ${email} within ${timeoutMs}ms`);
}

export function seedPasswordResetToken(email: string): string {
    const dbPath = resolveLocalD1Path();
    const db = new Database(dbPath);
    const token = `e2e-reset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const now = Date.now();
    const expiresAt = now + 15 * 60 * 1000;
    const id = `e2e-${Math.random().toString(36).slice(2, 12)}`;

    try {
        const user = db.prepare(`SELECT id FROM auth_users WHERE email = ? LIMIT 1`).get(email) as
            | { id: string }
            | undefined;
        if (!user) {
            throw new Error(`Cannot seed reset token: user not found for ${email}`);
        }

        db.prepare(
            `
            INSERT INTO auth_verifications (id, identifier, value, expires_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            `
        ).run(id, `reset-password:${token}`, user.id, expiresAt, now, now);
    } finally {
        db.close();
    }

    return token;
}

export function markUserEmailVerified(email: string): void {
    const dbPath = resolveLocalD1Path();
    const db = new Database(dbPath);
    try {
        db.prepare(
            `
            UPDATE auth_users
            SET email_verified = 1
            WHERE email = ?
            `
        ).run(email);
    } finally {
        db.close();
    }
}

export function promoteUserToPlatformAdmin(email: string): void {
    const dbPath = resolveLocalD1Path();
    const db = new Database(dbPath);
    try {
        const result = db
            .prepare(
                `
                UPDATE auth_users
                SET role = 'admin', email_verified = 1
                WHERE email = ?
                `
            )
            .run(email);
        if (result.changes === 0) {
            throw new Error(`Cannot promote user: ${email} not found`);
        }
    } finally {
        db.close();
    }
}

export async function resetRootAdminCredential(password: string): Promise<void> {
    const dbPath = resolveLocalD1Path();
    const db = new Database(dbPath);
    const hashed = await hashPassword(password);

    try {
        const userResult = db
            .prepare(
                `
                UPDATE auth_users
                SET role = 'admin', email_verified = 1
                WHERE email = 'root@admin.com'
                `
            )
            .run();
        if (userResult.changes === 0) {
            throw new Error("Cannot reset root admin credential: root@admin.com not found");
        }

        const accountResult = db
            .prepare(
                `
                UPDATE auth_accounts
                SET password = ?, updated_at = ?
                WHERE account_id = 'root@admin.com' AND provider_id = 'credential'
                `
            )
            .run(hashed, Date.now());

        if (accountResult.changes === 0) {
            throw new Error("Cannot reset root admin credential: auth account not found");
        }
    } finally {
        db.close();
    }
}
