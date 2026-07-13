import type { OrgRole } from "@web/src/features/auth";
import { useMemo } from "react";
import { useActiveRole } from "./useActiveRole";

export const useOrgRole = () => {
    const { activeRole, userRoles, loadingRoles, needsRoleSelection } = useActiveRole();

    return useMemo(() => {
        const typedActiveRole = activeRole as OrgRole | null;
        const isOwner = typedActiveRole === "owner";
        const isAdmin = typedActiveRole === "admin";
        const isFinance = typedActiveRole === "finance";
        const isTeacher = typedActiveRole === "teacher";
        const isStudent = typedActiveRole === "student";
        const isAdminOrOwner = isAdmin || isOwner;
        const isFinanceStaff = isAdminOrOwner || isFinance;

        return {
            activeRole: typedActiveRole,
            userRoles: userRoles as OrgRole[],
            loadingRoles,
            needsRoleSelection,
            isOwner,
            isAdmin,
            isFinance,
            isTeacher,
            isStudent,
            isAdminOrOwner,
            /** Org ledger / billing / member-wallet management (admin, owner, finance). */
            isFinanceStaff,
            isStaff: isAdminOrOwner || isTeacher,
        };
    }, [activeRole, userRoles, loadingRoles, needsRoleSelection]);
};
