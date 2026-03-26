import { AppContext } from "@api/helpers/types.helpers";
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@shared/db/schema';

export type AppDb = DrizzleD1Database<typeof schema>;

export const getDbClient = (ctx: AppContext): AppDb => {
    const db = drizzle(ctx.env.DB, {
        schema,
        logger: false,
    })
    return db;
}