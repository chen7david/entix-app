import type { SessionVocabularyItemDTO } from "@web/src/features/vocabulary/hooks/useVocabulary";
import { describe, expect, it } from "vitest";
import {
    countUniqueVocabularyWords,
    dedupeSessionVocabularyByWord,
} from "./sessionVocabularyDisplay";

function makeItem(assignmentId: string, vocabId: string, word: string): SessionVocabularyItemDTO {
    const now = Date.now();
    return {
        id: assignmentId,
        userId: `user-${assignmentId}`,
        orgId: "org-1",
        attendanceId: `att-${assignmentId}`,
        createdAt: now,
        vocabulary: {
            id: vocabId,
            text: word,
            zhTranslation: null,
            pinyin: null,
            enAudioUrl: null,
            zhAudioUrl: null,
            status: "new",
            createdAt: now,
            updatedAt: now,
        },
    };
}

describe("sessionVocabularyDisplay", () => {
    it("dedupes by vocabulary id and counts assignments", () => {
        const items = [
            makeItem("a1", "v-w", "hello"),
            makeItem("a2", "v-w", "hello"),
            makeItem("a3", "v-x", "world"),
        ];
        const out = dedupeSessionVocabularyByWord(items);
        expect(out).toHaveLength(2);
        const hello = out.find((row) => row.vocabulary.text === "hello");
        expect(hello?.assignedStudentCount).toBe(2);
        const world = out.find((row) => row.vocabulary.text === "world");
        expect(world?.assignedStudentCount).toBe(1);
    });

    it("countUniqueVocabularyWords matches dedupe length", () => {
        const items = [
            makeItem("a1", "v-w", "hello"),
            makeItem("a2", "v-w", "hello"),
            makeItem("a3", "v-x", "world"),
        ];
        expect(countUniqueVocabularyWords(items)).toBe(dedupeSessionVocabularyByWord(items).length);
    });
});
