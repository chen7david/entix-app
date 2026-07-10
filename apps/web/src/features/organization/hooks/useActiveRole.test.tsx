import { renderHook } from "@testing-library/react";
import { OrgContext } from "@web/src/context/OrgContext";
import { authClient } from "@web/src/lib/auth-client";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useActiveRole } from "./useActiveRole";

vi.mock("@web/src/lib/auth-client", () => ({
    authClient: {
        useActiveMember: vi.fn(),
    },
}));

function wrapperWithRole(activeRole: string | null) {
    return function Wrapper({ children }: PropsWithChildren) {
        return (
            <OrgContext.Provider
                value={{
                    activeOrganization: {
                        id: "org_1",
                        slug: "acme",
                        name: "Acme",
                    } as any,
                    loading: false,
                    error: null,
                    activeRole,
                    setActiveRole: vi.fn(),
                }}
            >
                {children}
            </OrgContext.Provider>
        );
    };
}

describe("useActiveRole", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("requires role selection when member has multiple roles and none is active", () => {
        vi.mocked(authClient.useActiveMember).mockReturnValue({
            data: { role: "student, teacher" },
            isPending: false,
        } as any);

        const { result } = renderHook(() => useActiveRole(), {
            wrapper: wrapperWithRole(null),
        });

        expect(result.current.needsRoleSelection).toBe(true);
        expect(result.current.activeRole).toBeNull();
        expect(result.current.userRoles).toEqual(["student", "teacher"]);
    });

    it("auto-resolves when the member has a single role", () => {
        vi.mocked(authClient.useActiveMember).mockReturnValue({
            data: { role: "teacher" },
            isPending: false,
        } as any);

        const { result } = renderHook(() => useActiveRole(), {
            wrapper: wrapperWithRole(null),
        });

        expect(result.current.needsRoleSelection).toBe(false);
        expect(result.current.activeRole).toBe("teacher");
    });

    it("keeps a stored active role when it is still in membership roles", () => {
        vi.mocked(authClient.useActiveMember).mockReturnValue({
            data: { role: "student, admin" },
            isPending: false,
        } as any);

        const { result } = renderHook(() => useActiveRole(), {
            wrapper: wrapperWithRole("admin"),
        });

        expect(result.current.needsRoleSelection).toBe(false);
        expect(result.current.activeRole).toBe("admin");
    });

    it("strips an invalid stored active role and requires selection again", () => {
        vi.mocked(authClient.useActiveMember).mockReturnValue({
            data: { role: "student, teacher" },
            isPending: false,
        } as any);

        const { result } = renderHook(() => useActiveRole(), {
            wrapper: wrapperWithRole("owner"),
        });

        expect(result.current.activeRole).toBeNull();
        expect(result.current.needsRoleSelection).toBe(true);
    });
});
