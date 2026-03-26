import { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { eq, and, sql, lt, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { OrgRole } from "@shared/auth/permissions";

export type ImportMemberInput = {
    id?: string;
    email: string;
    name: string;
    role?: OrgRole;
    avatarUrl?: string | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    profile?: {
        id?: string;
        firstName: string;
        lastName: string;
        displayName?: string | null;
        sex: 'male' | 'female' | 'other';
        birthDate?: Date | string | null;
        createdAt?: string | Date;
        updatedAt?: string | Date;
    } | null;
    phoneNumbers?: {
        id?: string;
        countryCode: string;
        number: string;
        extension?: string;
        label: string;
        isPrimary?: boolean;
        createdAt?: string | Date;
        updatedAt?: string | Date;
    }[];
    addresses?: {
        id?: string;
        country: string;
        state: string;
        city: string;
        zip: string;
        address: string;
        label: string;
        isPrimary?: boolean;
        createdAt?: string | Date;
        updatedAt?: string | Date;
    }[];
    socialMedia?: {
        id?: string;
        type: string;
        urlOrHandle: string;
        createdAt?: string | Date;
        updatedAt?: string | Date;
    }[];
};

export class BulkMemberService {
    constructor(private db: AppDb) { }

    async getDashboardMetrics(organizationId: string) {
        const now = new Date();
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // 1. Total Storage (Sum of completed uploads)
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

        // 2. Active Sessions (Sessions for users in this org that haven't expired)
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

        // 3. Engagement Risk (Members who haven't updated/logged in for 14 days)
        const riskResult = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(schema.authMembers)
            .innerJoin(
                schema.authUsers,
                eq(schema.authMembers.userId, schema.authUsers.id)
            )
            .where(
                and(
                    eq(schema.authMembers.organizationId, organizationId),
                    lt(schema.authUsers.updatedAt, twoWeeksAgo)
                )
            );
        const engagementRisk = Number(riskResult[0]?.count || 0);

        // 4. Total Members
        const totalMembersResult = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(schema.authMembers)
            .where(eq(schema.authMembers.organizationId, organizationId));
        const totalMembers = Number(totalMembersResult[0]?.count || 0);

        // 5. Upcoming Birthdays (Next 7 days)
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

        const upcomingBirthdaysData = allProfiles.map(p => {
            if (!p.birthDate) return null;
            const bday = new Date(p.birthDate);
            const nextBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
            if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
            
            const diffDays = Math.ceil((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
                userId: p.userId,
                name: p.name!,
                birthDate: p.birthDate.toISOString(),
                daysUntil: diffDays,
            };
        }).filter((p): p is NonNullable<typeof p> => p !== null && p.daysUntil <= 7)
          .sort((a, b) => a.daysUntil - b.daysUntil);

        return {
            totalStorage,
            activeSessions,
            engagementRisk,
            totalMembers,
            upcomingBirthdays: upcomingBirthdaysData,
        };
    }

    async exportMembers(organizationId: string) {
        // We use the query API for easier relation handling in memory
        const results = await this.db.query.authMembers.findMany({
            where: eq(schema.authMembers.organizationId, organizationId),
            with: {
                user: {
                    with: {
                        profile: true,
                        phoneNumbers: true,
                        addresses: true,
                        socialMedias: {
                            with: {
                                socialMediaType: true
                            }
                        }
                    }
                }
            }
        });

        return results.map(r => {
            const user = r.user; 
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: r.role as OrgRole,
                avatarUrl: user.image,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                profile: user.profile ? {
                    id: user.profile.id,
                    firstName: user.profile.firstName,
                    lastName: user.profile.lastName,
                    displayName: user.profile.displayName,
                    sex: user.profile.sex as any,
                    birthDate: user.profile.birthDate?.toISOString(),
                    createdAt: user.profile.createdAt.toISOString(),
                    updatedAt: user.profile.updatedAt.toISOString(),
                } : null,
                phoneNumbers: user.phoneNumbers.map(p => ({
                    id: p.id,
                    countryCode: p.countryCode,
                    number: p.number,
                    extension: p.extension,
                    label: p.label,
                    isPrimary: p.isPrimary,
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString(),
                })),
                addresses: user.addresses.map(a => ({
                    id: a.id,
                    country: a.country,
                    state: a.state,
                    city: a.city,
                    zip: a.zip,
                    address: a.address,
                    label: a.label,
                    isPrimary: a.isPrimary,
                    createdAt: a.createdAt.toISOString(),
                    updatedAt: a.updatedAt.toISOString(),
                })),
                socialMedia: user.socialMedias.map(s => ({
                    id: s.id,
                    type: s.socialMediaType.name,
                    urlOrHandle: s.urlOrHandle,
                    createdAt: s.createdAt.toISOString(),
                    updatedAt: s.updatedAt.toISOString(),
                }))
            };
        });
    }

    async importMembers(organizationId: string, members: ImportMemberInput[]) {
        const results = {
            total: members.length,
            created: 0,
            linked: 0,
            failed: 0,
            errors: [] as string[],
        };

        if (members.length === 0) return results;

        try {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const validMembers = members.filter(m => emailRegex.test(m.email.trim()));
            const invalidMembers = members.filter(m => !emailRegex.test(m.email.trim()));

            results.failed += invalidMembers.length;
            invalidMembers.forEach(m => results.errors.push(`Invalid email format: ${m.email}`));

            const uniqueEmails = [...new Set(validMembers.map(m => m.email.trim()))];
            
            // 1. Pre-fetch existing data (Chunked to avoid D1 parameter limits)
            const QUERY_CHUNK_SIZE = 100;
            const existingUsers: any[] = [];
            for (let i = 0; i < uniqueEmails.length; i += QUERY_CHUNK_SIZE) {
                const chunk = uniqueEmails.slice(i, i + QUERY_CHUNK_SIZE);
                const chunkResults = await this.db.query.authUsers.findMany({
                    where: (u, { inArray }) => inArray(u.email, chunk)
                });
                existingUsers.push(...chunkResults);
            }

            const userMapByEmail = new Map(existingUsers.map(u => [u.email, u.id]));
            const userMapById = new Map(existingUsers.map(u => [u.id, u.id]));

            const userIds = existingUsers.map(u => u.id);
            const existingMembers: any[] = [];
            for (let i = 0; i < userIds.length; i += QUERY_CHUNK_SIZE) {
                const chunk = userIds.slice(i, i + QUERY_CHUNK_SIZE);
                const chunkResults = await this.db.query.authMembers.findMany({
                    where: (m, { and, eq, inArray }) => and(
                        eq(m.organizationId, organizationId),
                        inArray(m.userId, chunk)
                    )
                });
                existingMembers.push(...chunkResults);
            }
            const memberSet = new Set(existingMembers.map(m => m.userId));

            const socialTypes = await this.db.query.socialMediaTypes.findMany();
            const socialTypeMap = new Map(socialTypes.map(t => [t.name.toLowerCase(), t.id]));

            const batch: any[] = [];
            
            for (const input of validMembers) {
                // FORCE ROLE TO MEMBER
                const enforcedRole: OrgRole = "member";

                let userId = input.id || userMapByEmail.get(input.email);
                const isNewUser = !userId || (!userMapByEmail.has(input.email) && !userMapById.has(input.id!));

                if (isNewUser) {
                    userId = userId || nanoid();
                    userMapByEmail.set(input.email, userId);
                    batch.push(
                        this.db.insert(schema.authUsers).values({
                            id: userId,
                            email: input.email,
                            name: input.name,
                            image: input.avatarUrl,
                            emailVerified: true,
                            role: "user",
                            createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
                            updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                        }).onConflictDoUpdate({
                            target: schema.authUsers.email,
                            set: { 
                                name: input.name, 
                                image: input.avatarUrl,
                                updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                            }
                        })
                    );
                    results.created++;
                } else {
                    // Update existing user avatar/name
                    batch.push(
                        this.db.update(schema.authUsers)
                            .set({ 
                                name: input.name, 
                                image: input.avatarUrl,
                                updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                            })
                            .where(eq(schema.authUsers.id, userId!))
                    );
                }

                if (isNewUser || !memberSet.has(userId!)) {
                    batch.push(
                        this.db.insert(schema.authMembers).values({
                            id: nanoid(),
                            organizationId,
                            userId: userId!,
                            role: enforcedRole,
                            createdAt: new Date(),
                        }).onConflictDoNothing()
                    );
                    results.linked++;
                    memberSet.add(userId!);

                    // Also create an auth account for login if it's a new user or we want to ensure login is enabled
                    // For credential provider, accountId is usually the userId or email. 
                    // Based on UserRepository, it's the userId.
                    batch.push(
                        this.db.insert(schema.authAccounts).values({
                            id: nanoid(),
                            userId: userId!,
                            accountId: userId!,
                            providerId: "credential",
                            password: `imported_${nanoid(32)}`, // Placeholder password
                            createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
                            updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                        }).onConflictDoNothing()
                    );
                }

                // Upsert Profile
                if (input.profile) {
                    batch.push(
                        this.db.insert(schema.userProfiles).values({
                            id: input.profile.id || nanoid(),
                            userId: userId!,
                            firstName: input.profile.firstName,
                            lastName: input.profile.lastName,
                            displayName: input.profile.displayName ?? null,
                            sex: input.profile.sex,
                            birthDate: input.profile.birthDate ? new Date(input.profile.birthDate) : null,
                            createdAt: input.profile.createdAt ? new Date(input.profile.createdAt) : new Date(),
                            updatedAt: input.profile.updatedAt ? new Date(input.profile.updatedAt) : new Date(),
                        }).onConflictDoUpdate({
                            target: schema.userProfiles.userId,
                            set: {
                                firstName: input.profile.firstName,
                                lastName: input.profile.lastName,
                                displayName: input.profile.displayName ?? null,
                                sex: input.profile.sex as any,
                                birthDate: input.profile.birthDate ? new Date(input.profile.birthDate) : null,
                                updatedAt: new Date(),
                            }
                        })
                    );
                }

                // Batch clean and re-insert 1-to-many relations for simplicity in import
                if (input.phoneNumbers && input.phoneNumbers.length > 0) {
                    batch.push(this.db.delete(schema.userPhoneNumbers).where(eq(schema.userPhoneNumbers.userId, userId!)));
                    for (const p of input.phoneNumbers) {
                        batch.push(this.db.insert(schema.userPhoneNumbers).values({
                            id: p.id || nanoid(),
                            userId: userId!,
                            countryCode: p.countryCode,
                            number: p.number,
                            extension: p.extension ?? null,
                            label: p.label,
                            isPrimary: p.isPrimary ?? false,
                            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
                        }));
                    }
                }

                if (input.addresses && input.addresses.length > 0) {
                    batch.push(this.db.delete(schema.userAddresses).where(eq(schema.userAddresses.userId, userId!)));
                    for (const a of input.addresses) {
                        batch.push(this.db.insert(schema.userAddresses).values({
                            id: a.id || nanoid(),
                            userId: userId!,
                            country: a.country,
                            state: a.state,
                            city: a.city,
                            zip: a.zip,
                            address: a.address,
                            label: a.label,
                            isPrimary: a.isPrimary ?? false,
                            createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
                            updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
                        }));
                    }
                }

                if (input.socialMedia && input.socialMedia.length > 0) {
                    batch.push(this.db.delete(schema.userSocialMedias).where(eq(schema.userSocialMedias.userId, userId!)));
                    for (const s of input.socialMedia) {
                        const typeId = socialTypeMap.get(s.type.toLowerCase());
                        if (typeId) {
                            batch.push(this.db.insert(schema.userSocialMedias).values({
                                id: s.id || nanoid(),
                                userId: userId!,
                                socialMediaTypeId: typeId,
                                urlOrHandle: s.urlOrHandle,
                                createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
                                updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
                            }));
                        }
                    }
                }
            }

            // 3. Execute everything in batches
            const BATCH_CHUNK_SIZE = 100;
            for (let i = 0; i < batch.length; i += BATCH_CHUNK_SIZE) {
                const chunk = batch.slice(i, i + BATCH_CHUNK_SIZE);
                await this.db.batch(chunk as [any, ...any[]]);
            }

        } catch (err: unknown) {
            results.failed = results.total;
            const errorMessage = err instanceof Error ? err.message : String(err);
            results.errors.push(`Import failed: ${errorMessage}`);
            results.created = 0;
            results.linked = 0;
        }

        return results;
    }
}
