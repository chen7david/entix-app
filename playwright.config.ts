import { defineConfig, devices } from "@playwright/test";

const slowMo = Number(process.env.PLAYWRIGHT_SLOWMO ?? "0");

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 60_000,
    workers: 1,
    expect: {
        timeout: 10_000,
    },
    fullyParallel: false,
    retries: 0,
    reporter: [["list"], ["html", { open: "never" }]],
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
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
