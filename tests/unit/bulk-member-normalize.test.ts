import { normalizeBulkMemberRaw, normalizeBulkMembersRaw } from "@shared/utils/bulk-member";
import { describe, expect, it } from "vitest";

describe("normalizeBulkMemberRaw", () => {
    it("maps legacy phoneNumbers/socialMedia and member role", () => {
        const normalized = normalizeBulkMemberRaw({
            email: "a@example.com",
            name: "A",
            role: "member",
            phoneNumbers: [{ countryCode: "+1", number: "555", label: "Mobile", extension: "" }],
            socialMedia: [{ type: "GitHub", urlOrHandle: "a" }],
            avatarUrl: "",
        }) as Record<string, unknown>;

        expect(normalized.role).toBe("student");
        expect(normalized.phones).toEqual([
            { countryCode: "+1", number: "555", label: "Mobile", extension: null },
        ]);
        expect(normalized.socials).toEqual([{ type: "GitHub", urlOrHandle: "a" }]);
        expect(normalized.phoneNumbers).toBeUndefined();
        expect(normalized.socialMedia).toBeUndefined();
        expect(normalized.avatarUrl).toBeNull();
    });

    it("rejects non-array payloads", () => {
        expect(() => normalizeBulkMembersRaw({ members: [] })).toThrow(
            /JSON must be an array of members/
        );
    });
});
