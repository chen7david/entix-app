import { describe, expect, it } from "vitest";
import {
    getSessionPointsDraftKey,
    loadSessionPointsDraftMigrating,
    saveSessionPointsDraft,
} from "./sessionPointsDraft";

describe("sessionPointsDraft", () => {
    it("uses slug scope consistently for save and load", () => {
        const storage = {
            store: {} as Record<string, string>,
            getItem(key: string) {
                return this.store[key] ?? null;
            },
            setItem(key: string, value: string) {
                this.store[key] = value;
            },
            removeItem(key: string) {
                delete this.store[key];
            },
        };

        const slug = "my-org";
        const orgId = "org-uuid-123";
        const sessionId = "session-1";

        const scopeKey = slug ?? orgId;
        saveSessionPointsDraft(storage, scopeKey, sessionId, { userA: 1, userB: 2 });

        const loaded = loadSessionPointsDraftMigrating(storage, slug, orgId, sessionId);
        expect(loaded).toEqual({ userA: 1, userB: 2 });
        expect(storage.getItem(getSessionPointsDraftKey(orgId, sessionId))).toBeNull();
    });

    it("migrates legacy org-id scoped drafts to slug scope", () => {
        const storage = {
            store: {} as Record<string, string>,
            getItem(key: string) {
                return this.store[key] ?? null;
            },
            setItem(key: string, value: string) {
                this.store[key] = value;
            },
            removeItem(key: string) {
                delete this.store[key];
            },
        };

        const slug = "my-org";
        const orgId = "org-uuid-123";
        const sessionId = "session-1";

        saveSessionPointsDraft(storage, orgId, sessionId, { userB: 3 });
        const loaded = loadSessionPointsDraftMigrating(storage, slug, orgId, sessionId);

        expect(loaded).toEqual({ userB: 3 });
        expect(storage.getItem(getSessionPointsDraftKey(slug, sessionId))).not.toBeNull();
        expect(storage.getItem(getSessionPointsDraftKey(orgId, sessionId))).toBeNull();
    });
});
