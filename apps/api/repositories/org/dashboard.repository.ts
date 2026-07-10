import type { AppDb } from "@api/factories/db.factory";
import { FINANCIAL_CURRENCIES } from "@shared";
import * as schema from "@shared/db/schema";
import { and, eq, like, lt, sql } from "drizzle-orm";

export class DashboardRepository {
    constructor(private db: AppDb) {}

    async findDashboardMetrics(organizationId: string) {
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

        const adminCountResult = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(schema.authMembers)
            .where(
                and(
                    eq(schema.authMembers.organizationId, organizationId),
                    like(schema.authMembers.role, "%admin%")
                )
            );
        const adminCount = Number(adminCountResult[0]?.count || 0);

        const ownerCountResult = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(schema.authMembers)
            .where(
                and(
                    eq(schema.authMembers.organizationId, organizationId),
                    like(schema.authMembers.role, "%owner%")
                )
            );
        const ownerCount = Number(ownerCountResult[0]?.count || 0);

        const rawBirthdays = await this.db
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

        const paymentReadinessRows = await this.db
            .select({
                userId: schema.authMembers.userId,
                name: schema.authUsers.name,
                avatarUrl: schema.authUsers.image,
                role: schema.authMembers.role,
                hasCnyWallet: sql<number>`EXISTS(
                    SELECT 1
                    FROM ${schema.financialAccounts} fa
                    WHERE fa.owner_id = ${schema.authMembers.userId}
                      AND fa.owner_type = 'user'
                      AND fa.organization_id = ${organizationId}
                      AND fa.currency_id = ${FINANCIAL_CURRENCIES.CNY}
                      AND fa.is_active = 1
                      AND fa.archived_at IS NULL
                )`,
                hasEtdWallet: sql<number>`EXISTS(
                    SELECT 1
                    FROM ${schema.financialAccounts} fa
                    WHERE fa.owner_id = ${schema.authMembers.userId}
                      AND fa.owner_type = 'user'
                      AND fa.organization_id = ${organizationId}
                      AND fa.currency_id = ${FINANCIAL_CURRENCIES.ETD}
                      AND fa.is_active = 1
                      AND fa.archived_at IS NULL
                )`,
                hasCnyBillingPlan: sql<number>`EXISTS(
                    SELECT 1
                    FROM ${schema.financeMemberBillingPlans} mbp
                    INNER JOIN ${schema.financeBillingPlans} bp ON bp.id = mbp.billing_plan_id
                    WHERE mbp.user_id = ${schema.authMembers.userId}
                      AND mbp.organization_id = ${organizationId}
                      AND mbp.currency_id = ${FINANCIAL_CURRENCIES.CNY}
                      AND bp.is_active = 1
                )`,
            })
            .from(schema.authMembers)
            .innerJoin(schema.authUsers, eq(schema.authMembers.userId, schema.authUsers.id))
            .where(
                and(
                    eq(schema.authMembers.organizationId, organizationId),
                    like(schema.authMembers.role, "%student%")
                )
            );

        return {
            totalStorage,
            activeSessions,
            engagementRisk,
            totalMembers,
            adminCount,
            ownerCount,
            rawBirthdays,
            paymentReadinessRows,
        };
    }
}
