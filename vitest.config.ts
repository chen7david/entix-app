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
                    bindings: {
                        RESEND_API_KEY: "re_mock_key",
                        BETTER_AUTH_URL: "http://localhost:3000",
                        BETTER_AUTH_SECRET: "12345678901234567890123456789012",
                        SKIP_EMAIL_VERIFICATION: "true",
                        FRONTEND_URL: "http://localhost:8000",
                    }
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
