import { describe, expect, it } from "vitest";
import {
    clearSessionPointsDraft,
    getSessionPointsDraftKey,
    loadSessionPointsDraft,
    loadSessionPointsDraftMigrating,
    saveSessionPointsDraft,
} from "./sessionPointsDraft";

describe("sessionPointsDraft", () => {
    it("saves and loads non-zero staged deltas", () => {
        const storage = window.localStorage;
        const orgId = "org-1";
        const sessionId = "session-1";
        clearSessionPointsDraft(storage, orgId, sessionId);

        saveSessionPointsDraft(storage, orgId, sessionId, {
            user1: 3,
            user2: 0,
            user3: -2,
        });

        expect(loadSessionPointsDraft(storage, orgId, sessionId)).toEqual({
            user1: 3,
            user3: -2,
        });
    });

    it("clears stored draft state", () => {
        const storage = window.localStorage;
        const orgId = "org-clear";
        const sessionId = "session-clear";
        saveSessionPointsDraft(storage, orgId, sessionId, { user1: 1 });

        clearSessionPointsDraft(storage, orgId, sessionId);
        expect(storage.getItem(getSessionPointsDraftKey(orgId, sessionId))).toBeNull();
    });

    it("migrates legacy org-id draft under slug when slug draft is empty", () => {
        const storage = window.localStorage;
        const slug = "my-org-slug";
        const orgId = "org-uuid-legacy";
        const sessionId = "sess-migrate";

        saveSessionPointsDraft(storage, orgId, sessionId, { alice: 2 });

        expect(loadSessionPointsDraft(storage, slug, sessionId)).toEqual({});

        const migrated = loadSessionPointsDraftMigrating(storage, slug, orgId, sessionId);
        expect(migrated).toEqual({ alice: 2 });
        expect(loadSessionPointsDraft(storage, slug, sessionId)).toEqual({ alice: 2 });
        expect(loadSessionPointsDraft(storage, orgId, sessionId)).toEqual({});
    });
});
