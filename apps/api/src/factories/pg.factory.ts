import { Injectable, Token } from '@utils/typedi.util';
import { ConfigService } from '@services/config.service';
import { Pool } from 'pg';

export const PgToken = new Token<Pool>('PgToken');

@Injectable()
export class PgFactory {
  constructor(private readonly configService: ConfigService) {}

  create() {
    return new Pool({
      connectionString: this.configService.env.DATABASE_URL,
    });
  }
}
