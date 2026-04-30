import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_ANALYTICS_MS } from "@web/src/lib/query-config";
import { App } from "antd";

export type BulkMetrics = {
    totalStorage: number;
    activeSessions: number;
    engagementRisk: number;
    totalMembers: number;
    adminCount: number;
    ownerCount: number;
    upcomingBirthdays: {
        userId: string;
        name: string;
        birthDate: string;
        daysUntil: number;
    }[];
    paymentReadiness: {
        totalStudents: number;
        missingWalletCount: number;
        missingEtdWalletCount: number;
        missingBillingPlanCount: number;
        missingBothCount: number;
        membersNeedingSetup: {
            userId: string;
            name: string;
            role: string;
            avatarUrl?: string | null;
            hasWallet: boolean;
            hasEtdWallet: boolean;
            hasBillingPlan: boolean;
        }[];
    };
};

export type ImportResult = {
    total: number;
    created: number;
    linked: number;
    walletInitialized: number;
    billingAssigned: number;
    failed: number;
    errors: string[];
};

export type BulkImportPayload = {
    members: any[];
    importOptions: {
        defaultBillingPlanId: string;
        billingPlanConflict: "replace" | "skip";
    };
};

export const useBulkMembers = (orgId?: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    const {
        data: metrics,
        isLoading: isLoadingMetrics,
        isFetching: isFetchingMetrics,
        dataUpdatedAt: metricsUpdatedAt,
        refetch: refetchMetrics,
    } = useQuery<BulkMetrics>({
        queryKey: ["bulkMetrics", orgId],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization ID required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].bulk.metrics.$get({
                param: { organizationId: orgId },
            });
            return hcJson<BulkMetrics>(res);
        },
        enabled: !!orgId,
        staleTime: QUERY_STALE_ANALYTICS_MS,
    });

    const exportMembers = async () => {
        if (!orgId) return;
        try {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].bulk.export.$get({
                param: { organizationId: orgId },
            });
            const data = await hcJson<unknown>(res);

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `members-export-${orgId}-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            notification.success({
                message: "Export Successful",
                description: "Members list has been exported successfully.",
            });
        } catch (err: any) {
            notification.error({
                message: "Export Failed",
                description: err.message || "Failed to export members list.",
            });
            console.error(err);
        }
    };

    const importMembersMutation = useMutation<ImportResult, Error, BulkImportPayload>({
        mutationFn: async (data: BulkImportPayload) => {
            if (!orgId) throw new Error("Organization ID required");
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].bulk.import.$post({
                param: { organizationId: orgId },
                json: data,
            });
            return hcJson<ImportResult>(res);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });
            queryClient.invalidateQueries({ queryKey: ["bulkMetrics", orgId] });
        },
    });

    return {
        metrics,
        isLoadingMetrics,
        isFetchingMetrics,
        metricsUpdatedAt,
        refetchMetrics,
        exportMembers,
        importMembers: importMembersMutation.mutateAsync,
        isImporting: importMembersMutation.isPending,
        importResult: importMembersMutation.data,
    };
};
