import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export function validate<Schema extends z.ZodTypeAny<any, any>>(
  type: "json" | "form" | "query" | "param",
  schema: Schema
) {
  return zValidator(type, schema, (result, c: Context) => {
    if (!result.success) {
      const formattedErrors = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return c.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          errors: formattedErrors,
        },
        400
      );
    }
    c.req.addValidatedData(type, result.data);
  });
}
