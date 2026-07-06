import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const e2eDir = resolve(rootDir, "tests/e2e");
const slowMo = Number(process.env.PLAYWRIGHT_SLOWMO ?? "0");

export default defineConfig({
    testDir: e2eDir,
    outputDir: resolve(e2eDir, "test-results"),
    timeout: 60_000,
    workers: 1,
    expect: {
        timeout: 10_000,
    },
    fullyParallel: false,
    retries: 0,
    reporter: [
        ["list"],
        ["html", { open: "never", outputFolder: resolve(e2eDir, "playwright-report") }],
    ],
    use: {
        baseURL: "http://localhost:8000",
        launchOptions: {
            slowMo,
        },
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    webServer: {
        command: "SKIP_AUTH_EMAILS=true npm run dev:e2e",
        url: "http://localhost:8000/auth/sign-in",
        reuseExistingServer: false,
        timeout: 120_000,
        cwd: rootDir,
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
