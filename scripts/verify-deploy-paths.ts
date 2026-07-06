import { access } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");

const requiredPaths = [
    "wrangler.jsonc",
    "worker-configuration.d.ts",
    "api/main.ts",
    "api/db/migrations",
    "web/dist/index.html",
    "web/dist/docs/index.html",
] as const;

async function assertExists(relativePath: string) {
    const absolutePath = resolve(rootDir, relativePath);
    try {
        await access(absolutePath);
        console.log(`OK ${relativePath}`);
    } catch {
        console.error(`MISSING ${relativePath}`);
        console.error(`  Run: npm run build:web`);
        process.exitCode = 1;
    }
}

console.log("Verifying deploy-critical paths...\n");

for (const path of requiredPaths) {
    await assertExists(path);
}

if (process.exitCode) {
    process.exit(process.exitCode);
}

console.log("\nAll deploy paths present.");
