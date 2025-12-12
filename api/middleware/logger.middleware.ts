import { pinoLogger } from "hono-pino";
import { pino } from "pino";

export const logger = () =>
    pinoLogger({
        pino: pino({
            base: undefined,
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
        }),
        http: { reqId: () => Math.random().toString(36).slice(2, 9) },
    });
