import type { AppContext } from "@api/helpers/types.helpers";

export type WalletAccessContext = Pick<AppContext, "get">;

/**
 * Whether the caller may view or initialize a member's org-scoped wallet.
 * Allowed when the caller is the target user, a super-admin, or org admin/owner.
 */
export function canAccessMemberWallet(
    ctx: WalletAccessContext,
    targetUserId: string,
    _organizationId: string
): boolean {
    const callerId = ctx.get("userId");
    const callerRole = ctx.get("membershipRole");
    const isSuperAdmin = ctx.get("isSuperAdmin");

    if (callerId === targetUserId) return true;
    if (isSuperAdmin) return true;

    // Comma-separated multi-roles (e.g. "student, admin") must elevate if any role is admin/owner.
    const roles = (callerRole ?? "")
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
    if (roles.includes("admin") || roles.includes("owner")) return true;

    return false;
}
