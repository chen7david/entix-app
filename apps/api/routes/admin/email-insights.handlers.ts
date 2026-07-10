import { InternalServerError, NotFoundError } from "@api/errors/app.error";
import { getMailService } from "@api/factories/service.factory";
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { z } from "zod";

const resendEmailSchema = z.object({
    id: z.string(),
    to: z.array(z.string()),
    subject: z.string(),
    created_at: z.string(),
    from: z.string().optional(),
    html: z.string().optional(),
    text: z.string().optional(),
});

const resendListResponseSchema = z.object({
    data: z.array(resendEmailSchema).optional(),
    has_more: z.boolean().optional(),
});

import type { AppHandler } from "@api/helpers/types.helpers";
import type { EmailInsightsRoutes } from "./email-insights.routes";

export const EmailInsightsHandler = {
    list: (async (ctx) => {
        const { limit, cursor, direction } = ctx.req.valid("query");

        const after = direction === "next" ? cursor : undefined;
        const before = direction === "prev" ? cursor : undefined;

        ctx.var.logger.info(
            { limit, cursor, direction, after, before },
            "Fetching email list via MailService"
        );

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

        const result = resendListResponseSchema.parse(data);
        const rawItems = result.data ?? [];
        const hasMore = result.has_more ?? false;

        // Map Resend's native items to our standardized emailSummarySchema
        const items = rawItems.map((item) => ({
            id: item.id,
            to: item.to || null,
            from: item.from || "unknown",
            subject: item.subject || null,
            created_at: item.created_at,
            last_event: (item as any).last_event || null,
            scheduled_at: (item as any).scheduled_at || null,
            bcc: (item as any).bcc || null,
            cc: (item as any).cc || null,
            reply_to: (item as any).reply_to || null,
        }));

        const nextCursor =
            direction === "next" && hasMore && items.length > 0 ? items[items.length - 1].id : null;
        const prevCursor = direction === "prev" && hasMore && items.length > 0 ? items[0].id : null;

        return ctx.json(
            {
                items,
                nextCursor,
                prevCursor,
            },
            HttpStatusCodes.OK
        );
    }) as AppHandler<typeof EmailInsightsRoutes.list>,

    get: async (ctx: any) => {
        const { emailId } = ctx.req.valid("param");

        ctx.var.logger.info({ emailId }, "Fetching email detail via MailService");

        const mailService = getMailService(ctx);
        const { data, error } = await mailService.getEmail(emailId);

        if (error) {
            ctx.var.logger.error({ emailId, error }, "Failed to get email from MailService");
            const err = error as { name?: string; statusCode?: number };
            if (err.name === "not_found" || err.statusCode === 404) {
                throw new NotFoundError(`Email with id '${emailId}' not found`);
            }
            throw new InternalServerError(`Failed to retrieve email: ${error.message}`);
        }

        if (!data) {
            throw new NotFoundError(`Email with id '${emailId}' not found`);
        }

        ctx.var.logger.info({ emailId }, "Email detail fetched from MailService");
        return ctx.json(resendEmailSchema.parse(data), HttpStatusCodes.OK);
    },
};
