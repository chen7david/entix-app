import type { AppContext } from "@api/helpers/types.helpers";
import { membershipHasFinanceAccess } from "@shared/constants/roles";

export type WalletAccessContext = Pick<AppContext, "get">;

function isFinanceStaff(ctx: WalletAccessContext): boolean {
    if (ctx.get("isSuperAdmin")) return true;
    return membershipHasFinanceAccess(ctx.get("membershipRole"));
}

/**
 * Whether the caller may view a member's org-scoped wallet summary/history.
 * Allowed when the caller is the target user, a super-admin, or org finance staff
 * (admin / owner / finance).
 */
export function canAccessMemberWallet(
    ctx: WalletAccessContext,
    targetUserId: string,
    _organizationId: string
): boolean {
    const callerId = ctx.get("userId");
    if (callerId === targetUserId) return true;
    return isFinanceStaff(ctx);
}

/**
 * Whether the caller may provision or administer another member's wallet.
 * Self-service initialization is not allowed — finance staff or super-admin only.
 */
export function canManageMemberWallet(
    ctx: WalletAccessContext,
    _targetUserId: string,
    _organizationId: string
): boolean {
    return isFinanceStaff(ctx);
}
