import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Base AppError class for all custom errors
export class AppError extends Error {
    status: ContentfulStatusCode;
    details?: unknown;

    constructor(message: string, status: ContentfulStatusCode, details?: unknown) {
        super(message);
        this.status = status;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

// -------------------------------
// Common subclasses
// -------------------------------

// 400 — Bad Request
export class BadRequestError extends AppError {
    constructor(message = 'Bad request', details?: unknown) {
        super(message, 400, details);
    }
}

// 401 — Unauthorized (no valid auth)
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized', details?: unknown) {
        super(message, 401, details);
    }
}

// 403 — Forbidden (valid auth, but no permission)
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden', details?: unknown) {
        super(message, 403, details);
    }
}

// 404 — Not Found
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found', details?: unknown) {
        super(message, 404, details);
    }
}

// 405 — Method Not Allowed
export class MethodNotAllowedError extends AppError {
    constructor(message = 'Method not allowed', details?: unknown) {
        super(message, 405, details);
    }
}

// 409 — Conflict (duplicate, version clash, etc.)
export class ConflictError extends AppError {
    constructor(message = 'Conflict', details?: unknown) {
        super(message, 409, details);
    }
}

// 422 — Unprocessable Entity (validation or semantic errors)
export class UnprocessableEntityError extends AppError {
    constructor(message = 'Unprocessable entity', details?: unknown) {
        super(message, 422, details);
    }
}

// 429 — Too Many Requests (rate limiting)
export class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests', details?: unknown) {
        super(message, 429, details);
    }
}

// 500 — Internal Server Error (generic fallback)
export class InternalServerError extends AppError {
    constructor(message = 'Internal server error', details?: unknown) {
        super(message, 500, details);
    }
}

// 503 — Service Unavailable
export class ServiceUnavailableError extends AppError {
    constructor(message = 'Service unavailable', details?: unknown) {
        super(message, 503, details);
    }
}