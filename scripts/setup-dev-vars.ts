import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const examplePath = resolve(rootDir, ".example.dev.vars");
const devVarsPath = resolve(rootDir, ".dev.vars");
const d1Dir = resolve(rootDir, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");

const force = process.argv.includes("--force");

/** Same discovery logic as tests/e2e/helpers/db.ts */
function detectLocalD1SqliteFile(): string | null {
    if (!existsSync(d1Dir)) return null;
    const appDb = readdirSync(d1Dir).find(
        (entry) => entry.endsWith(".sqlite") && entry !== "metadata.sqlite"
    );
    return appDb ?? null;
}

function parseDevVars(content: string): Map<string, string> {
    const map = new Map<string, string>();
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        map.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
    }
    return map;
}

function serializeDevVars(vars: Map<string, string>, template: string): string {
    const lines = template.split("\n");
    const seen = new Set<string>();

    const rendered = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return line;
        const eq = trimmed.indexOf("=");
        if (eq === -1) return line;
        const key = trimmed.slice(0, eq).trim();
        if (!vars.has(key)) return line;
        seen.add(key);
        const value = vars.get(key) ?? "";
        return `${key}=${value}`;
    });

    for (const [key, value] of vars) {
        if (!seen.has(key)) rendered.push(`${key}=${value}`);
    }

    return `${rendered.join("\n").replace(/\n*$/, "")}\n`;
}

function applyLocalDefaults(vars: Map<string, string>) {
    const d1File = detectLocalD1SqliteFile();
    if (d1File && !vars.get("CLOUDFLARE_D1_LOCAL_DB")) {
        vars.set("CLOUDFLARE_D1_LOCAL_DB", d1File);
    }

    if (!vars.get("BETTER_AUTH_SECRET")) {
        vars.set("BETTER_AUTH_SECRET", randomBytes(32).toString("hex"));
    }

    if (!vars.get("RESEND_API_KEY")) {
        vars.set("RESEND_API_KEY", "re_mock_key_local_dev");
    }

    if (!vars.get("R2_SECRET_ACCESS_KEY")) {
        vars.set("R2_SECRET_ACCESS_KEY", "mock_r2_secret_key_local");
    }

    if (!vars.get("DEEPSEEK_API_KEY")) {
        vars.set("DEEPSEEK_API_KEY", "local-dev-placeholder-replace-for-ai");
    }

    if (!vars.has("SKIP_EMAIL_VERIFICATION")) {
        vars.set("SKIP_EMAIL_VERIFICATION", "true");
    }

    if (!vars.has("SKIP_AUTH_EMAILS")) {
        vars.set("SKIP_AUTH_EMAILS", "true");
    }
}

function main() {
    if (!existsSync(examplePath)) {
        console.error("Missing .example.dev.vars template.");
        process.exit(1);
    }

    if (existsSync(devVarsPath) && !force) {
        console.log(".dev.vars already exists — leaving unchanged.");
        console.log("  Re-run with --force to regenerate from template.");
        return;
    }

    const template = readFileSync(examplePath, "utf8");
    const vars = parseDevVars(template);
    applyLocalDefaults(vars);

    writeFileSync(devVarsPath, serializeDevVars(vars, template), "utf8");
    console.log(`Wrote ${devVarsPath}`);

    if (!vars.get("CLOUDFLARE_D1_LOCAL_DB")) {
        console.warn(
            "\n⚠️  CLOUDFLARE_D1_LOCAL_DB is empty — run `npm run db:migrate:dev` or `npm run dev:api` once, then `npm run dev:vars` again."
        );
    } else {
        console.log(`  CLOUDFLARE_D1_LOCAL_DB=${vars.get("CLOUDFLARE_D1_LOCAL_DB")}`);
    }

    console.log("  Generated BETTER_AUTH_SECRET and local mock keys for email/R2/AI.");
    console.log("  Replace DEEPSEEK_API_KEY with a real key to use Workers AI locally.");
}

main();
