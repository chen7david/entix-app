import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.dev.env' });

const getLocalD1Url = (fileName: string) => `./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/${fileName}`

export default defineConfig({
    schema: './api/db/schema.db.ts',
    out: './api/db/migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: getLocalD1Url('e798b42c80df346fc2744f419503bd99e4275db6eab3e364b54e11cb73a82b59.sqlite'),
    },
});
