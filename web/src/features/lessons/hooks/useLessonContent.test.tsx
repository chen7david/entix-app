import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LessonVocabRowDto, ObjectiveDto } from "./useLessonContent";
import {
    useAddLessonVocabulary,
    useLessonObjectives,
    useLessonVocabulary,
    useRemoveLessonVocabulary,
    useReorderLessonObjectives,
    useReplaceObjectives,
} from "./useLessonContent";

const mockUseOrganization = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock("@web/src/features/organization", () => ({
    useOrganization: mockUseOrganization,
}));

vi.mock("@web/src/features/auth", () => ({
    useAuth: mockUseAuth,
}));

vi.mock("antd", () => ({
    App: {
        useApp: () => ({
            notification: { success: vi.fn(), error: vi.fn() },
        }),
    },
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return function Wrapper({ children }: PropsWithChildren) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe("useLessonContent hooks", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseOrganization.mockReturnValue({
            activeOrganization: { id: "org_test" },
        });
        mockUseAuth.mockReturnValue({ isAuthenticated: true });
        vi.stubGlobal(
            "fetch",
            vi.fn(() =>
                Promise.resolve(
                    new Response(JSON.stringify([]), {
                        status: 200,
                        headers: { "Content-Type": "application/json" },
                    })
                )
            )
        );
    });

    it("useLessonObjectives calls GET .../objectives", async () => {
        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
        const objectives: ObjectiveDto[] = [];
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify(objectives), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );

        const wrapper = createWrapper();
        const { result } = renderHook(() => useLessonObjectives("org_test", "lesson_test"), {
            wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/orgs/org_test/lessons/lesson_test/objectives",
            expect.objectContaining({ credentials: "include" })
        );
        expect(result.current.data).toEqual(objectives);
    });

    it("useLessonVocabulary calls GET .../vocabulary", async () => {
        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
        const vocab: LessonVocabRowDto[] = [];
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify(vocab), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );

        const wrapper = createWrapper();
        const { result } = renderHook(() => useLessonVocabulary("org_test", "lesson_test"), {
            wrapper,
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/orgs/org_test/lessons/lesson_test/vocabulary",
            expect.objectContaining({ credentials: "include" })
        );
    });

    it("useReplaceObjectives sends PUT and invalidates query on success", async () => {
        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
        const returned: ObjectiveDto[] = [
            {
                id: "obj1",
                lessonId: "lesson_test",
                objective: "A",
                position: 1,
                createdAt: 1,
                updatedAt: 2,
            },
        ];
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify(returned), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );

        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

        function Wrapper({ children }: PropsWithChildren) {
            return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
        }

        const { result } = renderHook(() => useReplaceObjectives(), { wrapper: Wrapper });
        await result.current.mutateAsync({
            organizationId: "org_test",
            lessonId: "lesson_test",
            objectives: ["A"],
        });
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/orgs/org_test/lessons/lesson_test/objectives",
            expect.objectContaining({
                method: "PUT",
                body: JSON.stringify({ objectives: ["A"] }),
            })
        );
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: ["lesson-objectives", "org_test", "lesson_test"],
        });
    });

    it("useAddLessonVocabulary POSTs vocabularyId only", async () => {
        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    lessonId: "lesson_test",
                    vocabularyId: "v1",
                    position: 1,
                    addedAt: 9,
                }),
                {
                    status: 201,
                    headers: { "Content-Type": "application/json" },
                }
            )
        );

        const wrapper = createWrapper();
        const { result } = renderHook(() => useAddLessonVocabulary(), { wrapper });
        await result.current.mutateAsync({
            organizationId: "org_test",
            lessonId: "lesson_test",
            vocabularyId: "v1",
        });
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/orgs/org_test/lessons/lesson_test/vocabulary",
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({ vocabularyId: "v1" }),
            })
        );
    });

    it("useReorderLessonObjectives sends PUT to .../objectives/reorder", async () => {
        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
        const returned: ObjectiveDto[] = [
            {
                id: "obj1",
                lessonId: "lesson_test",
                objective: "B",
                position: 1,
                createdAt: 1,
                updatedAt: 2,
            },
        ];
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify(returned), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            })
        );

        const wrapper = createWrapper();
        const { result } = renderHook(() => useReorderLessonObjectives(), { wrapper });
        await result.current.mutateAsync({
            organizationId: "org_test",
            lessonId: "lesson_test",
            orderedIds: ["obj1"],
        });
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/orgs/org_test/lessons/lesson_test/objectives/reorder",
            expect.objectContaining({
                method: "PUT",
                body: JSON.stringify({ orderedIds: ["obj1"] }),
            })
        );
    });

    it("useRemoveLessonVocabulary sends DELETE to vocab URL", async () => {
        const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

        const wrapper = createWrapper();
        const { result } = renderHook(() => useRemoveLessonVocabulary(), { wrapper });
        await result.current.mutateAsync({
            organizationId: "org_test",
            lessonId: "lesson_test",
            vocabularyId: "vx",
        });
        expect(fetchMock).toHaveBeenCalledWith(
            "/api/v1/orgs/org_test/lessons/lesson_test/vocabulary/vx",
            expect.objectContaining({ method: "DELETE" })
        );
    });
});
