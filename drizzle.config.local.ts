import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.dev.env' });

const getLocalD1Url = (fileName: string) => `./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${fileName}`

export default defineConfig({
    schema: './api/db/schema.db.ts',
    out: './api/db/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: getLocalD1Url(process.env.CLOUDFLARE_D1_LOCAL_DB!),
    },
});
