import { getMemberAccountService, getRegistrationService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { MemberRoutes } from "./member.routes";

export class MemberHandler {
    static createMember: AppHandler<typeof MemberRoutes.createMember> = async (ctx) => {
        const { email, name, role, defaultBillingPlanId } = ctx.req.valid("json");
        const currentUserId = ctx.get("userId");
        const organizationId = ctx.get("organizationId");

        ctx.var.logger.info(
            { currentUserId, organizationId, email, name, role, defaultBillingPlanId },
            "Creating new member"
        );

        const registrationService = getRegistrationService(ctx);

        // Welcome / password-setup email is sent inside RegistrationService.createUserAndMember
        // (single send — do not requestPasswordReset again here).
        const result = await registrationService.createUserAndMember(
            email,
            name,
            organizationId,
            role,
            defaultBillingPlanId
        );

        ctx.var.logger.info(
            { userId: result.user.id, memberId: result.member.id },
            "Member created successfully"
        );

        return ctx.json({ data: result }, HttpStatusCodes.CREATED);
    };

    static updateMemberAccount: AppHandler<typeof MemberRoutes.updateMemberAccount> = async (
        ctx
    ) => {
        const { userId } = ctx.req.valid("param");
        const { email, sendVerification } = ctx.req.valid("json");
        const organizationId = ctx.get("organizationId");

        const service = getMemberAccountService(ctx);
        const result = await service.updateMemberEmail({
            organizationId,
            userId,
            email,
            sendVerification,
        });

        return ctx.json({ data: result }, HttpStatusCodes.OK);
    };
}
