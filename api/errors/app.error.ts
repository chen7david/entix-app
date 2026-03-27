import type { ContentfulStatusCode } from "hono/utils/http-status";

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
// -------------------------------

export class BadRequestError extends AppError {
    constructor(message = "Bad request", details?: unknown) {
        super(message, 400, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized", details?: unknown) {
        super(message, 401, details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden", details?: unknown) {
        super(message, 403, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found", details?: unknown) {
        super(message, 404, details);
    }
}

export class MethodNotAllowedError extends AppError {
    constructor(message = "Method not allowed", details?: unknown) {
        super(message, 405, details);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflict", details?: unknown) {
        super(message, 409, details);
    }
}

export class UnprocessableEntityError extends AppError {
    constructor(message = "Unprocessable entity", details?: unknown) {
        super(message, 422, details);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = "Too many requests", details?: unknown) {
        super(message, 429, details);
    }
}

export class InternalServerError extends AppError {
    constructor(message = "Internal server error", details?: unknown) {
        super(message, 500, details);
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message = "Service unavailable", details?: unknown) {
        super(message, 503, details);
    }
}
