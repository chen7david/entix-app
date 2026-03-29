import { HTTPException } from "hono/http-exception";
import { ZodError, z } from "zod";
import { AppError } from "../errors/app.error";
import type { AppContext } from "../helpers/types.helpers";

export const globalErrorHandler = async (err: Error, ctx: AppContext) => {
    ctx.var.logger.error({ err }, "Caught error");

    if (err instanceof ZodError) {
        const flattened = z.treeifyError(err);
        ctx.var.logger.warn({ flattened }, "Flattened Zod error");
        return ctx.json(
            {
                success: false,
                message: "Validation failed",
                details: "properties" in flattened ? flattened.properties : flattened,
            },
            { status: 400 }
        );
    }

    if (err instanceof HTTPException) {
        return ctx.json(
            {
                success: false,
                message: err.message,
            },
            { status: err.status }
        );
    }

    if (err instanceof AppError) {
        return ctx.json(
            {
                success: false,
                message: err.message,
                ...(err.details ? { details: err.details } : {}),
            },
            err.status
        );
    }

    return ctx.json(
        {
            success: false,
            message: "Internal Server Error",
        },
        500
    );
};
