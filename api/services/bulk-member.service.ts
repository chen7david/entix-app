import { AppDb } from "@api/factories/db.factory";
import * as schema from "@shared/db/schema";
import { eq, and, sql, lt, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { OrgRole } from "@shared/auth/permissions";

export type ImportMemberInput = {
    email: string;
    name: string;
    role?: OrgRole;
    avatarUrl?: string | null;
    profile?: {
        firstName: string;
        lastName: string;
        sex: 'male' | 'female' | 'other';
        birthDate?: Date | string;
    } | null;
    phoneNumbers?: {
        countryCode: string;
        number: string;
        extension?: string;
        label: string;
        isPrimary?: boolean;
    }[];
    addresses?: {
        country: string;
        state: string;
        city: string;
        zip: string;
        address: string;
        label: string;
        isPrimary?: boolean;
    }[];
    socialMedia?: {
        type: string;
        urlOrHandle: string;
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
        // We use authUsers.updatedAt as a proxy for last activity if no lastLogin exists
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
                email: user.email,
                name: user.name,
                role: r.role as OrgRole,
                avatarUrl: user.image,
                profile: user.profile ? {
                    firstName: user.profile.firstName,
                    lastName: user.profile.lastName,
                    sex: user.profile.sex as 'male' | 'female' | 'other',
                    birthDate: user.profile.birthDate?.toISOString(),
                } : null,
                phoneNumbers: user.phoneNumbers.map(p => ({
                    countryCode: p.countryCode,
                    number: p.number,
                    extension: p.extension || undefined,
                    label: p.label,
                    isPrimary: p.isPrimary
                })),
                addresses: user.addresses.map(a => ({
                    country: a.country,
                    state: a.state,
                    city: a.city,
                    zip: a.zip,
                    address: a.address,
                    label: a.label,
                    isPrimary: a.isPrimary
                })),
                socialMedia: user.socialMedias.map(s => ({
                    type: s.socialMediaType.name,
                    urlOrHandle: s.urlOrHandle
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
            const uniqueEmails = [...new Set(members.map(m => m.email))];
            
            // 1. Pre-fetch existing data
            const existingUsers = await this.db.query.authUsers.findMany({
                where: (u, { inArray }) => inArray(u.email, uniqueEmails)
            });
            const userMap = new Map(existingUsers.map(u => [u.email, u.id]));

            const existingMembers = await this.db.query.authMembers.findMany({
                where: (m, { and, eq, inArray }) => and(
                    eq(m.organizationId, organizationId),
                    inArray(m.userId, existingUsers.map(u => u.id).concat(['__placeholder__']))
                )
            });
            const memberSet = new Set(existingMembers.map(m => m.userId));

            const socialTypes = await this.db.query.socialMediaTypes.findMany();
            const socialTypeMap = new Map(socialTypes.map(t => [t.name.toLowerCase(), t.id]));

            const batch: any[] = [];
            
            for (const input of members) {
                // FORCE ROLE TO MEMBER
                const enforcedRole: OrgRole = "member";

                let userId = userMap.get(input.email);
                const isNewUser = !userId;

                if (isNewUser) {
                    userId = nanoid();
                    userMap.set(input.email, userId);
                    batch.push(
                        this.db.insert(schema.authUsers).values({
                            id: userId,
                            email: input.email,
                            name: input.name,
                            image: input.avatarUrl,
                            emailVerified: true,
                            role: "user",
                        }).onConflictDoUpdate({
                            target: schema.authUsers.email,
                            set: { 
                                name: input.name, 
                                image: input.avatarUrl,
                                updatedAt: new Date()
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
                                updatedAt: new Date() 
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
                }

                // Upsert Profile
                if (input.profile) {
                    batch.push(
                        this.db.insert(schema.userProfiles).values({
                            id: nanoid(),
                            userId: userId!,
                            firstName: input.profile.firstName,
                            lastName: input.profile.lastName,
                            sex: input.profile.sex,
                            birthDate: input.profile.birthDate ? new Date(input.profile.birthDate) : null,
                        }).onConflictDoUpdate({
                            target: schema.userProfiles.userId,
                            set: {
                                firstName: input.profile.firstName,
                                lastName: input.profile.lastName,
                                sex: input.profile.sex,
                                birthDate: input.profile.birthDate ? new Date(input.profile.birthDate) : null,
                                updatedAt: new Date()
                            }
                        })
                    );
                }

                // Batch clean and re-insert 1-to-many relations for simplicity in import
                if (input.phoneNumbers && input.phoneNumbers.length > 0) {
                    batch.push(this.db.delete(schema.userPhoneNumbers).where(eq(schema.userPhoneNumbers.userId, userId!)));
                    for (const p of input.phoneNumbers) {
                        batch.push(this.db.insert(schema.userPhoneNumbers).values({
                            id: nanoid(),
                            userId: userId!,
                            countryCode: p.countryCode,
                            number: p.number,
                            extension: p.extension,
                            label: p.label,
                            isPrimary: p.isPrimary ?? false,
                        }));
                    }
                }

                if (input.addresses && input.addresses.length > 0) {
                    batch.push(this.db.delete(schema.userAddresses).where(eq(schema.userAddresses.userId, userId!)));
                    for (const a of input.addresses) {
                        batch.push(this.db.insert(schema.userAddresses).values({
                            id: nanoid(),
                            userId: userId!,
                            country: a.country,
                            state: a.state,
                            city: a.city,
                            zip: a.zip,
                            address: a.address,
                            label: a.label,
                            isPrimary: a.isPrimary ?? false,
                        }));
                    }
                }

                if (input.socialMedia && input.socialMedia.length > 0) {
                    batch.push(this.db.delete(schema.userSocialMedias).where(eq(schema.userSocialMedias.userId, userId!)));
                    for (const s of input.socialMedia) {
                        const typeId = socialTypeMap.get(s.type.toLowerCase());
                        if (typeId) {
                            batch.push(this.db.insert(schema.userSocialMedias).values({
                                id: nanoid(),
                                userId: userId!,
                                socialMediaTypeId: typeId,
                                urlOrHandle: s.urlOrHandle,
                            }));
                        }
                    }
                }
            }

            // 3. Execute everything in batches
            const CHUNK_SIZE = 100;
            for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
                const chunk = batch.slice(i, i + CHUNK_SIZE);
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
