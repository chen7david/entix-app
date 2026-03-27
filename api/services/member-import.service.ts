import type { AppDb } from "@api/factories/db.factory";
import type { OrgRole } from "@shared/auth/permissions";
import * as schema from "@shared/db/schema";
import type { BulkMemberItemDTO } from "@shared/schemas/dto/bulk-member.dto";
import { eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { nanoid } from "nanoid";

export class MemberImportService {
    constructor(private db: AppDb) {}

    async importMembers(organizationId: string, members: BulkMemberItemDTO[]) {
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
            const validMembers = members.filter((m) => emailRegex.test(m.email.trim()));
            const invalidMembers = members.filter((m) => !emailRegex.test(m.email.trim()));

            results.failed += invalidMembers.length;
            invalidMembers.forEach((m) => results.errors.push(`Invalid email format: ${m.email}`));

            const uniqueEmails = [...new Set(validMembers.map((m) => m.email.trim()))];

            const QUERY_CHUNK_SIZE = 50;
            const existingUsers: schema.AuthUser[] = [];
            for (let i = 0; i < uniqueEmails.length; i += QUERY_CHUNK_SIZE) {
                const chunk = uniqueEmails.slice(i, i + QUERY_CHUNK_SIZE);
                const chunkResults = await this.db.query.authUsers.findMany({
                    where: (u, { inArray }) => inArray(u.email, chunk),
                });
                existingUsers.push(...chunkResults);
            }

            const userMapByEmail = new Map(existingUsers.map((u) => [u.email, u.id]));
            const userMapById = new Map(existingUsers.map((u) => [u.id, u.id]));

            const userIds = existingUsers.map((u) => u.id);
            const existingMembers: schema.AuthMember[] = [];
            for (let i = 0; i < userIds.length; i += QUERY_CHUNK_SIZE) {
                const chunk = userIds.slice(i, i + QUERY_CHUNK_SIZE);
                const chunkResults = await this.db.query.authMembers.findMany({
                    where: (m, { and, eq, inArray }) =>
                        and(eq(m.organizationId, organizationId), inArray(m.userId, chunk)),
                });
                existingMembers.push(...chunkResults);
            }
            const memberSet = new Set(existingMembers.map((m) => m.userId));

            const socialTypes = await this.db.query.socialMediaTypes.findMany();
            const socialTypeMap = new Map(socialTypes.map((t) => [t.name.toLowerCase(), t.id]));

            const enforcedRole: OrgRole = "member";
            const batch: BatchItem<"sqlite">[] = [];

            for (const input of validMembers) {
                const existingUserId = input.id || userMapByEmail.get(input.email);
                const isNewUser =
                    !existingUserId ||
                    (!userMapByEmail.has(input.email) && (!input.id || !userMapById.has(input.id)));

                const targetUserId = existingUserId || nanoid();

                if (isNewUser) {
                    userMapByEmail.set(input.email, targetUserId);
                    batch.push(
                        this.db
                            .insert(schema.authUsers)
                            .values({
                                id: targetUserId,
                                email: input.email,
                                name: input.name,
                                image: input.avatarUrl,
                                emailVerified: true,
                                role: "user",
                                createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
                                updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                            })
                            .onConflictDoUpdate({
                                target: schema.authUsers.email,
                                set: {
                                    name: input.name,
                                    image: input.avatarUrl,
                                    updatedAt: input.updatedAt
                                        ? new Date(input.updatedAt)
                                        : new Date(),
                                },
                            })
                    );
                    results.created++;
                } else {
                    batch.push(
                        this.db
                            .update(schema.authUsers)
                            .set({
                                name: input.name,
                                image: input.avatarUrl,
                                updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                            })
                            .where(eq(schema.authUsers.id, targetUserId))
                    );
                }

                if (isNewUser || !memberSet.has(targetUserId)) {
                    batch.push(
                        this.db
                            .insert(schema.authMembers)
                            .values({
                                id: nanoid(),
                                organizationId,
                                userId: targetUserId,
                                role: enforcedRole,
                                createdAt: new Date(),
                            })
                            .onConflictDoNothing()
                    );
                    results.linked++;
                    memberSet.add(targetUserId);

                    batch.push(
                        this.db
                            .insert(schema.authAccounts)
                            .values({
                                id: nanoid(),
                                userId: targetUserId,
                                accountId: targetUserId,
                                providerId: "credential",
                                password: null,
                                createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
                                updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                            })
                            .onConflictDoNothing()
                    );
                }

                if (input.profile) {
                    batch.push(
                        this.db
                            .insert(schema.userProfiles)
                            .values({
                                id: input.profile.id || nanoid(),
                                userId: targetUserId,
                                firstName: input.profile.firstName,
                                lastName: input.profile.lastName,
                                displayName: input.profile.displayName ?? null,
                                sex: input.profile.sex,
                                birthDate: input.profile.birthDate
                                    ? new Date(input.profile.birthDate)
                                    : null,
                                createdAt: input.profile.createdAt
                                    ? new Date(input.profile.createdAt)
                                    : new Date(),
                                updatedAt: input.profile.updatedAt
                                    ? new Date(input.profile.updatedAt)
                                    : new Date(),
                            })
                            .onConflictDoUpdate({
                                target: schema.userProfiles.userId,
                                set: {
                                    firstName: input.profile.firstName,
                                    lastName: input.profile.lastName,
                                    displayName: input.profile.displayName ?? null,
                                    sex: input.profile.sex,
                                    birthDate: input.profile.birthDate
                                        ? new Date(input.profile.birthDate)
                                        : null,
                                    updatedAt: new Date(),
                                },
                            })
                    );
                }

                if (input.phoneNumbers && input.phoneNumbers.length > 0) {
                    batch.push(
                        this.db
                            .delete(schema.userPhoneNumbers)
                            .where(eq(schema.userPhoneNumbers.userId, targetUserId))
                    );
                    for (const p of input.phoneNumbers) {
                        batch.push(
                            this.db.insert(schema.userPhoneNumbers).values({
                                id: p.id || nanoid(),
                                userId: targetUserId,
                                countryCode: p.countryCode,
                                number: p.number,
                                extension: p.extension ?? null,
                                label: p.label,
                                isPrimary: p.isPrimary ?? false,
                                createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
                                updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
                            })
                        );
                    }
                }

                if (input.addresses && input.addresses.length > 0) {
                    batch.push(
                        this.db
                            .delete(schema.userAddresses)
                            .where(eq(schema.userAddresses.userId, targetUserId))
                    );
                    for (const a of input.addresses) {
                        batch.push(
                            this.db.insert(schema.userAddresses).values({
                                id: a.id || nanoid(),
                                userId: targetUserId,
                                country: a.country,
                                state: a.state,
                                city: a.city,
                                zip: a.zip,
                                address: a.address,
                                label: a.label,
                                isPrimary: a.isPrimary ?? false,
                                createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
                                updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
                            })
                        );
                    }
                }

                if (input.socialMedia && input.socialMedia.length > 0) {
                    batch.push(
                        this.db
                            .delete(schema.userSocialMedias)
                            .where(eq(schema.userSocialMedias.userId, targetUserId))
                    );
                    for (const s of input.socialMedia) {
                        const typeId = socialTypeMap.get(s.type.toLowerCase());
                        if (typeId) {
                            batch.push(
                                this.db.insert(schema.userSocialMedias).values({
                                    id: s.id || nanoid(),
                                    userId: targetUserId,
                                    socialMediaTypeId: typeId,
                                    urlOrHandle: s.urlOrHandle,
                                    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
                                    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
                                })
                            );
                        }
                    }
                }
            }

            const BATCH_CHUNK_SIZE = 10;
            for (let i = 0; i < batch.length; i += BATCH_CHUNK_SIZE) {
                const chunk = batch.slice(i, i + BATCH_CHUNK_SIZE);
                if (chunk.length > 0) {
                    await this.db.batch(chunk as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
                }
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
