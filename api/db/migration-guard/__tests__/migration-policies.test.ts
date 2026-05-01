import {
    type MigrationContext,
    policies,
} from "@api/db/migration-guard/policies";
import { describe, expect, it } from "vitest";

const baseCtx: MigrationContext = {
    journal: {
        version: "7",
        dialect: "sqlite",
        entries: [
            { idx: 0, when: 1000, tag: "0000_init", breakpoints: true },
            { idx: 1, when: 2000, tag: "0001_add_users", breakpoints: true },
        ],
    },
    sqlFiles: ["0000_init", "0001_add_users"],
    snapshots: ["0000_init", "0001_add_users"],
    snapshotIdxOnDisk: [0, 1],
    snapshotData: [
        {
            id: "aaa",
            prevId: "00000000-0000-0000-0000-000000000000",
            version: "7",
            dialect: "sqlite",
            tables: {},
        },
        {
            id: "bbb",
            prevId: "aaa",
            version: "7",
            dialect: "sqlite",
            tables: {},
        },
    ],
};

const getPolicy = (name: string) => {
    const policy = policies.find((item) => item.name === name);
    if (!policy) {
        throw new Error(`Missing policy: ${name}`);
    }
    return policy;
};

describe("migration policies", () => {
    it("passes all rules on a clean context", () => {
        for (const policy of policies) {
            expect(policy.run(baseCtx).passed).toBe(true);
        }
    });

    it("fails when journal count does not match SQL count", () => {
        const ctx: MigrationContext = { ...baseCtx, sqlFiles: ["0000_init"] };
        const result = getPolicy(
            "Journal entry count matches SQL file count"
        ).run(ctx);
        expect(result.passed).toBe(false);
    });

    it("fails when journal count does not match snapshot count", () => {
        const ctx: MigrationContext = {
            ...baseCtx,
            snapshotIdxOnDisk: [0],
            snapshots: ["0000_init"],
        };
        const result = getPolicy(
            "Journal entry count matches snapshot count"
        ).run(ctx);
        expect(result.passed).toBe(false);
    });

    it("fails on journal idx gap", () => {
        const ctx: MigrationContext = {
            ...baseCtx,
            journal: {
                ...baseCtx.journal,
                entries: [
                    { idx: 0, when: 1000, tag: "0000_init", breakpoints: true },
                    { idx: 2, when: 2000, tag: "0001_add_users", breakpoints: true },
                ],
            },
        };
        const result = getPolicy("Journal idx is sequential with no gaps").run(ctx);
        expect(result.passed).toBe(false);
    });

    it("fails when SQL file is not listed in journal", () => {
        const ctx: MigrationContext = {
            ...baseCtx,
            sqlFiles: ["0000_init", "0002_extra"],
        };
        const result = getPolicy("Every SQL file is listed in journal").run(ctx);
        expect(result.passed).toBe(false);
    });

    it("fails when journal entry does not have SQL file", () => {
        const ctx: MigrationContext = { ...baseCtx, sqlFiles: ["0000_init"] };
        const result = getPolicy("Every journal entry has a matching SQL file").run(ctx);
        expect(result.passed).toBe(false);
    });

    it("fails when snapshot file is not on disk for all entries", () => {
        const ctx: MigrationContext = { ...baseCtx, snapshots: ["0000_init"] };
        const result = getPolicy(
            "Snapshot files exist on disk for all journal entries"
        ).run(ctx);
        expect(result.passed).toBe(false);
    });

    it("fails when snapshot chain is broken", () => {
        const ctx: MigrationContext = {
            ...baseCtx,
            snapshotData: [
                {
                    id: "aaa",
                    prevId: "00000000-0000-0000-0000-000000000000",
                    version: "7",
                    dialect: "sqlite",
                    tables: {},
                },
                {
                    id: "bbb",
                    prevId: "WRONG",
                    version: "7",
                    dialect: "sqlite",
                    tables: {},
                },
            ],
        };
        const result = getPolicy("Snapshot chain is unbroken").run(ctx);
        expect(result.passed).toBe(false);
    });

    it("fails when SQL filename format is invalid", () => {
        const ctx: MigrationContext = {
            ...baseCtx,
            sqlFiles: ["bad-name", "0001_add_users"],
        };
        const result = getPolicy(
            "SQL filenames follow Drizzle naming convention"
        ).run(ctx);
        expect(result.passed).toBe(false);
    });
});
