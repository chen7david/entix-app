import { API_V1, FINANCIAL_CATEGORIES, getTreasuryAccountId } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";

type AdminAdjustment = {
    organizationId: string;
    accountId: string;
    amountCents: number;
    currencyId: string;
    description: string;
    type: "credit" | "debit";
    platformTreasuryAccountId?: string;
};

export const useAdminAdjustWallet = (orgId?: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: AdminAdjustment) => {
            if (!orgId) throw new Error("Organization ID required");

            const endpoint = input.type === "credit" ? "credit" : "debit";
            const url = `${API_V1}/admin/finance/orgs/${orgId}/${endpoint}`;

            // Use provided counterparty account (e.g. Org Funding) or fallback to global Treasury
            const resolvedTreasuryId =
                input.platformTreasuryAccountId || getTreasuryAccountId(input.currencyId);

            const body =
                input.type === "credit"
                    ? {
                          categoryId: FINANCIAL_CATEGORIES.INTERNAL_TRANSFER,
                          platformTreasuryAccountId: resolvedTreasuryId,
                          destinationAccountId: input.accountId,
                          currencyId: input.currencyId,
                          amountCents: input.amountCents,
                          description: input.description,
                      }
                    : {
                          categoryId: FINANCIAL_CATEGORIES.INTERNAL_TRANSFER,
                          sourceAccountId: input.accountId,
                          platformTreasuryAccountId: resolvedTreasuryId,
                          currencyId: input.currencyId,
                          amountCents: input.amountCents,
                          description: input.description,
                      };

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || `Failed to execute admin ${input.type}`);
            }

            return res.json();
        },
        onSuccess: (_, variables) => {
            message.success(`Member wallet ${variables.type}ed successfully`);
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
            queryClient.invalidateQueries({ queryKey: ["transactions", orgId] });
        },
        onError: (error: Error) => {
            message.error(error.message);
        },
    });
};
