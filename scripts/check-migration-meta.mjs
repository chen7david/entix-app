import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function listFiles(dir) {
    return readdirSync(dir).filter((name) => statSync(join(dir, name)).isFile());
}

function formatFailure(message, details = []) {
    const lines = [`[migration-check] ${message}`];
    for (const detail of details) {
        lines.push(`  - ${detail}`);
    }
    return lines.join("\n");
}

export function checkMigrationMeta(root = process.cwd()) {
    const migrationsDir = join(root, "api", "db", "migrations");
    const metaDir = join(migrationsDir, "meta");
    const journalPath = join(metaDir, "_journal.json");

    const journal = JSON.parse(readFileSync(journalPath, "utf8"));
    const entries = Array.isArray(journal.entries) ? journal.entries : [];
    const entryTags = new Set(entries.map((entry) => entry.tag));

    const migrationFiles = listFiles(migrationsDir).filter((name) => name.endsWith(".sql"));
    const snapshotFiles = new Set(
        listFiles(metaDir).filter((name) => name.endsWith("_snapshot.json"))
    );

    const missingSnapshots = entries
        .map((entry) => `${String(entry.idx).padStart(4, "0")}_snapshot.json`)
        .filter((snapshot) => !snapshotFiles.has(snapshot));

    if (missingSnapshots.length > 0) {
        throw new Error(
            formatFailure("Journal entries are missing corresponding snapshots.", missingSnapshots)
        );
    }

    const sqlWithoutJournal = migrationFiles.filter((file) => {
        const tag = file.replace(/\.sql$/, "");
        const isSeedFile = /seed/i.test(file);
        return !isSeedFile && !entryTags.has(tag);
    });

    if (sqlWithoutJournal.length > 0) {
        throw new Error(
            formatFailure(
                "Non-seed migration SQL files are missing journal entries.",
                sqlWithoutJournal
            )
        );
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        checkMigrationMeta();
        console.log("[migration-check] Journal and snapshots are consistent.");
    } catch (error) {
        console.error(`\n${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
