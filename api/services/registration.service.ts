import { ConflictError, InternalServerError } from "@api/errors/app.error";
import type { MemberRepository } from "@api/repositories/member.repository";
import type { OrganizationRepository } from "@api/repositories/organization.repository";
import type { UserRepository } from "@api/repositories/user.repository";
import { FINANCIAL_CURRENCIES } from "@shared";
import { hashPassword } from "better-auth/crypto";
import type { PinoLogger } from "hono-pino";
import { nanoid } from "nanoid";
import { BaseService } from "./base.service";
import type { UserFinancialService } from "./financial/user-financial.service";
import type { UserService } from "./user.service";

type SignupData = {
    email: string;
    name: string;
    password?: string;
    organizationName?: string;
};

export class RegistrationService extends BaseService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly orgRepo: OrganizationRepository,
        private readonly memberRepo: MemberRepository,
        private readonly userFinancialService: UserFinancialService,
        private readonly userService: UserService,
        private readonly frontendUrl: string,
        private readonly logger: PinoLogger
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

        try {
            const uId = nanoid();
            const oId = nanoid();
            const acctId = nanoid();
            const memberId = nanoid();
            const emailVerified = false; // By default BetterAuth sets this false

            const hashedPassword = input.password
                ? await hashPassword(input.password)
                : await hashPassword(nanoid(32));

            const userQuery = this.userRepo.prepareInsert(
                uId,
                input.email,
                input.name,
                emailVerified
            );
            const accountQuery = this.userRepo.prepareAccountInsert(
                acctId,
                uId,
                "credential",
                hashedPassword
            );
            const orgQuery = this.orgRepo.prepareInsert(oId, organizationName, slug);
            const memberQuery = this.memberRepo.prepareInsertQuery(memberId, oId, uId, "owner");

            // TODO: Wallet creation is currently outside the D1 batch, making it non-atomic.
            // If createUserAccount fails after the org/member batch succeeds, the org exists
            // without a wallet. Tracked in [issue/task reference]. For now, the try/catch
            // ensures the error surfaces clearly rather than silently.
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
        } catch (err) {
            if (err instanceof ConflictError) throw err;

            this.logger.error({ err, input }, "Failed to setup organization during signup");
            throw new InternalServerError("Failed to setup organization, please try again");
        }
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
        const accountQuery = this.userRepo.prepareAccountInsert(
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

        // 🚀 Orchestrate Email (Fire-and-forget per Rule 14)
        const resetUrl = `${this.frontendUrl}/auth/reset-password`;
        this.userService.sendPasswordResetEmail(email, resetUrl).catch((err: unknown) => {
            this.logger.error(
                { err, email, memberId },
                "Password reset email failed after member creation"
            );
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
