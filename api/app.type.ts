import type { Logger } from "pino";

export type AppEnv = {
    Bindings: CloudflareBindings;
    Variables: {
        logger: Logger;
    };
}