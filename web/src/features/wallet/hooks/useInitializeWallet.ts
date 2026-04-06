import { API_V1 } from "@shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

export const useInitializeWallet = (organizationId: string) => {
    const { notification } = App.useApp();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(
                `${API_V1}/orgs/${organizationId}/members/${userId}/wallet/initialize`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to initialize wallet");
            }

            return res.json();
        },
        onSuccess: (_data: any, userId: string) => {
            notification.success({
                message: "Wallet Initialized",
                description: _data.message || "Wallet initialization completed.",
            });

            // Invalidate the members table (correct key: "organizationMembers")
            // and the per-member wallet balance shown in the drawer's Wallet tab.
            void queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });
            void queryClient.invalidateQueries({ queryKey: ["walletBalance", userId] });
            void queryClient.invalidateQueries({ queryKey: ["wallet-summary"] });
        },
        onError: (error: any) => {
            notification.error({
                message: "Initialization Failed",
                description: error.message || "Failed to initialize wallet.",
            });
        },
    });
};
