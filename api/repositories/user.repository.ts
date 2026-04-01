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
    async findByEmail(email: string): Promise<schema.AuthUser | null> {
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
    async findById(id: string): Promise<schema.AuthUser | null> {
        return (
            (await this.db.query.authUsers.findFirst({
                where: eq(schema.authUsers.id, id),
            })) ?? null
        );
    }

    /**
     * Update an existing user's data.
     */
    async update(id: string, data: Partial<schema.NewAuthUser>): Promise<void> {
        try {
            await this.db.update(schema.authUsers).set(data).where(eq(schema.authUsers.id, id));
        } catch (_err) {
            // Rule 19: No Exceptions in Repos
        }
    }

    /**
     * Find users belonging to an organization with cursor pagination.
     */
    async findAllByOrg(
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
                organizationId: row.member.organizationId,
                role: row.member.role,
                createdAt: row.member.createdAt,
                updatedAt: row.user.updatedAt,
                id: row.user.id,
            })),
        };
    }

    prepareInsert(id: string, email: string, name: string, emailVerified: boolean) {
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
     * Prepare a query to insert an account for batching.
     */
    prepareInsertAccount(id: string, userId: string, providerId: string, passwordHash: string) {
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

    prepareUpsert(data: schema.NewAuthUser) {
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

    prepareUpdate(id: string, data: Partial<schema.NewAuthUser>) {
        return this.db.update(schema.authUsers).set(data).where(eq(schema.authUsers.id, id));
    }

    /**
     * Prepare a query to insert an account for batching (raw data).
     */
    prepareInsertAccountRaw(data: schema.NewAuthAccount) {
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
    async findByEmails(emails: string[]): Promise<schema.AuthUser[]> {
        if (emails.length === 0) return [];
        return await this.db.query.authUsers.findMany({
            where: (u, { inArray }) => inArray(u.email, emails),
        });
    }

    async findByIds(ids: string[]): Promise<schema.AuthUser[]> {
        if (ids.length === 0) return [];
        return await this.db.query.authUsers.findMany({
            where: (u, { inArray }) => inArray(u.id, ids),
        });
    }
}
