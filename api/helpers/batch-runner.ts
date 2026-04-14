import type { AppDb } from "@api/factories/db.factory";

/**
 * A lightweight helper that provides domain-agnostic access to db.batch().
 * This allows services to coordinate atomic writes across multiple repositories
 * without needing direct access to the full AppDb query interface.
 */
export class DbBatchRunner {
    constructor(private readonly db: AppDb) {}

    /**
     * Executes multiple SQL statements in a single atomic transaction.
     * Safe for use in Cloudflare Workers / D1.
     */
    async batch<T extends any[]>(statements: Parameters<AppDb["batch"]>[0]): Promise<T> {
        return (await this.db.batch(statements)) as unknown as T;
    }
}
