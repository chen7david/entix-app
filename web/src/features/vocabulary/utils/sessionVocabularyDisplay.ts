import type { SessionVocabularyItemDTO } from "@web/src/features/vocabulary/hooks/useVocabulary";

/** Rows returned per vocabulary-word assignment; adding “hello” creates one row per enrolled student. */
export type UniqueWordDisplayRow = SessionVocabularyItemDTO & {
    assignedStudentCount: number;
};

export function dedupeSessionVocabularyByWord(
    items: SessionVocabularyItemDTO[]
): UniqueWordDisplayRow[] {
    const map = new Map<string, { representative: SessionVocabularyItemDTO; count: number }>();
    for (const item of items) {
        const vocabId = item.vocabulary.id;
        const existing = map.get(vocabId);
        if (!existing) {
            map.set(vocabId, { representative: item, count: 1 });
        } else {
            existing.count++;
        }
    }
    return [...map.values()].map(({ representative, count }) => ({
        ...representative,
        assignedStudentCount: count,
    }));
}

export function countUniqueVocabularyWords(items: SessionVocabularyItemDTO[]): number {
    return new Set(items.map((item) => item.vocabulary.id)).size;
}
