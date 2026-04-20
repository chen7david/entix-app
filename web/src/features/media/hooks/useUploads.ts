import type { PaginatedResponse, UploadDto } from "@shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { App } from "antd";

export type UploadFilters = {
    search?: string;
    type?: string;
    cursor?: string;
    limit?: number;
    direction?: "next" | "prev";
};

export const useOrganizationUploads = (
    organizationId: string | undefined,
    filters?: UploadFilters
) => {
    return useQuery({
        queryKey: ["organizationUploads", organizationId, filters],
        queryFn: async () => {
            if (!organizationId) throw new Error("Organization ID is required");

            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].uploads.$get({
                param: { organizationId },
                query: {
                    search: filters?.search,
                    type: filters?.type && filters.type !== "all" ? filters.type : undefined,
                    cursor: filters?.cursor,
                    limit: filters?.limit,
                    direction: filters?.direction,
                },
            });
            return hcJson<PaginatedResponse<UploadDto>>(res);
        },
        enabled: !!organizationId,
        staleTime: QUERY_STALE_MS,
        placeholderData: (previousData) => previousData,
    });
};

export const useDeleteUpload = (organizationId: string | undefined) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (uploadId: string) => {
            if (!organizationId) throw new Error("Organization ID is required");
            const api = getApiClient();
            const response = await api.api.v1.orgs[":organizationId"].uploads[":uploadId"].$delete({
                param: { organizationId, uploadId },
            });

            if (!response.ok) {
                if (response.status !== 404 && response.status !== 204) {
                    const error = await response.text();
                    throw new Error(error || "Failed to delete upload");
                }
            }

            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizationUploads", organizationId] });
            notification.success({
                message: "File Deleted",
                description: "The file has been deleted successfully.",
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Deletion Failed",
                description: error.message || "Failed to delete file",
            });
        },
    });
};
