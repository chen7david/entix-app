import { HttpStatusCodes } from "@api/helpers/http.helpers";
import { AppHandler } from '@api/helpers/types.helpers';
import { AuthRoutes } from './auth.routes';
import { getDbClient } from '@api/factories/db.factory';
import * as schema from "../../db/schema.db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { auth } from "@api/lib/auth/auth";

export class AuthHandler {
    static signupWithOrg: AppHandler<typeof AuthRoutes.signupWithOrg> = async (c) => {
        const { email, password, name, organizationName } = c.req.valid("json");
        const db = getDbClient(c);
        const authClient = auth(c);

        // check if user already exists
        const existingUser = await db.query.user.findFirst({
            where: eq(schema.user.email, email),
        });

        if (existingUser) {
            return c.json({ message: "User already exists" }, HttpStatusCodes.BAD_REQUEST);
        }

        // check if org slug exists
        const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const existingOrg = await db.query.organization.findFirst({
            where: eq(schema.organization.slug, slug),
        });

        if (existingOrg) {
            return c.json({ message: "Organization name already taken" }, HttpStatusCodes.BAD_REQUEST);
        }

        try {
            // Create user via BetterAuth
            const user = await authClient.api.signUpEmail({
                body: {
                    email,
                    password,
                    name,
                },
            });

            if (!user) {
                return c.json({ message: "Failed to create user" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
            }

            // Create Organization
            const orgId = nanoid();
            const now = new Date();
            await db.insert(schema.organization).values({
                id: orgId,
                name: organizationName,
                slug: slug,
                createdAt: now,
            });

            // Create Member (Owner)
            await db.insert(schema.member).values({
                id: nanoid(),
                organizationId: orgId,
                userId: user.user.id,
                role: "owner",
                createdAt: now,
            });

            return c.json({
                user: {
                    id: user.user.id,
                    email: user.user.email,
                    name: user.user.name,
                    role: "owner",
                },
                organization: {
                    id: orgId,
                    name: organizationName,
                    slug: slug,
                },
            }, HttpStatusCodes.OK);

        } catch (error: any) {
            console.error("Signup failed:", error);
            return c.json({ message: error.message || "Failed to create account" }, HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
