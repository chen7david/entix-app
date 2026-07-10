import { UnprocessableEntityError } from "@api/errors/app.error";
import { assertOrderedIdsMatchCurrent } from "@api/services/lessons/lesson-content.service";
import { describe, expect, it } from "vitest";

describe("assertOrderedIdsMatchCurrent", () => {
    it("rejects duplicate ids", () => {
        expect(() => assertOrderedIdsMatchCurrent(["a", "b"], ["a", "a"])).toThrow(
            UnprocessableEntityError
        );
    });

    it("rejects length mismatch", () => {
        expect(() => assertOrderedIdsMatchCurrent(["a", "b"], ["a"])).toThrow(
            UnprocessableEntityError
        );
    });

    it("rejects ids that do not match current set", () => {
        expect(() => assertOrderedIdsMatchCurrent(["a", "b"], ["a", "c"])).toThrow(
            UnprocessableEntityError
        );
    });

    it("accepts a valid reorder", () => {
        expect(() => assertOrderedIdsMatchCurrent(["a", "b"], ["b", "a"])).not.toThrow();
    });
});
