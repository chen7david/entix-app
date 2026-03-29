import { authClient, useSession } from "@web/src/lib/auth-client";
import { DateUtils } from "@web/src/utils/date";
import { App } from "antd";
import { useCallback, useEffect } from "react";

export type AppTheme = "light" | "dark" | "system";

export function useUserPreferences() {
    const { message } = App.useApp();
    const { data: session, refetch } = useSession();

    // Fallback securely capturing native OS context if unconfigured statically tracking configurations.
    const timezone =
        (session?.user as any)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const theme = ((session?.user as any)?.theme as AppTheme) || "system";

    useEffect(() => {
        if (timezone) {
            DateUtils.setTimezone(timezone);
        }
    }, [timezone]);

    useEffect(() => {
        const root = document.documentElement;
        if (
            theme === "dark" ||
            (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, [theme]);

    const updateTimezone = useCallback(
        async (newTimezone: string) => {
            try {
                await authClient.updateUser({
                    timezone: newTimezone,
                } as any);
                await refetch();
                message.success("Timezone preferrence synced successfully");
            } catch (_error) {
                message.error("Failed to update timezone");
            }
        },
        [refetch, message.error, message.success]
    );

    const updateTheme = useCallback(
        async (newTheme: AppTheme) => {
            try {
                await authClient.updateUser({
                    theme: newTheme,
                } as any);
                await refetch();
                message.success("Theme updated successfully");
            } catch (_error) {
                message.error("Failed to update theme");
            }
        },
        [refetch, message.error, message.success]
    );

    return {
        timezone,
        theme,
        updateTimezone,
        updateTheme,
        isReady: !!session,
    };
}
