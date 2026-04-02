import { getRegistrationService, getUserService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import type { AppHandler } from "@api/helpers/types.helpers";
import type { MemberRoutes } from "./member.routes";

export class MemberHandler {
    static createMember: AppHandler<typeof MemberRoutes.createMember> = async (ctx) => {
        const { email, name, role } = ctx.req.valid("json");
        const currentUserId = ctx.get("userId");
        const organizationId = ctx.get("organizationId");

        ctx.var.logger.info(
            { currentUserId, organizationId, email, name, role },
            "Creating new member"
        );

        const registrationService = getRegistrationService(ctx);
        const userService = getUserService(ctx);

        const result = await registrationService.createUserAndMember(
            email,
            name,
            organizationId,
            role
        );

        const resetUrl = `${ctx.var.frontendUrl}/auth/reset-password`;

        // Fire-and-forget — member creation succeeds regardless of email outcome.
        // Failure is logged by the service; caller receives 201.
        userService.sendPasswordResetEmail(email, resetUrl).catch((err: unknown) => {
            ctx.var.logger.error(
                { err, email, memberId: result.member.id },
                "Password reset email failed after member creation"
            );
        });

        ctx.var.logger.info(
            { userId: result.user.id, memberId: result.member.id },
            "Member created successfully"
        );

        return ctx.json({ data: result }, HttpStatusCodes.CREATED);
    };
}
