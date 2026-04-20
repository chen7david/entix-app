import type { PaginatedResponse, UploadDto } from "@shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

            const params = new URLSearchParams();
            if (filters?.search) params.append("search", filters.search);
            if (filters?.type && filters.type !== "all") params.append("type", filters.type);
            if (filters?.cursor) params.append("cursor", filters.cursor);
            if (filters?.limit) params.append("limit", filters.limit.toString());
            if (filters?.direction) params.append("direction", filters.direction);

            const queryString = params.toString() ? `?${params.toString()}` : "";
            const response = await fetch(`/api/v1/orgs/${organizationId}/uploads${queryString}`);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || "Failed to fetch uploads");
            }

            return response.json() as Promise<PaginatedResponse<UploadDto>>;
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
            const response = await fetch(`/api/v1/orgs/${organizationId}/uploads/${uploadId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                // Return 404 or 403 nicely
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
