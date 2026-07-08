import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLessonVocabularyBankItems } from "../useLessonVocabularyBankItems";

const mockFetchVocabularyBankItem = vi.hoisted(() => vi.fn());

vi.mock("@web/src/features/lessons/hooks/useLessonContent", () => ({
    fetchVocabularyBankItem: mockFetchVocabularyBankItem,
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return function Wrapper({ children }: PropsWithChildren) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe("useLessonVocabularyBankItems", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not fetch when organizationId is missing", () => {
        const wrapper = createWrapper();
        renderHook(
            () =>
                useLessonVocabularyBankItems({
                    organizationId: undefined,
                    lessonId: "lesson_1",
                    vocabularyRows: [{ vocabularyId: "v1", position: 1, addedAt: 1 }],
                    itemIdPrefix: "lesson",
                }),
            { wrapper }
        );
        expect(mockFetchVocabularyBankItem).not.toHaveBeenCalled();
    });

    it("fetches bank items and builds table rows", async () => {
        mockFetchVocabularyBankItem.mockResolvedValue({
            id: "v1",
            text: "hello",
            zhTranslation: null,
            pinyin: null,
            ipaUs: null,
            syllablesEn: null,
            syllablesIpa: null,
            definitionSimple: null,
            enAudioUrl: null,
            zhAudioUrl: null,
            status: "active",
            createdAt: 1,
            updatedAt: 1,
        });

        const wrapper = createWrapper();
        const { result } = renderHook(
            () =>
                useLessonVocabularyBankItems({
                    organizationId: "org_1",
                    lessonId: "lesson_1",
                    vocabularyRows: [{ vocabularyId: "v1", position: 1, addedAt: 42 }],
                    itemIdPrefix: "lesson-study",
                }),
            { wrapper }
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(mockFetchVocabularyBankItem).toHaveBeenCalledWith("org_1", "v1");
        expect(result.current.tableItems).toHaveLength(1);
        expect(result.current.tableItems[0]?.id).toBe("lesson-study:lesson_1:v1");
        expect(result.current.tableItems[0]?.vocabulary.text).toBe("hello");
    });
});
