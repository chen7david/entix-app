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
    async findUserByEmail(email: string): Promise<schema.User | undefined> {
        const db = getDbClient(this.ctx);
        return await db.query.user.findFirst({
            where: eq(schema.user.email, email),
        });
    }

    /**
     * Update an existing user's data
     */
    async updateUser(userId: string, data: Partial<typeof schema.user.$inferInsert>): Promise<void> {
        const db = getDbClient(this.ctx);
        await db.update(schema.user)
            .set(data)
            .where(eq(schema.user.id, userId));
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

    /**
     * Find all users belonging to an organization
     * Queries via the member table to scope results to the given org
     */
    async findUsersByOrganization(organizationId: string): Promise<schema.User[]> {
        const db = getDbClient(this.ctx);
        const members = await db.query.member.findMany({
            where: eq(schema.member.organizationId, organizationId),
            with: {
                user: true,
            },
        });

        return members.map((m) => m.user);
    }



    /**
     * Prepare a query to create a user for batching
     */
    prepareCreateUser(id: string, email: string, name: string, emailVerified: boolean) {
        const db = getDbClient(this.ctx);
        const now = new Date();
        return db.insert(schema.user).values({
            id,
            email,
            name,
            emailVerified,
            createdAt: now,
            updatedAt: now,
            role: "user",
            banned: false,
        });
    }

    /**
     * Prepare a query to create an account for batching
     */
    prepareCreateAccount(id: string, userId: string, providerId: string, passwordHash: string) {
        const db = getDbClient(this.ctx);
        const now = new Date();
        return db.insert(schema.account).values({
            id,
            accountId: providerId === "credential" ? userId : id,
            providerId,
            userId,
            password: passwordHash,
            createdAt: now,
            updatedAt: now,
        });
    }
}
