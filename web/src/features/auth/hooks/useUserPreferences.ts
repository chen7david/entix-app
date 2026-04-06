import { useTheme } from "@web/src/hooks/useTheme";
import { authClient, useSession } from "@web/src/lib/auth-client";
import { DateUtils } from "@web/src/utils/date";
import type { AppTheme } from "@web/src/utils/theme";
import { App } from "antd";
import { useCallback, useEffect } from "react";

export function useUserPreferences() {
    const { notification } = App.useApp();
    const { data: session, refetch } = useSession();
    const { theme, updateTheme: syncTheme } = useTheme();

    const timezone =
        (session?.user as any)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    useEffect(() => {
        if (timezone) {
            DateUtils.setTimezone(timezone);
        }
    }, [timezone]);

    const updateTimezone = useCallback(
        async (newTimezone: string) => {
            try {
                await authClient.updateUser({
                    timezone: newTimezone,
                } as any);
                await refetch();
                notification.success({
                    message: "Timezone Updated",
                    description: "Your timezone preference has been synced successfully.",
                });
            } catch (error: any) {
                notification.error({
                    message: "Sync Failed",
                    description: error.message || "Failed to update timezone.",
                });
            }
        },
        [refetch, notification]
    );

    const updateTheme = useCallback(
        async (newTheme: AppTheme) => {
            try {
                await syncTheme(newTheme);
                notification.success({
                    message: "Theme Updated",
                    description: "Your theme preference has been updated successfully.",
                });
            } catch (error: any) {
                notification.error({
                    message: "Update Failed",
                    description: error.message || "Failed to update theme",
                });
            }
        },
        [syncTheme, notification]
    );

    return {
        timezone,
        theme,
        updateTimezone,
        updateTheme,
        isReady: !!session,
    };
}
