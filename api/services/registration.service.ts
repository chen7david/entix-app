import { ConflictError } from "@api/errors/app.error";
import type { MemberRepository } from "@api/repositories/member.repository";
import type { OrganizationRepository } from "@api/repositories/organization.repository";
import type { UserRepository } from "@api/repositories/user.repository";
import { FINANCIAL_CURRENCIES } from "@shared";
import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import { BaseService } from "./base.service";
import type { UserFinancialService } from "./financial/user-financial.service";

type SignupData = {
    email: string;
    name: string;
    password?: string;
    organizationName?: string;
};

export class RegistrationService extends BaseService {
    constructor(
        private userRepo: UserRepository,
        private orgRepo: OrganizationRepository,
        private memberRepo: MemberRepository,
        private userFinancialService: UserFinancialService
    ) {
        super();
    }

    async signupWithOrg(input: SignupData) {
        if (!input.organizationName) {
            throw new ConflictError("Organization name is required for registration");
        }

        const existingUser = await this.userRepo.findByEmail(input.email);
        if (existingUser) {
            throw new ConflictError("User already exists");
        }

        const organizationName = input.organizationName;
        const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-");
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

        const userQuery = this.userRepo.prepareInsert(uId, input.email, input.name, emailVerified);
        const accountQuery = this.userRepo.prepareInsertAccount(
            acctId,
            uId,
            "credential",
            hashedPassword
        );
        const orgQuery = this.orgRepo.prepareInsert(oId, organizationName, slug);
        const memberQuery = this.memberRepo.prepareInsertQuery(memberId, oId, uId, "owner");

        await this.userRepo.executeBatch([userQuery, accountQuery, orgQuery, memberQuery]);

        // Auto-provision personal accounts for the user ( Ticket 5 refactor)
        await this.userFinancialService.createUserAccount({
            name: "Points",
            currencyId: FINANCIAL_CURRENCIES.ETD,
            userId: uId,
            orgId: oId,
        });
        await this.userFinancialService.createUserAccount({
            name: "Savings",
            currencyId: FINANCIAL_CURRENCIES.USD,
            userId: uId,
            orgId: oId,
        });

        return {
            user: {
                id: uId,
                email: input.email,
                name: input.name,
                role: "owner",
            },
            organization: {
                id: oId,
                name: organizationName,
                slug,
            },
        };
    }

    async createUserAndMember(email: string, name: string, organizationId: string, role: string) {
        const existingUser = await this.userRepo.findByEmail(email);
        if (existingUser) {
            throw new ConflictError("User with this email already exists");
        }

        const uId = nanoid();
        const acctId = nanoid();
        const memberId = nanoid();
        const emailVerified = false;

        const dummyPassword = nanoid(32);
        const hashedPassword = await hashPassword(dummyPassword);

        const userQuery = this.userRepo.prepareInsert(uId, email, name, emailVerified);
        const accountQuery = this.userRepo.prepareInsertAccount(
            acctId,
            uId,
            "credential",
            hashedPassword
        );
        const memberQuery = this.memberRepo.prepareInsertQuery(memberId, organizationId, uId, role);

        await this.userRepo.executeBatch([userQuery, accountQuery, memberQuery]);

        // Auto-provision personal accounts for the user ( Ticket 5 refactor)
        await this.userFinancialService.createUserAccount({
            name: "Points",
            currencyId: FINANCIAL_CURRENCIES.ETD,
            userId: uId,
            orgId: organizationId,
        });
        await this.userFinancialService.createUserAccount({
            name: "Savings",
            currencyId: FINANCIAL_CURRENCIES.USD,
            userId: uId,
            orgId: organizationId,
        });

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
