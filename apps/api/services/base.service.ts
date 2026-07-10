import { NotFoundError } from "@api/errors/app.error";

/**
 * Base service providing common utilities for domain services.
 */
export abstract class BaseService {
    /**
     * Asserts that a record exists.
     * Throws NotFoundError if the record is null or undefined.
     * Use this to implement 'get*' methods in your service.
     *
     * @param item - The item to check for existence
     * @param message - The error message to throw if not found
     * @returns The item, guaranteed to be present
     * @throws NotFoundError
     */
    protected assertExists<T>(item: T | null | undefined, message: string): T {
        if (item === null || item === undefined) {
            throw new NotFoundError(message);
        }
        return item as T;
    }
}
