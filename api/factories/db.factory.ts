import { AppContext } from "@api/helpers/types.helpers";
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema.db';

export const getDbClient = (ctx: AppContext) => {
    const db = drizzle(ctx.env.DB, {
        schema,
    })
    return db;
}