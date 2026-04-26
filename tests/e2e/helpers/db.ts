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
                    ORDER BY created_at DESC
                    LIMIT 1
                    `
                )
                .get(email) as { value?: string } | undefined;

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
