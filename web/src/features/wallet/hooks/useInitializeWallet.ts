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
        onSuccess: (data: any) => {
            notification.success({
                message: "Wallet Initialized",
                description: data.message || "Wallet initialization completed.",
            });

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["members"] });
            queryClient.invalidateQueries({ queryKey: ["wallet-summary"] });
        },
        onError: (error: any) => {
            notification.error({
                message: "Initialization Failed",
                description: error.message || "Failed to initialize wallet.",
            });
        },
    });
};
