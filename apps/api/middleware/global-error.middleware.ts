import { HTTPException } from "hono/http-exception";
import { ZodError, z } from "zod";
import { AppError } from "../errors/app.error";
import type { AppContext } from "../helpers/types.helpers";

export const globalErrorHandler = async (err: Error, ctx: AppContext) => {
    const requestContext = {
        path: ctx.req.path,
        method: ctx.req.method,
        organizationId: ctx.get("organizationId") ?? null,
        userId: ctx.get("userId") ?? null,
    };

    if (err instanceof ZodError) {
        const flattened = z.treeifyError(err);
        ctx.var.logger.warn({ ...requestContext, flattened }, "Validation error");
        return ctx.json(
            {
                success: false,
                message: "Validation failed",
                error: "Validation failed",
                details: "properties" in flattened ? flattened.properties : flattened,
            },
            { status: 400 }
        );
    }

    if (
        err instanceof AppError ||
        (err && typeof err === "object" && "status" in err && "message" in err)
    ) {
        const status = (err as any).status || 500;
        const message = (err as any).message || "An error occurred";

        ctx.var.logger.warn({ ...requestContext, status, message }, "Application error");
        return ctx.json(
            {
                success: false,
                message: message,
                error: message,
                ...((err as any).details ? { details: (err as any).details } : {}),
            },
            status
        );
    }

    if (err instanceof HTTPException) {
        ctx.var.logger.warn(
            { ...requestContext, status: err.status, message: err.message },
            "HTTP exception"
        );
        return ctx.json(
            {
                success: false,
                message: err.message,
                error: err.message,
            },
            { status: err.status }
        );
    }

    // True unhandled error — log at error level with full stack
    ctx.var.logger.error({ ...requestContext, err, stack: err.stack }, "Unhandled error");
    return ctx.json(
        {
            success: false,
            message: "Internal server error",
            error: "Internal server error",
        },
        500
    );
};
