import { Inject, Injectable } from '@utils/typedi.util';
import { PgToken } from '@factories/pg.factory';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

@Injectable()
export class DbService {
  private db;

  constructor(@Inject(PgToken) private readonly pg: Pool) {
    this.db = drizzle(this.pg);
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
