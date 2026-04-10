import type { MemberRepository } from "@api/repositories/member.repository";
import type { SocialMediaRepository } from "@api/repositories/social-media.repository";
import type { UserRepository } from "@api/repositories/user.repository";
import type { UserProfileRepository } from "@api/repositories/user-profile.repository";
import type { OrgRole } from "@shared/auth/permissions";
import type * as schema from "@shared/db/schema";
import type { BulkMemberItemDTO } from "@shared/schemas/dto/bulk-member.dto";
import { nanoid } from "nanoid";

export class MemberImportService {
    constructor(
        private userRepo: UserRepository,
        private memberRepo: MemberRepository,
        private profileRepo: UserProfileRepository,
        private socialRepo: SocialMediaRepository
    ) {}

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
            const preValidatedMembers = members.map((m) => ({
                ...m,
                email: m.email.trim().toLowerCase(),
            }));

            const invalidMembers = preValidatedMembers.filter((m) => !emailRegex.test(m.email));
            results.failed += invalidMembers.length;
            for (const m of invalidMembers) {
                results.errors.push(`Invalid email format: ${m.email}`);
            }

            const validMembers = preValidatedMembers.filter((m) => emailRegex.test(m.email));
            const uniqueEmails = [...new Set(validMembers.map((m) => m.email))];

            const QUERY_CHUNK_SIZE = 50;
            const existingUsers: any[] = [];
            for (let i = 0; i < uniqueEmails.length; i += QUERY_CHUNK_SIZE) {
                const chunk = uniqueEmails.slice(i, i + QUERY_CHUNK_SIZE);
                const chunkResults = await this.userRepo.findByEmails(chunk);
                existingUsers.push(...chunkResults);
            }

            // Also fetch by ID if provided in input
            const inputIds = [
                ...new Set(validMembers.map((m) => m.id).filter(Boolean) as string[]),
            ];
            for (let i = 0; i < inputIds.length; i += QUERY_CHUNK_SIZE) {
                const chunk = inputIds.slice(i, i + QUERY_CHUNK_SIZE);
                const chunkResults = await this.userRepo.findByIds(chunk);
                // Avoid duplicates if email and id queries overlaps
                for (const u of chunkResults) {
                    if (!existingUsers.find((eu) => eu.id === u.id)) {
                        existingUsers.push(u);
                    }
                }
            }

            const userMapByEmail = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u.id]));
            const userMapById = new Map(existingUsers.map((u) => [u.id, u.email.toLowerCase()]));

            const userIds = existingUsers.map((u) => u.id);
            const existingMembers: any[] = [];
            for (let i = 0; i < userIds.length; i += QUERY_CHUNK_SIZE) {
                const chunk = userIds.slice(i, i + QUERY_CHUNK_SIZE);
                const chunkResults = await this.memberRepo.findByUserIds(organizationId, chunk);
                existingMembers.push(...chunkResults);
            }
            const memberSet = new Set(existingMembers.map((m) => m.userId));

            const socialTypes = await this.socialRepo.findAllTypes();
            const socialTypeMap = new Map(
                socialTypes.map((t: schema.SocialMediaType) => [t.name.toLowerCase(), t.id])
            );

            const enforcedRole: OrgRole = "student";
            const IMPORTABLE_ROLES = ["student", "teacher", "admin"] as const;

            // Process users one by one to ensure identity consistency
            for (const input of validMembers) {
                const userByEmailId = userMapByEmail.get(input.email);

                // Identity Resolution & Consistency Check
                if (input.id) {
                    if (userByEmailId && userByEmailId !== input.id) {
                        results.failed++;
                        results.errors.push(
                            `Identity Conflict: Email ${input.email} belongs to user ${userByEmailId}, but payload provided id ${input.id}`
                        );
                        continue;
                    }
                    if (userMapById.has(input.id) && userMapById.get(input.id) !== input.email) {
                        results.failed++;
                        results.errors.push(
                            `Identity Conflict: ID ${input.id} belongs to email ${userMapById.get(input.id)}, but payload provided email ${input.email}`
                        );
                        continue;
                    }
                }

                const targetUserId = input.id || userByEmailId || nanoid();
                const isNewUser = !userByEmailId && (!input.id || !userMapById.has(input.id));
                const userBatch: any[] = [];

                if (isNewUser) {
                    userMapByEmail.set(input.email, targetUserId);
                    userMapById.set(targetUserId, input.email);
                    userBatch.push(
                        this.userRepo.prepareUpsert({
                            id: targetUserId,
                            email: input.email,
                            name: input.name,
                            image: input.avatarUrl,
                            emailVerified: true,
                            role: "user",
                            createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
                            updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                        })
                    );
                    results.created++;
                } else {
                    userBatch.push(
                        this.userRepo.prepareUpdate(targetUserId, {
                            name: input.name,
                            image: input.avatarUrl,
                            updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                        })
                    );
                }

                // Security: Default to student, only allow upgrades to teacher/admin via import.
                // Owner role must be granted manually via UI/DB for maximum security.
                const roleFromInput = input.role as any;
                const roleToUse = IMPORTABLE_ROLES.includes(roleFromInput)
                    ? (roleFromInput as OrgRole)
                    : enforcedRole;

                if (isNewUser || !memberSet.has(targetUserId)) {
                    userBatch.push(
                        this.memberRepo.prepareInsertQuery(
                            nanoid(),
                            organizationId,
                            targetUserId,
                            roleToUse
                        )
                    );
                    results.linked++;
                    memberSet.add(targetUserId);

                    userBatch.push(
                        this.userRepo.prepareAccountInsertRaw({
                            id: nanoid(),
                            userId: targetUserId,
                            accountId: targetUserId,
                            providerId: "credential",
                            password: null,
                            createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
                            updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
                        })
                    );
                }

                if (input.profile) {
                    userBatch.push(
                        this.profileRepo.prepareUpsert({
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
                    );
                }

                if (input.phones && input.phones.length > 0) {
                    userBatch.push(this.profileRepo.preparePhoneDelete(targetUserId));
                    for (const p of input.phones) {
                        userBatch.push(
                            this.profileRepo.preparePhoneInsert({
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
                    userBatch.push(this.profileRepo.prepareAddressDelete(targetUserId));
                    for (const a of input.addresses) {
                        userBatch.push(
                            this.profileRepo.prepareAddressInsert({
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

                if (input.socials && input.socials.length > 0) {
                    userBatch.push(this.profileRepo.prepareSocialMediaDelete(targetUserId));
                    for (const s of input.socials) {
                        const typeId = socialTypeMap.get(s.type.toLowerCase());
                        if (typeId) {
                            userBatch.push(
                                this.profileRepo.prepareSocialMediaInsert({
                                    id: s.id || nanoid(),
                                    userId: targetUserId,
                                    socialMediaTypeId: typeId as string,
                                    urlOrHandle: s.urlOrHandle,
                                    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
                                    updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
                                })
                            );
                        }
                    }
                }

                if (userBatch.length > 0) {
                    await this.userRepo.executeBatch(userBatch);
                }
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            results.errors.push(
                `Import halted by critical error: ${errorMessage}. Partial data may have been committed for successfully processed users.`
            );
        }

        return results;
    }
}
