import type { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";

export class DashboardService {
    constructor(private db: AppDb) {}

    async getDashboardMetrics(organizationId: string) {
        const now = new Date();
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const storageResult = await this.db
            .select({ total: sql<number>`sum(${schema.uploads.fileSize})` })
            .from(schema.uploads)
            .where(
                and(
                    eq(schema.uploads.organizationId, organizationId),
                    eq(schema.uploads.status, "completed")
                )
            );
        const totalStorage = Number(storageResult[0]?.total || 0);

        const activeSessionsResult = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(schema.authSessions)
            .innerJoin(
                schema.authMembers,
                eq(schema.authSessions.userId, schema.authMembers.userId)
            )
            .where(
                and(
                    eq(schema.authMembers.organizationId, organizationId),
                    sql`${schema.authSessions.expiresAt} > ${now.getTime()}`
                )
            );
        const activeSessions = Number(activeSessionsResult[0]?.count || 0);

        const riskResult = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(schema.authMembers)
            .innerJoin(schema.authUsers, eq(schema.authMembers.userId, schema.authUsers.id))
            .where(
                and(
                    eq(schema.authMembers.organizationId, organizationId),
                    lt(schema.authUsers.updatedAt, twoWeeksAgo)
                )
            );
        const engagementRisk = Number(riskResult[0]?.count || 0);

        const totalMembersResult = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(schema.authMembers)
            .where(eq(schema.authMembers.organizationId, organizationId));
        const totalMembers = Number(totalMembersResult[0]?.count || 0);

        const allProfiles = await this.db
            .select({
                userId: schema.userProfiles.userId,
                name: schema.authUsers.name,
                birthDate: schema.userProfiles.birthDate,
            })
            .from(schema.userProfiles)
            .innerJoin(schema.authUsers, eq(schema.userProfiles.userId, schema.authUsers.id))
            .innerJoin(schema.authMembers, eq(schema.authUsers.id, schema.authMembers.userId))
            .where(
                and(
                    eq(schema.authMembers.organizationId, organizationId),
                    sql`${schema.userProfiles.birthDate} IS NOT NULL`
                )
            );

        const upcomingBirthdays = allProfiles
            .map((p) => {
                if (!p.birthDate) return null;
                const bday = new Date(p.birthDate);
                const nextBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
                if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
                const daysUntil = Math.ceil(
                    (nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                return {
                    userId: p.userId,
                    name: p.name ?? "Unknown User",
                    birthDate: p.birthDate.toISOString(),
                    daysUntil,
                };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null && p.daysUntil <= 7)
            .sort((a, b) => a.daysUntil - b.daysUntil);

        return {
            totalStorage,
            activeSessions,
            engagementRisk,
            totalMembers,
            upcomingBirthdays,
        };
    }
}
