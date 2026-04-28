import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { DEFAULT_PAGE_SIZE } from "@web/src/components/data/DataTable.types";
import { useAuth } from "@web/src/features/auth";
import { useOrganization } from "@web/src/features/organization";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { App } from "antd";

export type LessonDto = {
    id: string;
    organizationId: string;
    title: string;
    description: string | null;
    coverArtUrl: string | null;
    createdAt: number;
    updatedAt: number;
};

export type LessonFilters = {
    search?: string;
    hasCoverArt?: "all" | "with" | "without";
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
};

export type EnrollmentDashboardDto = {
    sessionId: string;
    lessonTitle: string;
    startTime: string;
    endTime: string;
    teacherName: string;
    sessionStatus: "scheduled" | "completed" | "cancelled";
    enrollmentStatus: string;
};

type LessonListResponse = {
    items: LessonDto[];
    nextCursor: string | null;
    prevCursor: string | null;
};

export function useLessons() {
    const { activeOrganization } = useOrganization();
    const { isAuthenticated, isStaff } = useAuth();
    const organizationId = activeOrganization?.id;

    const dashboardQuery = useQuery({
        queryKey: ["lesson-enrollments-me", organizationId],
        enabled: !!organizationId && isAuthenticated && !isStaff,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].enrollments.me.$get({
                param: { organizationId },
            });
            return hcJson<EnrollmentDashboardDto[]>(res);
        },
    });

    return {
        createLesson: useCreateLesson(),
        updateLesson: useUpdateLesson(),
        deleteLesson: useDeleteLesson(),
        myEnrollments: dashboardQuery.data ?? [],
        isLoadingMyEnrollments: dashboardQuery.isLoading,
    };
}

export function useLessonLibrary(filters?: LessonFilters) {
    const { activeOrganization } = useOrganization();
    const { isAuthenticated } = useAuth();
    const organizationId = activeOrganization?.id;

    const query = useQuery({
        queryKey: ["lessons", organizationId, filters],
        enabled: !!organizationId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].lessons.$get({
                param: { organizationId },
                query: {
                    search: filters?.search,
                    hasCoverArt:
                        filters?.hasCoverArt && filters.hasCoverArt !== "all"
                            ? filters.hasCoverArt
                            : undefined,
                    cursor: filters?.cursor,
                    limit: filters?.limit ?? DEFAULT_PAGE_SIZE,
                    direction: filters?.direction ?? "next",
                },
            });
            return hcJson<{
                items: LessonDto[];
                nextCursor: string | null;
                prevCursor: string | null;
            }>(res);
        },
    });

    return {
        lessons: query.data?.items ?? [],
        nextCursor: query.data?.nextCursor ?? null,
        prevCursor: query.data?.prevCursor ?? null,
        isLoadingLessons: query.isLoading,
    };
}

export function useCreateLesson() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (payload: {
            title: string;
            description?: string | null;
            coverArtUploadId?: string;
        }) => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].lessons.$post({
                param: { organizationId },
                json: payload,
            });
            return hcJson<LessonDto>(res);
        },
        onSuccess: () => {
            notification.success({ message: "Lesson created" });
            queryClient.invalidateQueries({ queryKey: ["lessons", organizationId] });
        },
    });
}

export function useUpdateLesson() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (payload: {
            lessonId: string;
            title?: string;
            description?: string | null;
            coverArtUploadId?: string;
        }) => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].lessons[":lessonId"].$patch({
                param: { organizationId, lessonId: payload.lessonId },
                json: {
                    title: payload.title,
                    description: payload.description,
                    coverArtUploadId: payload.coverArtUploadId,
                },
            });
            return hcJson<LessonDto>(res);
        },
        onSuccess: () => {
            notification.success({ message: "Lesson updated" });
            queryClient.invalidateQueries({ queryKey: ["lessons", organizationId] });
        },
    });
}

export function useDeleteLesson() {
    const { activeOrganization } = useOrganization();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();
    const { notification } = App.useApp();

    return useMutation({
        mutationFn: async (lessonId: string) => {
            const api = getApiClient();
            await api.api.v1.orgs[":organizationId"].lessons[":lessonId"].$delete({
                param: { organizationId, lessonId },
            });
        },
        onSuccess: () => {
            notification.success({ message: "Lesson deleted" });
            queryClient.invalidateQueries({ queryKey: ["lessons", organizationId] });
        },
    });
}

export function useLessonOptions(searchQuery: string) {
    const { activeOrganization } = useOrganization();
    const { isAuthenticated } = useAuth();
    const organizationId = activeOrganization?.id;

    const query = useInfiniteQuery({
        queryKey: ["lesson-options", organizationId, searchQuery],
        enabled: !!organizationId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        placeholderData: keepPreviousData,
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: LessonListResponse) => lastPage.nextCursor ?? undefined,
        queryFn: async ({ pageParam }) => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].lessons.$get({
                param: { organizationId },
                query: {
                    limit: 25,
                    direction: "next",
                    cursor: pageParam,
                    search: searchQuery || undefined,
                },
            });
            return hcJson<LessonListResponse>(res);
        },
    });

    return {
        lessons: query.data?.pages.flatMap((page: LessonListResponse) => page.items) ?? [],
        isLoading: query.isLoading,
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
    };
}
