import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from "@api/helpers/types.helpers";
import { EmailInsightsRoutes } from "./email-insights.routes";
import { NotFoundError, InternalServerError } from "@api/errors/app.error";
import { MailService } from "@api/services/mailer.service";

export class EmailInsightsHandler {
    static list: AppHandler<typeof EmailInsightsRoutes.list> = async (ctx) => {
        const { limit, after, before } = ctx.req.valid('query');

        ctx.var.logger.info({ limit, after, before }, "Fetching email list via MailService");

        const mailService = new MailService(ctx.env.RESEND_API_KEY);

        const { data, error } = await mailService.listEmails({
            limit: limit ?? 20,
            after,
            before,
        });

        if (error) {
            ctx.var.logger.error({ error }, "Failed to list emails from MailService");
            throw new InternalServerError(`Failed to retrieve emails: ${error.message}`);
        }

        // Resend's list API returns `{ object, data, has_more }`
        const result = data as { object: "list"; data: any[]; has_more: boolean };
        ctx.var.logger.info({ count: result.data?.length ?? 0 }, "Email list fetched from Resend");

        return ctx.json({
            object: "list" as const,
            data: result.data ?? [],
            has_more: result.has_more ?? false,
        }, HttpStatusCodes.OK);
    };

    static get: AppHandler<typeof EmailInsightsRoutes.get> = async (ctx) => {
        const { emailId } = ctx.req.valid('param');

        ctx.var.logger.info({ emailId }, "Fetching email detail via MailService");

        const mailService = new MailService(ctx.env.RESEND_API_KEY);
        const { data, error } = await mailService.getEmail(emailId);

        if (error) {
            ctx.var.logger.error({ emailId, error }, "Failed to get email from MailService");
            // Resend returns 404-like errors when ID is not found
            if (error.name === 'not_found' || (error as any).statusCode === 404) {
                throw new NotFoundError(`Email with id '${emailId}' not found`);
            }
            throw new InternalServerError(`Failed to retrieve email: ${error.message}`);
        }

        if (!data) {
            throw new NotFoundError(`Email with id '${emailId}' not found`);
        }

        ctx.var.logger.info({ emailId }, "Email detail fetched from MailService");
        return ctx.json(data as any, HttpStatusCodes.OK);
    };
}
