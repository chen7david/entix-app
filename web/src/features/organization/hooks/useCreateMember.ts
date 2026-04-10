import type { CreateMemberDTO, CreateMemberResponseDTO } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

export const useCreateMember = (organizationId: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values: CreateMemberDTO) => {
            const response = await fetch(`/api/v1/orgs/${organizationId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to create member");
            }

            return response.json() as Promise<CreateMemberResponseDTO>;
        },
        onSuccess: () => {
            // Invalidate members query to refetch the list
            // Must match the key in useOrganization.ts line 34
            queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });
            notification.success({
                message: "Member Created",
                description: "Member created successfully! Password reset email has been sent.",
            });
        },
        onError: (error: Error) => {
            notification.error({
                message: "Creation Failed",
                description: error.message || "Failed to create member",
            });
        },
    });
};
