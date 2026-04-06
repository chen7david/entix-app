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
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateAccountInput) => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${orgId}/finance/accounts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create account");
            return data;
        },
        onSuccess: () => {
            notification.success({
                message: "Account Created",
                description: "Your new financial account has been created successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["walletBalance", orgId] });
            queryClient.invalidateQueries({ queryKey: ["orgCurrencies", orgId] });
        },
        onError: (err: any) => {
            notification.error({
                message: "Creation Failed",
                description: err.message || "Failed to create account. Please try again.",
            });
        },
    });
};
