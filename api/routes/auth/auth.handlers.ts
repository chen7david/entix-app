import { AuthRoutes } from "./auth.routes";
import { AppHandler } from '@api/helpers/types.helpers';
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { UserRepository } from "@api/repositories/user.repository";
import { OrganizationRepository } from "@api/repositories/organization.repository";
import { MemberRepository } from "@api/repositories/member.repository";
import { ConflictError, InternalServerError } from "@api/errors/app.error";

export class AuthHandler {
    static signupWithOrg: AppHandler<typeof AuthRoutes.signupWithOrg> = async (c) => {
        const { email, password, name, organizationName } = c.req.valid("json");

        const userRepo = new UserRepository(c);
        const orgRepo = new OrganizationRepository(c);
        const memberRepo = new MemberRepository(c);

        c.var.logger.info({ email, organizationName }, "Signup with organization request");

        // Check if user already exists
        const existingUser = await userRepo.findUserByEmail(email);
        if (existingUser) {
            c.var.logger.warn({ email }, "User already exists");
            throw new ConflictError("User already exists");
        }

        // Check if organization slug already exists
        const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const existingOrg = await orgRepo.findBySlug(slug);
        if (existingOrg) {
            c.var.logger.warn({ slug }, "Organization name already taken");
            throw new ConflictError("Organization name already taken");
        }

        // Create user via repository (email verification sent automatically)
        c.var.logger.info({ email }, "Creating user");
        const userResult = await userRepo.createUser({
            email,
            password,
            name,
        });

        // Create organization via repository
        let createdOrgId: string | undefined;

        try {
            c.var.logger.info({ organizationName, slug }, "Creating organization");
            const orgId = await orgRepo.createOrganization({
                name: organizationName,
                slug,
            });
            createdOrgId = orgId;

            // Add user as owner via repository
            c.var.logger.info({ userId: userResult.user.id, orgId }, "Adding user as owner");
            await memberRepo.addMember({
                userId: userResult.user.id,
                organizationId: orgId,
                role: "owner",
            });

            c.var.logger.info({ userId: userResult.user.id, orgId }, "Signup with organization completed");

            return c.json({
                user: {
                    id: userResult.user.id,
                    email: userResult.user.email,
                    name: userResult.user.name,
                    role: "owner",
                },
                organization: {
                    id: orgId,
                    name: organizationName,
                    slug: slug,
                },
            }, HttpStatusCodes.CREATED);
        } catch (error) {
            c.var.logger.error({ error, userId: userResult.user.id }, "Error during organization setup, rolling back user creation");

            // Compensating transaction: remove the created user arrays from BetterAuth
            await userRepo.deleteUserAndAssociatedData(userResult.user.id);

            // If the organization was created before the crash, clean it up too (Scenario B)
            if (createdOrgId) {
                await orgRepo.deleteOrganization(createdOrgId);
                c.var.logger.info({ orgId: createdOrgId }, "Rolled back orphaned organization");
            }

            throw new InternalServerError("Failed to setup organization, please try again");
        }
    };
}
