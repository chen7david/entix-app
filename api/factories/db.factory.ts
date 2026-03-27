import type { AppContext } from "@api/helpers/types.helpers";
import * as schema from "@shared/db/schema";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";

export type AppDb = DrizzleD1Database<typeof schema>;

export const getDbClient = (ctx: AppContext): AppDb => {
    const db = drizzle(ctx.env.DB, {
        schema,
        logger: false,
    });
    return db;
};
