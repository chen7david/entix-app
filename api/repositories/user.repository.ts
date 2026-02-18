import { AppContext } from "@api/helpers/types.helpers";
import { getDbClient } from "@api/factories/db.factory";
import { auth } from "@api/lib/auth/auth";
import { InternalServerError } from "@api/errors/app.error";
import * as schema from "@api/db/schema.db";
import { eq } from "drizzle-orm";

export interface CreateUserInput {
    email: string;
    name: string;
    password: string;
}

export interface CreateUserResult {
    user: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
    };
}

/**
 * Repository for user-related database operations
 * Provides type-safe methods for user management via BetterAuth
 */
export class UserRepository {
    constructor(private ctx: AppContext) { }

    /**
     * Create a new user via BetterAuth
     * Email verification is automatically sent if sendOnSignUp is enabled in config
     */
    async createUser(input: CreateUserInput): Promise<CreateUserResult> {
        const authClient = auth(this.ctx);

        const result = await authClient.api.signUpEmail({
            body: {
                email: input.email,
                password: input.password,
                name: input.name,
            },
        });

        if (!result) {
            throw new InternalServerError("Failed to create user");
        }

        return result as CreateUserResult;
    }

    /**
     * Find user by email address
     */
    async findUserByEmail(email: string): Promise<typeof schema.user.$inferSelect | undefined> {
        const db = getDbClient(this.ctx);
        return await db.query.user.findFirst({
            where: eq(schema.user.email, email),
        });
    }

    /**
     * Send password reset email to user
     * Uses BetterAuth's built-in password reset functionality
     */
    async sendPasswordResetEmail(email: string, redirectTo: string): Promise<void> {
        const authClient = auth(this.ctx);

        await authClient.api.requestPasswordReset({
            body: { email, redirectTo }
        });
    }
}
