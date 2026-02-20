import { AppContext } from "@api/helpers/types.helpers";
import { getDbClient } from "@api/factories/db.factory";
import { UserRepository } from "@api/repositories/user.repository";
import { OrganizationRepository } from "@api/repositories/organization.repository";
import { MemberRepository } from "@api/repositories/member.repository";
import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import { ConflictError } from "@api/errors/app.error";

interface SignupData {
    email: string;
    name: string;
    password?: string;
    organizationName?: string;
}

export class RegistrationService {
    constructor(private ctx: AppContext) { }

    async signupWithOrg(input: SignupData) {
        this.ctx.var.logger.info({ email: input.email }, "Starting atomic signup with organization");
        const db = getDbClient(this.ctx);
        const userRepo = new UserRepository(this.ctx);
        const orgRepo = new OrganizationRepository(this.ctx);
        const memberRepo = new MemberRepository(this.ctx);

        // Pre-validate uniqueness
        const existingUser = await userRepo.findUserByEmail(input.email);
        if (existingUser) {
            throw new ConflictError("User already exists");
        }

        const slug = input.organizationName!.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const existingOrg = await orgRepo.findBySlug(slug);
        if (existingOrg) {
            throw new ConflictError("Organization name already taken");
        }

        // Generate absolute IDs
        const uId = nanoid();
        const oId = nanoid();
        const acctId = nanoid();
        const memberId = nanoid();
        const emailVerified = false; // By default BetterAuth sets this false

        const hashedPassword = input.password ? await hashPassword(input.password) : await hashPassword(nanoid(32));

        // Prepare queries
        const userQuery = userRepo.prepareCreateUser(uId, input.email, input.name, emailVerified);
        const accountQuery = userRepo.prepareCreateAccount(acctId, uId, "credential", hashedPassword);
        const orgQuery = orgRepo.prepareCreate(oId, input.organizationName!, slug);
        const memberQuery = memberRepo.prepareAdd(memberId, oId, uId, "owner");

        // Atomic multi-domain execution
        await db.batch([
            userQuery,
            accountQuery,
            orgQuery,
            memberQuery,
        ]);

        return {
            user: {
                id: uId,
                email: input.email,
                name: input.name,
                role: "owner"
            },
            organization: {
                id: oId,
                name: input.organizationName!,
                slug
            }
        };
    }
}
