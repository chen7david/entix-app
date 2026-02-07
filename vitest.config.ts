import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineWorkersConfig({
    test: {
        poolOptions: {
            workers: {
                wrangler: { configPath: "./wrangler.jsonc" },
                miniflare: {
                    d1Databases: ["DB"],
                },
            },
        },
        alias: {
            "@api": resolve(__dirname, "./api"),
            "@shared": resolve(__dirname, "./shared"),
            "@web": resolve(__dirname, "./web"),
        },
    },
});
