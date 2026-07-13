import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export default defineWorkersConfig({
    test: {
        /** Integration/API tests occasionally exceed Vitest’s default 5s under full-suite load. */
        testTimeout: 15_000,
        hookTimeout: 30_000,
        root: rootDir,
        setupFiles: [resolve(rootDir, "tests/setup.ts")],
        poolOptions: {
            workers: {
                isolate: false,
                singleWorker: true,
                wrangler: { configPath: resolve(rootDir, "wrangler.jsonc") },
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
                        AI_PROVIDER: "deepseek",
                        DEEPSEEK_API_KEY: "test-deepseek-key",
                        DEEPSEEK_MODEL: "deepseek-v4-flash",
                        GEMINI_API_KEY: "test-placeholder",
                        GEMINI_MODEL: "gemini-2.5-flash",
                    },
                },
            },
        },
        include: [
            "tests/**/*.{test,spec}.ts",
            "apps/api/db/migration-guard/__tests__/**/*.{test,spec}.ts",
        ],
        exclude: ["tests/e2e/**"],
        alias: {
            "@api": resolve(rootDir, "apps/api"),
            "@shared": resolve(rootDir, "shared"),
            "@web": resolve(rootDir, "apps/web"),
        },
    },
});
