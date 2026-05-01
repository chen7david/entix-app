import journalMeta from "../migrations/meta/_journal.json";
import { JournalSchema } from "./meta.schemas";

const parsedJournal = JournalSchema.parse(journalMeta);
const journalCount = parsedJournal.entries.length;

let checkPromise: Promise<void> | null = null;

export async function checkRuntimeMigrationDrift(db: D1Database) {
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
