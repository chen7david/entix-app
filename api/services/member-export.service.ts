import type { MemberRepository } from "@api/repositories/member.repository";
import type { OrgRole } from "@shared/auth/permissions";

export class MemberExportService {
    constructor(private memberRepo: MemberRepository) {}

    async exportMembers(organizationId: string) {
        const results = await this.memberRepo.findAllDetailed(organizationId);

        return results.map((r) => {
            const user = r.user;
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: r.role as OrgRole,
                avatarUrl: user.image,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                profile: user.profile
                    ? {
                          id: user.profile.id,
                          firstName: user.profile.firstName,
                          lastName: user.profile.lastName,
                          displayName: user.profile.displayName,
                          sex: user.profile.sex as "male" | "female" | "other",
                          birthDate: user.profile.birthDate?.toISOString(),
                          createdAt: user.profile.createdAt.toISOString(),
                          updatedAt: user.profile.updatedAt.toISOString(),
                      }
                    : null,
                phoneNumbers: user.phoneNumbers.map((p) => ({
                    id: p.id,
                    countryCode: p.countryCode,
                    number: p.number,
                    extension: p.extension,
                    label: p.label,
                    isPrimary: p.isPrimary,
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString(),
                })),
                addresses: user.addresses.map((a) => ({
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
                socialMedia: user.socialMedias.map((s) => ({
                    id: s.id,
                    type: s.socialMediaType.name,
                    urlOrHandle: s.urlOrHandle,
                    createdAt: s.createdAt.toISOString(),
                    updatedAt: s.updatedAt.toISOString(),
                })),
            };
        });
    }
}
