import type { z } from "zod";
import {
    JournalSchema,
    MigrationTagSchema,
    SnapshotSchema,
} from "./meta.schemas";

export interface MigrationContext {
    journal: z.infer<typeof JournalSchema>;
    sqlFiles: string[];
    snapshots: string[];
    snapshotIdxOnDisk: number[];
    snapshotData: z.infer<typeof SnapshotSchema>[];
}

export type PolicyResult = { passed: boolean; message: string };
export type Policy = { name: string; run: (ctx: MigrationContext) => PolicyResult };

const getPrevSnapshotId = (snapshot: z.infer<typeof SnapshotSchema>) =>
    snapshot.prevId ?? snapshot.prevSnapshot ?? "";

export const policies: Policy[] = [
    {
        name: "Journal entry count matches SQL file count",
        run: ({ journal, sqlFiles }) => ({
            passed: journal.entries.length === sqlFiles.length,
            message: `${journal.entries.length} journal entries vs ${sqlFiles.length} SQL files`,
        }),
    },
    {
        name: "Journal entry count matches snapshot count",
        run: ({ journal, snapshotIdxOnDisk }) => ({
            passed: journal.entries.length === snapshotIdxOnDisk.length,
            message: `${journal.entries.length} journal entries vs ${snapshotIdxOnDisk.length} snapshots`,
        }),
    },
    {
        name: "Journal idx is sequential with no gaps",
        run: ({ journal }) => {
            const bad = journal.entries.find((entry, index) => entry.idx !== index);
            return {
                passed: !bad,
                message: bad
                    ? `Gap found: idx ${bad.idx} at position ${journal.entries.indexOf(bad)}`
                    : "OK",
            };
        },
    },
    {
        name: "Every SQL file is listed in journal",
        run: ({ journal, sqlFiles }) => {
            const tags = new Set(journal.entries.map((entry) => entry.tag));
            const missing = sqlFiles.filter((file) => !tags.has(file));
            return {
                passed: missing.length === 0,
                message: missing.length ? `Not in journal: ${missing.join(", ")}` : "OK",
            };
        },
    },
    {
        name: "Every journal entry has a matching SQL file",
        run: ({ journal, sqlFiles }) => {
            const sqlSet = new Set(sqlFiles);
            const missing = journal.entries.filter((entry) => !sqlSet.has(entry.tag));
            return {
                passed: missing.length === 0,
                message: missing.length
                    ? `Missing SQL for: ${missing.map((entry) => entry.tag).join(", ")}`
                    : "OK",
            };
        },
    },
    {
        name: "Snapshot files exist on disk for all journal entries",
        run: ({ journal, snapshots }) => {
            const snapSet = new Set(snapshots);
            const missing = journal.entries.filter((entry) => !snapSet.has(entry.tag));
            return {
                passed: missing.length === 0,
                message: missing.length
                    ? `Snapshots not on disk (may not be committed): ${missing.map((entry) => entry.tag).join(", ")}`
                    : "OK",
            };
        },
    },
    {
        name: "Snapshot chain is unbroken",
        run: ({ snapshotData }) => {
            for (let index = 1; index < snapshotData.length; index++) {
                const prev = snapshotData[index - 1];
                const curr = snapshotData[index];
                if (getPrevSnapshotId(curr) !== prev.id) {
                    return {
                        passed: false,
                        message: `Chain broken at index ${index}: expected "${prev.id}", got "${getPrevSnapshotId(curr)}"`,
                    };
                }
            }
            return { passed: true, message: "OK" };
        },
    },
    {
        name: "SQL filenames follow Drizzle naming convention",
        run: ({ sqlFiles }) => {
            const bad = sqlFiles.filter(
                (file) => !MigrationTagSchema.safeParse(file).success
            );
            return {
                passed: bad.length === 0,
                message: bad.length ? `Invalid names: ${bad.join(", ")}` : "OK",
            };
        },
    },
];
