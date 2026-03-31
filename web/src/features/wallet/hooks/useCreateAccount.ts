import { API_V1 } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

export type CreateAccountInput = {
    name: string;
    currencyId: string;
    ownerType: "user" | "org";
    ownerId: string;
};

export const useCreateAccount = (orgId?: string) => {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateAccountInput) => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${orgId}/wallet/accounts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            if (!res.ok) throw new Error("Failed to create account");
            return res.json();
        },
        onSuccess: () => {
            message.success("Account created successfully");
            queryClient.invalidateQueries({ queryKey: ["walletBalance", orgId] });
        },
        onError: () => {
            message.error("Failed to create account. Please try again.");
        },
    });
};
