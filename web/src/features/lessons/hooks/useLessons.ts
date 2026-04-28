import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    createdAt: number;
    updatedAt: number;
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

export function useLessons() {
    const { activeOrganization } = useOrganization();
    const { isAuthenticated, isStaff } = useAuth();
    const queryClient = useQueryClient();
    const { notification } = App.useApp();
    const organizationId = activeOrganization?.id;

    const listQuery = useQuery({
        queryKey: ["lessons", organizationId],
        enabled: !!organizationId && isAuthenticated,
        staleTime: QUERY_STALE_MS,
        queryFn: async () => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].lessons.$get({
                param: { organizationId },
            });
            return hcJson<LessonDto[]>(res);
        },
    });

    const createLesson = useMutation({
        mutationFn: async (payload: { title: string; description?: string | null }) => {
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

    const updateLesson = useMutation({
        mutationFn: async (payload: {
            lessonId: string;
            title?: string;
            description?: string | null;
        }) => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].lessons[":lessonId"].$patch({
                param: { organizationId, lessonId: payload.lessonId },
                json: {
                    title: payload.title,
                    description: payload.description,
                },
            });
            return hcJson<LessonDto>(res);
        },
        onSuccess: () => {
            notification.success({ message: "Lesson updated" });
            queryClient.invalidateQueries({ queryKey: ["lessons", organizationId] });
        },
    });

    const deleteLesson = useMutation({
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
        lessons: listQuery.data ?? [],
        isLoadingLessons: listQuery.isLoading,
        createLesson,
        updateLesson,
        deleteLesson,
        myEnrollments: dashboardQuery.data ?? [],
        isLoadingMyEnrollments: dashboardQuery.isLoading,
    };
}
