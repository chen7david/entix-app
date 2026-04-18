import { useSession } from "@web/src/lib/auth-client";
import { DateUtils } from "@web/src/utils/date";
import { useEffect } from "react";

/**
 * Lightweight hook to initialize the global application timezone.
 * This hook is intended to be called at the root of the app and has no
 * UI dependencies (like Ant Design's App context), making it safe for early mount.
 */
export function useTimezoneInit() {
    const { data: session } = useSession();
    const timezone =
        (session?.user as any)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    useEffect(() => {
        if (timezone) {
            DateUtils.setTimezone(timezone);
        }
    }, [timezone]);
}
