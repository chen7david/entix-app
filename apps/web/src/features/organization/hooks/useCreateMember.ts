import type { CreateMemberDTO, CreateMemberResponseDTO } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { App } from "antd";

export const useCreateMember = (organizationId: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (values: CreateMemberDTO) => {
            const api = getApiClient();
            const response = await api.api.v1.orgs[":organizationId"].members.$post({
                param: { organizationId },
                json: values,
            });
            return hcJson<CreateMemberResponseDTO>(response);
        },
        onSuccess: () => {
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
