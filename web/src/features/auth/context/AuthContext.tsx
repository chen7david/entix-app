import { authClient } from "@web/src/lib/auth-client";
import type React from "react";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";

export type UserRole = "admin" | "user";
export type OrgRole = "owner" | "admin" | "teacher" | "student";

export interface UnifiedUser {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string | null;
    globalRole: UserRole;
    orgRole: OrgRole | null;
    activeMemberId: string | null;
    activeOrganizationId: string | null;
}

interface AuthContextType {
    user: UnifiedUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isSuperAdmin: boolean;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const session = authClient.useSession();
    const activeMember = authClient.useActiveMember();

    const refreshAuth = useCallback(async () => {
        await Promise.all([session.refetch(), activeMember.refetch()]);
    }, [session.refetch, activeMember.refetch]);

    // Hold the last known member data through better-auth's nanostore blink
    // (data → undefined during refetch, confirmed by better-auth #3837 and #6879).
    // Only mark as truly loading if we have NEVER had data.
    const lastMemberData = useRef(activeMember.data);
    if (activeMember.data !== undefined) {
        lastMemberData.current = activeMember.data;
    }

    const isSessionLoading = session.isPending && session.data === undefined;
    const isMemberLoading = activeMember.isPending && lastMemberData.current === undefined;

    const isLoading = isSessionLoading || isMemberLoading;

    const unifiedUser = useMemo(() => {
        if (!session.data?.user) return null;

        const { role, ...restUser } = session.data.user;

        return {
            ...restUser,
            globalRole: role as UserRole,
            orgRole: (activeMember.data?.role as OrgRole) ?? null,
            activeMemberId: activeMember.data?.id ?? null,
            activeOrganizationId: activeMember.data?.organizationId ?? null,
        } as UnifiedUser;
    }, [session.data?.user, activeMember.data]);

    const value = useMemo(
        () => ({
            user: unifiedUser,
            // NOTE: only meaningful when isLoading is false
            isAuthenticated: !!unifiedUser,
            isLoading,
            isSuperAdmin: unifiedUser?.globalRole === "admin",
            refreshAuth,
        }),
        [unifiedUser, isLoading, refreshAuth]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }

    const derivedFlags = useMemo(() => {
        const orgRole = context.user?.orgRole;
        const isOwner = orgRole === "owner";
        const isAdmin = orgRole === "admin";
        const isTeacher = orgRole === "teacher";
        const isStudent = orgRole === "student";

        return {
            isOwner,
            isAdmin,
            isTeacher,
            isStudent,
            isAdminOrOwner: isAdmin || isOwner,
            isStaff: isAdmin || isOwner || isTeacher,
        };
    }, [context.user?.orgRole]);

    return {
        ...context,
        ...derivedFlags,
    };
};
