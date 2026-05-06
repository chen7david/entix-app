import { type OrgRole } from "@web/src/features/auth";
import { useMemo } from "react";
import { useActiveRole } from "./useActiveRole";

export const useOrgRole = () => {
    const { activeRole, userRoles, loadingRoles, needsRoleSelection } = useActiveRole();

    return useMemo(() => {
        const typedActiveRole = activeRole as OrgRole | null;
        const isOwner = typedActiveRole === "owner";
        const isAdmin = typedActiveRole === "admin";
        const isTeacher = typedActiveRole === "teacher";
        const isStudent = typedActiveRole === "student";

        return {
            activeRole: typedActiveRole,
            userRoles: userRoles as OrgRole[],
            loadingRoles,
            needsRoleSelection,
            isOwner,
            isAdmin,
            isTeacher,
            isStudent,
            isAdminOrOwner: isAdmin || isOwner,
            isStaff: isAdmin || isOwner || isTeacher,
        };
    }, [activeRole, userRoles, loadingRoles, needsRoleSelection]);
};
