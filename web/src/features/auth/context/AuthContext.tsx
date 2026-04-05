import { authClient } from "@web/src/lib/auth-client";
import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";

export type UserRole = "admin" | "user";
export type OrgRole = "owner" | "admin" | "member";

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

    // ONLY show loading if it's pending AND we don't already have data.
    // This prevents background refetches (e.g., from window focus) from triggering
    // a full-page loading state, which unmounts routes and wipes form states.
    const isSessionLoading = session.isPending && session.data === undefined;
    const isMemberLoading = activeMember.isPending && activeMember.data === undefined;

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
    return context;
};
