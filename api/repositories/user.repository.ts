import { AppDb } from "@api/factories/db.factory";
import { InternalServerError } from "@api/errors/app.error";
import * as schema from "@shared/db/schema";
import { eq, and, like, or } from "drizzle-orm";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";

// Better Auth instance is complex and dynamic, so we use 'any' to avoid brittle type-narrowing 
// that breaks across the factory layer.
type BetterAuthInstance = any;

export type CreateUserInput = {
    email: string;
    name: string;
    password: string;
};

export type CreateUserResult = {
    user: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
    };
};

/**
 * Repository for user-related database operations
 * Provides type-safe methods for user management via BetterAuth
 */
export class UserRepository {
    constructor(
        private db: AppDb,
        private auth: BetterAuthInstance
    ) { }

    /**
     * Create a new user via BetterAuth
     * Email verification is automatically sent if sendOnSignUp is enabled in config
     */
    async createUser(input: CreateUserInput): Promise<CreateUserResult> {
        const result = await this.auth.api.signUpEmail({
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
    async findUserByEmail(email: string): Promise<schema.AuthUser | undefined> {
        return await this.db.query.authUsers.findFirst({
            where: eq(schema.authUsers.email, email),
        });
    }

    /**
     * Find user by ID
     */
    async findUserById(userId: string): Promise<schema.AuthUser | undefined> {
        return await this.db.query.authUsers.findFirst({
            where: eq(schema.authUsers.id, userId),
        });
    }

    /**
     * Update an existing user's data
     */
    async updateUser(userId: string, data: Partial<typeof schema.authUsers.$inferInsert>): Promise<void> {
        await this.db.update(schema.authUsers)
            .set(data)
            .where(eq(schema.authUsers.id, userId));
    }

    /**
     * Send password reset email to user
     * Uses BetterAuth's built-in password reset functionality
     */
    async sendPasswordResetEmail(email: string, redirectTo: string): Promise<void> {
        await this.auth.api.requestPasswordReset({
            body: { email, redirectTo }
        });
    }

    /**
     * Find all users belonging to an organization
     * Queries via the member table to scope results to the given org
     */
    async findUsersByOrganization(organizationId: string, limit: number, cursor?: string, direction: 'next' | 'prev' = 'next', search?: string) {
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            schema.authMembers.createdAt,
            schema.authMembers.id,
            cursor,
            direction
        );

        const conditions = [eq(schema.authMembers.organizationId, organizationId)];
        if (cursorWhere) conditions.push(cursorWhere);
        
        if (search) {
            // ILIKE is preferred for case-insensitive, but SQLite natively treats LIKE as case-insensitive globally.
            conditions.push(or(
                like(schema.authUsers.name, `%${search}%`),
                like(schema.authUsers.email, `%${search}%`)
            )!);
        }

        const membersJoined = await this.db
            .select({ member: schema.authMembers, user: schema.authUsers })
            .from(schema.authMembers)
            .innerJoin(schema.authUsers, eq(schema.authMembers.userId, schema.authUsers.id))
            .where(and(...conditions))
            .orderBy(...orderBy)
            .limit(limit + 1);
        
        const result = processPaginatedResult(
            membersJoined,
            limit,
            direction,
            (row) => ({ primary: row.member.createdAt.getTime(), secondary: row.member.id })
        );

        return {
            ...result,
            items: result.items.map((row) => ({ 
                ...row.user,
                // Override user-level fields with organization-specific ones if necessary
                // e.g., the member's role in this specific org
                role: row.member.role,
                createdAt: row.member.createdAt,
                updatedAt: row.user.updatedAt,
                id: row.user.id // Keep user's ID as the primary ID for the UserDTO
            })),
        };
    }

    /**
     * Prepare a query to create a user for batching
     */
    prepareCreateUser(id: string, email: string, name: string, emailVerified: boolean) {
        const now = new Date();
        return this.db.insert(schema.authUsers).values({
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
        const now = new Date();
        return this.db.insert(schema.authAccounts).values({
            id,
            accountId: providerId === "credential" ? userId : id,
            providerId,
            userId,
            password: passwordHash,
            createdAt: now,
            updatedAt: now,
        });
    }

    /**
     * Execute multiple prepared queries atomically
     */
    async executeBatch(queries: Parameters<AppDb["batch"]>[0]) {
        return await this.db.batch(queries);
    }
}
