import { canAccessMemberWallet } from "@api/services/wallet-access.service";
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

    it("allows org admins and owners", () => {
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
    });

    it("denies unrelated members", () => {
        const ctx = makeCtx({ userId: "teacher_1", membershipRole: "teacher" });
        expect(canAccessMemberWallet(ctx as any, "user_1", "org_1")).toBe(false);
    });

    it("allows multi-role members when one role is admin", () => {
        const ctx = makeCtx({ userId: "multi_1", membershipRole: "student, admin" });
        expect(canAccessMemberWallet(ctx as any, "user_1", "org_1")).toBe(true);
    });
});
