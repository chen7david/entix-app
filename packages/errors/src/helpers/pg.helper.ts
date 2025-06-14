import { DatabaseError } from 'pg';
import { ConflictError } from '../index';
import { ApiError } from '../error.model';

export function fromPostgresError(error: DatabaseError): ApiError {
  const detail = (error as { detail: string }).detail;
  const match = detail?.match(/\(([^)]+)\)=\(([^)]+)\)/);
  const message = match ? `Resource with ${match[1]} "${match[2]}" already exists` : 'Resource already exists';
  return new ConflictError(message);
}

export function isPostgresError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isPostgresUniqueError(error: DatabaseError): boolean {
  return error.code === '23505';
}
