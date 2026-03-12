import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from "@api/helpers/types.helpers";
import { EmailInsightsRoutes } from "./email-insights.routes";
import { NotFoundError, InternalServerError } from "@api/errors/app.error";
import { getMailService } from "@api/factories/service.factory";

export class EmailInsightsHandler {
    static list: AppHandler<typeof EmailInsightsRoutes.list> = async (ctx) => {
        const { limit, after, before } = ctx.req.valid('query');

        ctx.var.logger.info({ limit, after, before }, "Fetching email list via MailService");

        const mailService = getMailService(ctx);

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
        // We cast to any here to satisfy the Hono OpenAPI type which expects a very specific structure from Resend
        // which might have slight mismatches in optional fields or enum values.
        const result = data as any; 
        ctx.var.logger.info({ count: result.data?.length ?? 0 }, "Email list fetched from Resend");

        return ctx.json({
            object: "list" as const,
            data: result.data ?? [],
            has_more: result.has_more ?? false,
        } as any, HttpStatusCodes.OK);
    };

    static get: AppHandler<typeof EmailInsightsRoutes.get> = async (ctx) => {
        const { emailId } = ctx.req.valid('param');

        ctx.var.logger.info({ emailId }, "Fetching email detail via MailService");

        const mailService = getMailService(ctx);
        const { data, error } = await mailService.getEmail(emailId);

        if (error) {
            ctx.var.logger.error({ emailId, error }, "Failed to get email from MailService");
            // Resend returns 404-like errors when ID is not found
            const err = error as { name?: string; statusCode?: number };
            if (err.name === 'not_found' || err.statusCode === 404) {
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
