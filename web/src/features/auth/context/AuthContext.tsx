import { authClient } from "@web/src/lib/auth-client";
import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";

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

    // better-auth's useAuthQuery initializes with `data: null` (not undefined) while
    // `isPending: true` (see better-auth/client/query). The old `data === undefined`
    // check never matched, so the first paint had isLoading=false and guest routes
    // flashed the sign-in screen before /get-session completed.
    const isSessionLoading = session.isPending && session.data === null;

    // Once the session has a user, keep global auth in "loading" until active member
    // resolves. Refetches keep prior `data` while pending is false (see better-auth
    // client/query onRequest), so we do not usually flash on background refetch.
    const isMemberLoading = Boolean(session.data?.user) && activeMember.isPending;

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
