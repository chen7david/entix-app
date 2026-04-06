import { API_V1 } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

export type AdminCreditInput = {
    organizationId: string;
    categoryId: string;
    platformTreasuryAccountId: string;
    destinationAccountId: string;
    currencyId: string;
    amountCents: number;
    description?: string;
};

export const useAdminCredit = () => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: AdminCreditInput) => {
            const res = await fetch(`${API_V1}/admin/finance/orgs/${input.organizationId}/credit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(input),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Credit failed");
            }

            return res.json();
        },
        onSuccess: (_, vars) => {
            notification.success({
                message: "Credit Successful",
                description: "The account has been credited successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["adminOrgAccounts", vars.organizationId] });
            queryClient.invalidateQueries({ queryKey: ["treasuryBalance"] });
        },
        onError: (error) => {
            notification.error({
                message: "Credit Failed",
                description: error.message,
            });
        },
    });
};
