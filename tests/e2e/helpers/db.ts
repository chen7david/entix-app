import { readdirSync } from "node:fs";
import { join } from "node:path";
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

export function getMemberFundingContext(input: {
    memberEmail: string;
    currencyCode: "CNY" | "ETD";
    organizationSlug: string;
}): { organizationId: string; destinationAccountId: string; fundingAccountId: string } {
    const dbPath = resolveLocalD1Path();
    const db = new Database(dbPath, { readonly: true });
    try {
        const row = db
            .prepare(
                `
                SELECT
                    o.id AS organization_id,
                    member_acc.id AS destination_account_id,
                    org_funding_acc.id AS funding_account_id
                FROM auth_users u
                JOIN auth_members m ON m.user_id = u.id
                JOIN auth_organizations o ON o.id = m.organization_id
                JOIN financial_currencies c ON c.code = ?
                LEFT JOIN financial_accounts member_acc
                    ON member_acc.owner_id = u.id
                    AND member_acc.owner_type = 'user'
                    AND member_acc.organization_id = o.id
                    AND member_acc.currency_id = c.id
                    AND member_acc.is_active = 1
                LEFT JOIN financial_accounts org_funding_acc
                    ON org_funding_acc.owner_id = o.id
                    AND org_funding_acc.owner_type = 'org'
                    AND org_funding_acc.organization_id = o.id
                    AND org_funding_acc.currency_id = c.id
                    AND org_funding_acc.account_type = 'funding'
                WHERE u.email = ?
                  AND o.slug = ?
                LIMIT 1
                `
            )
            .get(input.currencyCode, input.memberEmail, input.organizationSlug) as
            | {
                  organization_id: string | null;
                  destination_account_id: string | null;
                  funding_account_id: string | null;
              }
            | undefined;

        if (!row?.organization_id || !row.destination_account_id || !row.funding_account_id) {
            throw new Error(
                `Unable to resolve funding context for ${input.memberEmail} ${input.currencyCode} in ${input.organizationSlug}`
            );
        }

        return {
            organizationId: row.organization_id,
            destinationAccountId: row.destination_account_id,
            fundingAccountId: row.funding_account_id,
        };
    } finally {
        db.close();
    }
}
