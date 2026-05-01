import { execSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = "./api/db/migrations";
const META_DIR = path.join(MIGRATIONS_DIR, "meta");
const JOURNAL_PATH = path.join(META_DIR, "_journal.json");
const listSql = (dir: string) =>
    readdirSync(dir)
        .filter((file) => file.endsWith(".sql"))
        .sort();
const listSnapshots = (dir: string) =>
    readdirSync(dir)
        .filter((file) => file.endsWith(".json") && file !== "_journal.json")
        .sort();

const restoreGeneratedArtifacts = (
    beforeSql: string[],
    beforeSnapshots: string[],
    beforeJournal: string
) => {
    for (const file of listSql(MIGRATIONS_DIR).filter((item) => !beforeSql.includes(item))) {
        rmSync(path.join(MIGRATIONS_DIR, file), { force: true });
    }
    for (const file of listSnapshots(META_DIR).filter((item) => !beforeSnapshots.includes(item))) {
        rmSync(path.join(META_DIR, file), { force: true });
    }
    writeFileSync(JOURNAL_PATH, beforeJournal, "utf-8");
};

function main() {
    const beforeSql = listSql(MIGRATIONS_DIR);
    const beforeSnapshots = listSnapshots(META_DIR);
    const beforeJournal = readFileSync(JOURNAL_PATH, "utf-8");

    try {
        execSync("npx drizzle-kit generate --config=drizzle.config.ts --name=drift_check", {
            stdio: "pipe",
            encoding: "utf-8",
        });
    } catch (error) {
        restoreGeneratedArtifacts(beforeSql, beforeSnapshots, beforeJournal);

        if (process.env.ALLOW_DRIFT_CHECK_SKIP === "true") {
            console.warn(
                "[drift] drizzle-kit generate failed - skipped via ALLOW_DRIFT_CHECK_SKIP."
            );
            process.exit(0);
        }

        console.error("[drift] drizzle-kit generate failed. Fix config before pushing.");
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }

    const afterSql = listSql(MIGRATIONS_DIR);
    const newSqlFiles = afterSql.filter((file) => !beforeSql.includes(file));
    const afterSnapshots = listSnapshots(META_DIR);
    const newSnapshotFiles = afterSnapshots.filter((file) => !beforeSnapshots.includes(file));

    restoreGeneratedArtifacts(beforeSql, beforeSnapshots, beforeJournal);

    if (newSqlFiles.length > 0) {
        console.error(
            "[drift] Schema drift detected - unapplied schema changes exist. Run drizzle-kit generate and commit."
        );
        process.exit(1);
    }

    console.log("[drift] No schema drift detected.");
}

main();
