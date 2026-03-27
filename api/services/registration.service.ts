import { ConflictError } from "@api/errors/app.error";
import type { MemberRepository } from "@api/repositories/member.repository";
import type { OrganizationRepository } from "@api/repositories/organization.repository";
import type { UserRepository } from "@api/repositories/user.repository";
import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";

type SignupData = {
    email: string;
    name: string;
    password?: string;
    organizationName?: string;
};

export class RegistrationService {
    constructor(
        private userRepo: UserRepository,
        private orgRepo: OrganizationRepository,
        private memberRepo: MemberRepository
    ) {}

    async signupWithOrg(input: SignupData) {
        const existingUser = await this.userRepo.findUserByEmail(input.email);
        if (existingUser) {
            throw new ConflictError("User already exists");
        }

        const slug = input.organizationName!.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const existingOrg = await this.orgRepo.findBySlug(slug);
        if (existingOrg) {
            throw new ConflictError("Organization name already taken");
        }

        const uId = nanoid();
        const oId = nanoid();
        const acctId = nanoid();
        const memberId = nanoid();
        const emailVerified = false; // By default BetterAuth sets this false

        const hashedPassword = input.password
            ? await hashPassword(input.password)
            : await hashPassword(nanoid(32));

        const userQuery = this.userRepo.prepareCreateUser(
            uId,
            input.email,
            input.name,
            emailVerified
        );
        const accountQuery = this.userRepo.prepareCreateAccount(
            acctId,
            uId,
            "credential",
            hashedPassword
        );
        const orgQuery = this.orgRepo.prepareCreate(oId, input.organizationName!, slug);
        const memberQuery = this.memberRepo.prepareAdd(memberId, oId, uId, "owner");

        await this.userRepo.executeBatch([userQuery, accountQuery, orgQuery, memberQuery]);

        return {
            user: {
                id: uId,
                email: input.email,
                name: input.name,
                role: "owner",
            },
            organization: {
                id: oId,
                name: input.organizationName!,
                slug,
            },
        };
    }

    async createUserAndMember(email: string, name: string, organizationId: string, role: string) {
        const existingUser = await this.userRepo.findUserByEmail(email);
        if (existingUser) {
            throw new ConflictError("User with this email already exists");
        }

        const uId = nanoid();
        const acctId = nanoid();
        const memberId = nanoid();
        const emailVerified = false;

        const dummyPassword = nanoid(32);
        const hashedPassword = await hashPassword(dummyPassword);

        const userQuery = this.userRepo.prepareCreateUser(uId, email, name, emailVerified);
        const accountQuery = this.userRepo.prepareCreateAccount(
            acctId,
            uId,
            "credential",
            hashedPassword
        );
        const memberQuery = this.memberRepo.prepareAdd(memberId, organizationId, uId, role);

        await this.userRepo.executeBatch([userQuery, accountQuery, memberQuery]);

        return {
            member: {
                id: memberId,
                userId: uId,
                organizationId,
                role,
                createdAt: new Date(),
            },
            user: {
                id: uId,
                email,
                name,
                emailVerified,
            },
        };
    }
}
