import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vite.config.base";

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            environment: "jsdom",
            globals: true,
            setupFiles: "./src/tests/setup.ts",
            include: ["src/**/*.{test,spec}.{ts,tsx}"],
        },
    })
);
