import journalMeta from "../migrations/meta/_journal.json";
import { JournalSchema } from "./meta.schemas";

const parsedJournal = JournalSchema.safeParse(journalMeta);
const journalCount = parsedJournal.success ? parsedJournal.data.entries.length : 0;
const journalParseError = parsedJournal.success ? null : parsedJournal.error.message;

let checkPromise: Promise<void> | null = null;

export async function checkRuntimeMigrationDrift(db: D1Database) {
    if (journalParseError) {
        console.warn("[Migration Drift] Invalid journal metadata, skipping drift check", {
            error: journalParseError,
        });
        return;
    }

    let rows: Array<{ hash?: string | null; tag?: string | null }> = [];
    try {
        const result = await db
            .prepare("SELECT * FROM __drizzle_migrations")
            .all<{ hash?: string | null; tag?: string | null }>();
        rows = result.results ?? [];
    } catch {
        return;
    }

    const appliedCount = rows.length;
    if (appliedCount !== journalCount) {
        console.warn(
            `[Migration Drift] DB has ${appliedCount} applied migrations but journal has ${journalCount} entries`
        );
    }
}

export async function runRuntimeMigrationDriftCheckOnce(db: D1Database) {
    if (!checkPromise) {
        checkPromise = checkRuntimeMigrationDrift(db).catch((error) => {
            console.warn("[Migration Drift] Runtime migration check failed", error);
        });
    }
    await checkPromise;
}
