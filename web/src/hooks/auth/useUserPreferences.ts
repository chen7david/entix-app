import { useEffect, useCallback } from 'react';
import { useSession, authClient } from '@web/src/lib/auth-client';
import { DateUtils } from '@web/src/utils/date';

export type AppTheme = 'light' | 'dark' | 'system';

export function useUserPreferences() {
    const { data: session, refetch } = useSession();
    
    // Fallback securely capturing native OS context if unconfigured statically tracking configurations.
    const timezone = (session?.user as any)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const theme = ((session?.user as any)?.theme as AppTheme) || 'system';

    useEffect(() => {
        if (timezone) {
            DateUtils.setTimezone(timezone);
        }
    }, [timezone]);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const updateTimezone = useCallback(async (newTimezone: string) => {
        await authClient.updateUser({
            timezone: newTimezone,
        });
        await refetch();
    }, [refetch]);

    const updateTheme = useCallback(async (newTheme: AppTheme) => {
        await authClient.updateUser({
            theme: newTheme,
        });
        await refetch();
    }, [refetch]);

    return {
        timezone,
        theme,
        updateTimezone,
        updateTheme,
        isReady: !!session
    };
}
