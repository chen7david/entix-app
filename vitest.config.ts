import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineWorkersConfig({
    test: {
        setupFiles: ["./tests/setup.ts"],
        poolOptions: {
            workers: {
                isolate: false,
                singleWorker: true,
                wrangler: { configPath: "./wrangler.jsonc" },
                miniflare: {
                    d1Databases: ["DB"],
                    kvNamespaces: ["IDEMPOTENCY_KV"],
                    queueProducers: {
                        QUEUE: "entix-queue",
                        DLQ: "entix-dlq",
                    },
                    bindings: {
                        RESEND_API_KEY: "re_mock_key",
                        BETTER_AUTH_SECRET: "12345678901234567890123456789012",
                        SKIP_EMAIL_VERIFICATION: "true",
                        FRONTEND_URL: "http://localhost:8000",
                        R2_ACCESS_KEY_ID: "mock_r2_access_key",
                        R2_SECRET_ACCESS_KEY: "mock_r2_secret_key",
                        CLOUDFLARE_ACCOUNT_ID: "mock_account_id",
                        R2_BUCKET_NAME: "mock-bucket",
                        PUBLIC_CDN_URL: "https://mock-cdn.example.com",
                    },
                },
            },
        },
        include: ["tests/**/*.{test,spec}.ts"],
        alias: {
            "@api": resolve(__dirname, "./api"),
            "@shared": resolve(__dirname, "./shared"),
            "@web": resolve(__dirname, "./web"),
        },
    },
});
