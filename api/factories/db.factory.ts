import { AppContext } from "@api/helpers/types.helpers";
import { drizzle } from 'drizzle-orm/d1';

export const getDbClient = (ctx: AppContext) => {
    const db = drizzle(ctx.env.DB)
    return db;
}