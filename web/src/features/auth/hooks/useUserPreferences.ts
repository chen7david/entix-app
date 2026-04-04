import { useTheme } from "@web/src/hooks/useTheme";
import { authClient, useSession } from "@web/src/lib/auth-client";
import { DateUtils } from "@web/src/utils/date";
import type { AppTheme } from "@web/src/utils/theme";
import { App } from "antd";
import { useCallback, useEffect } from "react";

export function useUserPreferences() {
    const { message } = App.useApp();
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
                message.success("Timezone preference synced successfully");
            } catch (_error) {
                message.error("Failed to update timezone");
            }
        },
        [refetch, message]
    );

    const updateTheme = useCallback(
        async (newTheme: AppTheme) => {
            try {
                await syncTheme(newTheme);
                message.success("Theme updated successfully");
            } catch (_error) {
                message.error("Failed to update theme");
            }
        },
        [syncTheme, message]
    );

    return {
        timezone,
        theme,
        updateTimezone,
        updateTheme,
        isReady: !!session,
    };
}
