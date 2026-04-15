import { API_V1, type WalletAccountDTO } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parseApiError } from "@web/src/utils/api";

export const useAdminTransfer = () => {
    const queryClient = useQueryClient();

    const ensureFunding = useMutation({
        mutationFn: async (params: { organizationId: string; currencyId: string }) => {
            const res = await fetch(
                `${API_V1}/admin/finance/orgs/${params.organizationId}/currencies/${params.currencyId}/ensure-funding`,
                { method: "POST" }
            );
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as { data: WalletAccountDTO };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminOrgAccounts"] });
        },
    });

    const credit = useMutation({
        mutationFn: async (params: {
            organizationId: string;
            categoryId: string;
            platformTreasuryAccountId: string;
            destinationAccountId: string;
            currencyId: string;
            amountCents: number;
            description?: string;
            idempotencyKey?: string;
        }) => {
            const { idempotencyKey, ...body } = params;
            const res = await fetch(
                `${API_V1}/admin/finance/orgs/${params.organizationId}/credit`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
                    },
                    body: JSON.stringify(body),
                }
            );
            if (!res.ok) await parseApiError(res);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["treasuryBalance"] });
            queryClient.invalidateQueries({ queryKey: ["adminOrgAccounts"] });
        },
    });

    const debit = useMutation({
        mutationFn: async (params: {
            organizationId: string;
            categoryId: string;
            sourceAccountId: string;
            platformTreasuryAccountId: string;
            currencyId: string;
            amountCents: number;
            description?: string;
            idempotencyKey?: string;
        }) => {
            const { idempotencyKey, ...body } = params;
            const res = await fetch(`${API_V1}/admin/finance/orgs/${params.organizationId}/debit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) await parseApiError(res);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["treasuryBalance"] });
            queryClient.invalidateQueries({ queryKey: ["adminOrgAccounts"] });
        },
    });

    const updateAccount = useMutation({
        mutationFn: async (params: {
            id: string;
            name?: string;
            overdraftLimitCents?: number | null;
        }) => {
            const res = await fetch(`${API_V1}/admin/finance/accounts/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });
            if (!res.ok) await parseApiError(res);
            return (await res.json()) as { data: WalletAccountDTO };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["treasuryBalance"] });
            queryClient.invalidateQueries({ queryKey: ["adminOrgAccounts"] });
        },
    });

    return { ensureFunding, credit, debit, updateAccount };
};
