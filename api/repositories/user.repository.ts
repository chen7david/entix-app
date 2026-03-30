import type { AppDb } from "@api/factories/db.factory";
import { buildCursorPagination, processPaginatedResult } from "@api/helpers/pagination.helpers";
import * as schema from "@shared/db/schema";
import { and, eq, like, or } from "drizzle-orm";

/**
 * Repository for user-related database operations.
 * Strictly limited to D1/Drizzle database access.
 */
export class UserRepository {
    constructor(private db: AppDb) {}

    /**
     * Find user by email address.
     * Returns null if not found.
     */
    async findUserByEmail(email: string): Promise<schema.AuthUser | null> {
        return (
            (await this.db.query.authUsers.findFirst({
                where: eq(schema.authUsers.email, email),
            })) ?? null
        );
    }

    /**
     * Find user by ID.
     * Returns null if not found.
     */
    async findUserById(userId: string): Promise<schema.AuthUser | null> {
        return (
            (await this.db.query.authUsers.findFirst({
                where: eq(schema.authUsers.id, userId),
            })) ?? null
        );
    }

    /**
     * Update an existing user's data.
     */
    async updateUser(userId: string, data: Partial<schema.NewAuthUser>): Promise<void> {
        await this.db.update(schema.authUsers).set(data).where(eq(schema.authUsers.id, userId));
    }

    /**
     * Find all users belonging to an organization.
     * Queries via the member table to scope results to the given org.
     */
    async findUsersByOrganization(
        organizationId: string,
        limit: number,
        cursor?: string,
        direction: "next" | "prev" = "next",
        search?: string
    ) {
        const { where: cursorWhere, orderBy } = buildCursorPagination(
            schema.authMembers.createdAt,
            schema.authMembers.id,
            cursor,
            direction
        );

        const conditions = [eq(schema.authMembers.organizationId, organizationId)];
        if (cursorWhere) conditions.push(cursorWhere);

        if (search) {
            const searchFilter = or(
                like(schema.authUsers.name, `%${search}%`),
                like(schema.authUsers.email, `%${search}%`)
            );
            if (searchFilter) {
                conditions.push(searchFilter);
            }
        }

        const membersJoined = await this.db
            .select({ member: schema.authMembers, user: schema.authUsers })
            .from(schema.authMembers)
            .innerJoin(schema.authUsers, eq(schema.authMembers.userId, schema.authUsers.id))
            .where(and(...conditions))
            .orderBy(...orderBy)
            .limit(limit + 1);

        const result = processPaginatedResult(membersJoined, limit, direction, (row) => ({
            primary: row.member.createdAt.getTime(),
            secondary: row.member.id,
        }));

        return {
            ...result,
            items: result.items.map((row) => ({
                ...row.user,
                user: row.user,
                userId: row.user.id,
                role: row.member.role,
                createdAt: row.member.createdAt,
                updatedAt: row.user.updatedAt,
                id: row.user.id,
            })),
        };
    }

    /**
     * Prepare a query to create a user for batching.
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
     * Prepare a query to create an account for batching.
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
     * Prepare a query to upsert a user for batching.
     */
    prepareUpsertUser(data: schema.NewAuthUser) {
        return this.db
            .insert(schema.authUsers)
            .values(data)
            .onConflictDoUpdate({
                target: schema.authUsers.email,
                set: {
                    name: data.name,
                    image: data.image,
                    updatedAt: data.updatedAt,
                },
            });
    }

    /**
     * Prepare a query to update a user for batching.
     */
    prepareUpdateUser(userId: string, data: Partial<schema.NewAuthUser>) {
        return this.db.update(schema.authUsers).set(data).where(eq(schema.authUsers.id, userId));
    }

    /**
     * Prepare a query to insert an account for batching.
     */
    prepareInsertAccount(data: schema.NewAuthAccount) {
        return this.db.insert(schema.authAccounts).values(data).onConflictDoNothing();
    }

    /**
     * Execute multiple prepared queries atomically.
     */
    async executeBatch(queries: any[]) {
        if (queries.length === 0) return;
        return await this.db.batch(queries as any);
    }

    /**
     * Find multiple users by their email addresses.
     */
    async findUsersByEmails(emails: string[]): Promise<schema.AuthUser[]> {
        if (emails.length === 0) return [];
        return await this.db.query.authUsers.findMany({
            where: (u, { inArray }) => inArray(u.email, emails),
        });
    }

    /**
     * Find multiple users by their IDs.
     */
    async findUsersByIds(ids: string[]): Promise<schema.AuthUser[]> {
        if (ids.length === 0) return [];
        return await this.db.query.authUsers.findMany({
            where: (u, { inArray }) => inArray(u.id, ids),
        });
    }
}
