import { AuthRoutes } from "./auth.routes";
import { AppHandler } from '@api/helpers/types.helpers';
import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { UserRepository } from "@api/repositories/user.repository";
import { OrganizationRepository } from "@api/repositories/organization.repository";
import { MemberRepository } from "@api/repositories/member.repository";
import { HTTPException } from "hono/http-exception";

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
            throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
                message: "User already exists"
            });
        }

        // Check if organization slug already exists
        const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const existingOrg = await orgRepo.findBySlug(slug);
        if (existingOrg) {
            c.var.logger.warn({ slug }, "Organization name already taken");
            throw new HTTPException(HttpStatusCodes.BAD_REQUEST, {
                message: "Organization name already taken"
            });
        }

        // Create user via repository (email verification sent automatically)
        c.var.logger.info({ email }, "Creating user");
        const userResult = await userRepo.createUser({
            email,
            password,
            name,
        });

        // Create organization via repository
        c.var.logger.info({ organizationName, slug }, "Creating organization");
        const orgId = await orgRepo.createOrganization({
            name: organizationName,
            slug,
        });

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
        }, HttpStatusCodes.OK);
    };
}
