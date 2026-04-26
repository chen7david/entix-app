import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 60_000,
    expect: {
        timeout: 10_000,
    },
    fullyParallel: false,
    retries: 0,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        baseURL: "http://127.0.0.1:8000",
        launchOptions: {
            slowMo: 500,
        },
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    webServer: {
        command: "npm run dev",
        url: "http://127.0.0.1:8000/auth/sign-in",
        reuseExistingServer: true,
        timeout: 120_000,
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
