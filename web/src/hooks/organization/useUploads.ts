import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";

export interface Upload {
    id: string;
    originalName: string;
    bucketKey: string;
    url: string;
    fileSize: number;
    contentType: string;
    status: "pending" | "completed" | "failed";
    organizationId: string;
    uploadedBy: string;
    createdAt: number;
    updatedAt: number;
}

export const useOrganizationUploads = (organizationId: string | undefined) => {
    return useQuery({
        queryKey: ["organizationUploads", organizationId],
        queryFn: async () => {
            if (!organizationId) throw new Error("Organization ID is required");
            const response = await fetch(`/api/v1/orgs/${organizationId}/uploads`);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || "Failed to fetch uploads");
            }

            return response.json() as Promise<Upload[]>;
        },
        enabled: !!organizationId,
    });
};

export const useDeleteUpload = (organizationId: string | undefined) => {
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
            message.success("File deleted successfully");
        },
        onError: (error: Error) => {
            message.error(error.message || "Failed to delete file");
        },
    });
};
