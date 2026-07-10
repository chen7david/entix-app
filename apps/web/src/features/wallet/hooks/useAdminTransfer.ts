import type { WalletAccountDTO } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { parseApiError } from "@web/src/utils/api";

export const useAdminTransfer = () => {
    const queryClient = useQueryClient();

    const ensureFunding = useMutation({
        mutationFn: async (params: { organizationId: string; currencyId: string }) => {
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.orgs[":organizationId"].currencies[
                ":currencyId"
            ]["ensure-funding"].$post({
                param: { organizationId: params.organizationId, currencyId: params.currencyId },
            });
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
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.orgs[":organizationId"].credit.$post(
                {
                    param: { organizationId: params.organizationId },
                    json: body,
                },
                idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined
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
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.orgs[":organizationId"].debit.$post(
                {
                    param: { organizationId: params.organizationId },
                    json: body,
                },
                idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined
            );
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
            const { id, ...body } = params;
            const api = getApiClient();
            const res = await api.api.v1.admin.finance.accounts[":id"].$patch({
                param: { id },
                json: body,
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
