import {
    canAccessMemberWallet,
    canManageMemberWallet,
} from "@api/services/financial/wallet-access.service";
import { describe, expect, it } from "vitest";

function makeCtx(values: Record<string, unknown>) {
    return {
        get: (key: string) => values[key],
    };
}

describe("canAccessMemberWallet", () => {
    it("allows the target user to access their own wallet", () => {
        const ctx = makeCtx({ userId: "user_1" });
        expect(canAccessMemberWallet(ctx as any, "user_1", "org_1")).toBe(true);
    });

    it("allows super admins", () => {
        const ctx = makeCtx({ userId: "admin_1", isSuperAdmin: true });
        expect(canAccessMemberWallet(ctx as any, "user_1", "org_1")).toBe(true);
    });

    it("allows org admins, owners, and finance staff", () => {
        expect(
            canAccessMemberWallet(
                makeCtx({ userId: "a", membershipRole: "admin" }) as any,
                "user_1",
                "org_1"
            )
        ).toBe(true);
        expect(
            canAccessMemberWallet(
                makeCtx({ userId: "o", membershipRole: "owner" }) as any,
                "user_1",
                "org_1"
            )
        ).toBe(true);
        expect(
            canAccessMemberWallet(
                makeCtx({ userId: "f", membershipRole: "finance" }) as any,
                "user_1",
                "org_1"
            )
        ).toBe(true);
    });

    it("denies unrelated members", () => {
        const ctx = makeCtx({ userId: "teacher_1", membershipRole: "teacher" });
        expect(canAccessMemberWallet(ctx as any, "user_1", "org_1")).toBe(false);
    });

    it("allows multi-role members when one role is finance-capable", () => {
        const ctx = makeCtx({ userId: "multi_1", membershipRole: "student, finance" });
        expect(canAccessMemberWallet(ctx as any, "user_1", "org_1")).toBe(true);
    });
});

describe("canManageMemberWallet", () => {
    it("denies self-service initialization", () => {
        const ctx = makeCtx({ userId: "user_1", membershipRole: "student" });
        expect(canManageMemberWallet(ctx as any, "user_1", "org_1")).toBe(false);
    });

    it("allows finance staff and super admins", () => {
        expect(
            canManageMemberWallet(
                makeCtx({ userId: "f", membershipRole: "finance" }) as any,
                "user_1",
                "org_1"
            )
        ).toBe(true);
        expect(
            canManageMemberWallet(
                makeCtx({ userId: "sa", isSuperAdmin: true }) as any,
                "user_1",
                "org_1"
            )
        ).toBe(true);
    });
});
