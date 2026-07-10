import { useQueries } from "@tanstack/react-query";
import { fetchVocabularyBankItem } from "@web/src/features/lessons/hooks/useLessonContent";
import type {
    SessionVocabularyItemDTO,
    VocabularyItemDTO,
} from "@web/src/features/vocabulary/hooks/useVocabulary";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { queryKeys } from "@web/src/lib/query-keys";
import { useMemo } from "react";

export type LessonVocabularyLinkRow = {
    vocabularyId: string;
    position: number;
    addedAt: number;
};

type UseLessonVocabularyBankItemsOptions = {
    organizationId: string | undefined;
    lessonId: string | undefined;
    vocabularyRows: LessonVocabularyLinkRow[];
    /** Prefix for synthetic session-vocabulary row ids (e.g. `lesson` or `lesson-study`). */
    itemIdPrefix: string;
    enabled?: boolean;
};

/**
 * Resolves lesson-linked vocabulary IDs to full bank rows (parallel queries).
 * Shared by lesson edit and study views.
 */
export function useLessonVocabularyBankItems({
    organizationId,
    lessonId,
    vocabularyRows,
    itemIdPrefix,
    enabled = true,
}: UseLessonVocabularyBankItemsOptions) {
    const sortedRows = useMemo(
        () => [...vocabularyRows].sort((a, b) => a.position - b.position),
        [vocabularyRows]
    );

    const bankQueries = useQueries({
        queries: sortedRows.map((row) => ({
            queryKey: queryKeys.vocabulary.bankItem(organizationId ?? "", row.vocabularyId),
            queryFn: () => {
                if (!organizationId) {
                    throw new Error("organizationId is required to fetch vocabulary bank items");
                }
                return fetchVocabularyBankItem(organizationId, row.vocabularyId);
            },
            enabled: !!organizationId && !!lessonId && enabled,
            staleTime: QUERY_STALE_MS,
        })),
    });

    const isLoading = sortedRows.length > 0 && bankQueries.some((q) => q.isPending);

    const bankItemsByVocabularyId = useMemo(() => {
        const map = new Map<string, VocabularyItemDTO>();
        for (let i = 0; i < sortedRows.length; i++) {
            const row = sortedRows[i];
            const data = bankQueries[i]?.data;
            if (row && data) {
                map.set(row.vocabularyId, data);
            }
        }
        return map;
    }, [sortedRows, bankQueries]);

    const tableItems = useMemo((): SessionVocabularyItemDTO[] => {
        if (!organizationId || !lessonId) return [];
        const out: SessionVocabularyItemDTO[] = [];
        for (const row of sortedRows) {
            const vocab = bankItemsByVocabularyId.get(row.vocabularyId);
            if (!vocab) continue;
            out.push({
                id: `${itemIdPrefix}:${lessonId}:${row.vocabularyId}`,
                userId: "",
                organizationId,
                attendanceId: "",
                createdAt: row.addedAt,
                vocabulary: vocab,
            });
        }
        return out;
    }, [sortedRows, bankItemsByVocabularyId, organizationId, lessonId, itemIdPrefix]);

    return {
        sortedRows,
        bankQueries,
        isLoading,
        bankItemsByVocabularyId,
        tableItems,
    };
}
