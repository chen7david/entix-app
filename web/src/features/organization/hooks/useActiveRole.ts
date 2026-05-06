import { useOptionalOrgContext } from "@web/src/context/OrgContext";
import { authClient } from "@web/src/lib/auth-client";
import { useMemo } from "react";

const NOOP_SET_ACTIVE_ROLE = (_role: string | null): void => {};

export const useActiveRole = () => {
    const orgContext = useOptionalOrgContext();
    const activeRole = orgContext?.activeRole ?? null;
    const setActiveRole = orgContext?.setActiveRole ?? NOOP_SET_ACTIVE_ROLE;
    const activeMember = authClient.useActiveMember();
    const loadingMembers = activeMember.isPending;
    const userRoles = useMemo(() => {
        return (activeMember.data?.role || "")
            .split(",")
            .map((role) => role.trim())
            .filter(Boolean);
    }, [activeMember.data?.role]);

    const normalizedActiveRole = useMemo(() => {
        if (!activeRole) return null;
        return userRoles.includes(activeRole) ? activeRole : null;
    }, [activeRole, userRoles]);

    const { resolvedRole, needsRoleSelection } = useMemo(
        () => ({
            resolvedRole: normalizedActiveRole || (userRoles.length === 1 ? userRoles[0] : null),
            needsRoleSelection: !loadingMembers && userRoles.length > 1 && !normalizedActiveRole,
        }),
        [normalizedActiveRole, userRoles, loadingMembers]
    );

    return {
        activeRole: resolvedRole,
        setActiveRole,
        userRoles,
        loadingRoles: loadingMembers,
        needsRoleSelection,
    };
};
