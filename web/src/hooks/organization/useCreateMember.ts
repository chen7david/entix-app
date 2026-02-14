import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateMemberDTO, CreateMemberResponseDTO } from "@shared/schemas/dto/member.dto";
import { message } from "antd";

export const useCreateMember = (organizationId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values: CreateMemberDTO) => {
            const response = await fetch(`/api/v1/organizations/${organizationId}/members`, {
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
            queryClient.invalidateQueries({ queryKey: ["members", organizationId] });
            message.success("Member created successfully! Password reset email sent.");
        },
        onError: (error: Error) => {
            message.error(error.message || "Failed to create member");
        },
    });
};
