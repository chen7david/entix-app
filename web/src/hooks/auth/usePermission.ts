import { useActiveOrganization } from "../../lib/auth-client";
import { Permission } from "../../../../shared/types/auth-types";

export const usePermission = () => {
    const { data: activeOrg, isPending } = useActiveOrganization();

    const hasPermission = (permission: Permission): boolean => {
        const org = activeOrg as any;
        if (!org || !org.permissions) return false;

        const [resource, action] = permission.split(":");

        // Check if the permission exists in the active organization's permissions
        // The structure from better-auth client might vary, but typically it returns permissions for the active member
        // We assume activeOrg.permissions is a record of resource -> actions[]

        const actions = org.permissions[resource];
        if (!actions) return false;

        return actions.includes(action);
    };

    return {
        hasPermission,
        isLoading: isPending
    };
};
