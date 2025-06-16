import { Inject, Injectable } from '@utils/typedi.util';
import { PgToken } from '@factories/pg.factory';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@database/schema';

@Injectable()
export class DbService {
  readonly db: ReturnType<typeof drizzle>;

  constructor(@Inject(PgToken) private readonly pg: Pool) {
    this.db = drizzle(this.pg, { schema });
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pg.connect();
      const result = await client.query('SELECT 1');
      client.release();
      return result.rowCount === 1;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Database connection failed: ${errorMessage}`);
    }
  }

  getDb() {
    return this.db;
  }
}
