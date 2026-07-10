import { pinoLogger } from "hono-pino";
import { type LevelWithSilent, pino } from "pino";

function isTestRuntime(): boolean {
    if (typeof process !== "undefined" && process.env.VITEST) {
        return true;
    }
    return Boolean((globalThis as { __ENTIX_TEST__?: boolean }).__ENTIX_TEST__);
}

function resolveLogLevel(): LevelWithSilent {
    const fromEnv = typeof process !== "undefined" ? process.env.LOG_LEVEL : undefined;
    if (fromEnv) {
        return fromEnv as LevelWithSilent;
    }
    // Quiet HTTP request/response dumps during Vitest; override with LOG_LEVEL=info.
    return isTestRuntime() ? "silent" : "info";
}

export const logger = () =>
    pinoLogger({
        pino: pino({
            level: resolveLogLevel(),
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
        }),
        http: { reqId: () => Math.random().toString(36).slice(2, 9) },
    });
