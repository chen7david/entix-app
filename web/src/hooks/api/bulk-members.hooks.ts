import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_V1 } from "@web/src/lib/api";
import { message } from "antd";

export type BulkMetrics = {
    totalStorage: number;
    activeSessions: number;
    engagementRisk: number;
    totalMembers: number;
    upcomingBirthdays: {
        userId: string;
        name: string;
        birthDate: string;
        daysUntil: number;
    }[];
};

export type ImportResult = {
    total: number;
    created: number;
    linked: number;
    failed: number;
    errors: string[];
};

export const useBulkMembers = (orgId?: string) => {
    const queryClient = useQueryClient();

    const { data: metrics, isLoading: isLoadingMetrics } = useQuery<BulkMetrics>({
        queryKey: ['bulkMetrics', orgId],
        queryFn: async () => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${orgId}/bulk/metrics`);
            if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
            return res.json();
        },
        enabled: !!orgId,
    });

    const exportMembers = async () => {
        if (!orgId) return;
        try {
            const res = await fetch(`${API_V1}/orgs/${orgId}/bulk/export`);
            if (!res.ok) throw new Error("Failed to export members");
            const data = await res.json();
            
            // Trigger download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `members-export-${orgId}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            message.success("Members exported successfully");
        } catch (err) {
            message.error("Failed to export members");
            console.error(err);
        }
    };

    const importMembersMutation = useMutation<ImportResult, Error, any[]>({
        mutationFn: async (data: any[]) => {
            if (!orgId) throw new Error("Organization ID required");
            const res = await fetch(`${API_V1}/orgs/${orgId}/bulk/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to import members");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizationMembers'] });
            queryClient.invalidateQueries({ queryKey: ['bulkMetrics', orgId] });
        }
    });

    return {
        metrics,
        isLoadingMetrics,
        exportMembers,
        importMembers: importMembersMutation.mutateAsync,
        isImporting: importMembersMutation.isPending,
        importResult: importMembersMutation.data,
    };
};
