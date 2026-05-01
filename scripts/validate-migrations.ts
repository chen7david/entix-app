import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
    type MigrationContext,
    policies,
} from "../api/db/migration-guard/policies";
import {
    JournalSchema,
    SnapshotSchema,
} from "../api/db/migration-guard/meta.schemas";

const MIGRATIONS_DIR = "./api/db/migrations";
const META_DIR = path.join(MIGRATIONS_DIR, "meta");
const JOURNAL_PATH = path.join(META_DIR, "_journal.json");

const SNAPSHOT_FILE_REGEX = /^(\d{4})_snapshot\.json$/;

const parseSnapshotIdx = (fileName: string) => {
    const match = fileName.match(SNAPSHOT_FILE_REGEX);
    if (!match) return null;
    return Number.parseInt(match[1], 10);
};

function buildContext(): MigrationContext {
    const journal = JournalSchema.parse(
        JSON.parse(readFileSync(JOURNAL_PATH, "utf-8"))
    );

    const sqlFiles = readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.endsWith(".sql"))
        .map((file) => file.replace(/\.sql$/, ""))
        .sort();

    const snapshotFiles = readdirSync(META_DIR).filter(
        (file) => file.endsWith(".json") && file !== "_journal.json"
    );

    const snapshotIdxOnDisk = snapshotFiles
        .map(parseSnapshotIdx)
        .filter((value): value is number => value !== null)
        .sort((a, b) => a - b);

    const snapshotDataByIdx = new Map<number, ReturnType<typeof SnapshotSchema.parse>>();
    for (const file of snapshotFiles) {
        const idx = parseSnapshotIdx(file);
        if (idx === null) continue;
        const raw = JSON.parse(readFileSync(path.join(META_DIR, file), "utf-8"));
        snapshotDataByIdx.set(idx, SnapshotSchema.parse(raw));
    }

    const snapshots = snapshotFiles
        .map((file) => parseSnapshotIdx(file))
        .filter((value): value is number => value !== null)
        .map((idx) => journal.entries.find((entry) => entry.idx === idx)?.tag)
        .filter((value): value is string => Boolean(value));

    const snapshotData = journal.entries
        .map((entry) => snapshotDataByIdx.get(entry.idx))
        .filter((value): value is ReturnType<typeof SnapshotSchema.parse> => Boolean(value));

    return { journal, sqlFiles, snapshots, snapshotIdxOnDisk, snapshotData };
}

function run() {
    console.log("Running migration integrity checks...\n");

    let ctx: MigrationContext;
    try {
        ctx = buildContext();
    } catch (error) {
        console.error("Failed to parse migration files:");
        console.error(error);
        process.exit(1);
    }

    const results = policies.map((policy) => ({
        name: policy.name,
        ...policy.run(ctx),
    }));

    for (const result of results) {
        console.log(`${result.passed ? "OK" : "FAIL"} ${result.name}: ${result.message}`);
    }

    const failed = results.filter((result) => !result.passed);
    if (failed.length > 0) {
        console.error(`\n${failed.length} migration policy check(s) failed.`);
        process.exit(1);
    }

    console.log("\nAll migration integrity policies passed.");
}

run();
