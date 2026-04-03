import { InternalServerError } from "@api/errors/app.error";
import type { UserRepository } from "@api/repositories/user.repository";
import type { Auth } from "better-auth";
import { BaseService } from "./base.service";

export type CreateUserInput = {
    email: string;
    name: string;
    password: string;
};

export type CreateUserResult = {
    user: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
    };
};

export class UserService extends BaseService {
    constructor(
        private userRepo: UserRepository,
        private auth: Auth
    ) {
        super();
    }

    /**
     * Create a new user via BetterAuth.
     * Orchestrates the signup workflow and returns the result.
     */
    async createUser(input: CreateUserInput): Promise<CreateUserResult> {
        const result = await this.auth.api.signUpEmail({
            body: {
                email: input.email,
                password: input.password,
                name: input.name,
            },
        });

        if (!result) {
            throw new InternalServerError("User creation failed: No result returned from Auth API");
        }

        return result as CreateUserResult;
    }

    /**
     * Send password reset email to user.
     * Orchestrates the external identity provider call.
     */
    async sendPasswordResetEmail(email: string, redirectTo: string): Promise<void> {
        await this.auth.api.requestPasswordReset({
            body: { email, redirectTo },
        });
    }

    /**
     * Find user by ID.
     * Returns null if not found.
     */
    async findUserById(id: string) {
        return await this.userRepo.findById(id);
    }

    /**
     * Get user by ID.
     * Throws NotFoundError if not found.
     */
    async getUserById(userId: string) {
        const user = await this.findUserById(userId);
        return this.assertExists(user, `User with ID ${userId} not found`);
    }

    /**
     * Find user by email.
     * Returns null if not found.
     */
    async findUserByEmail(email: string) {
        return await this.userRepo.findByEmail(email);
    }

    /**
     * Get user by email.
     * Throws NotFoundError if not found.
     */
    async getUserByEmail(email: string) {
        const user = await this.findUserByEmail(email);
        return this.assertExists(user, `User with email ${email} not found`);
    }

    async findUsersByOrganization(
        organizationId: string,
        limit: number,
        cursor?: string,
        direction: "next" | "prev" = "next",
        search?: string
    ) {
        return await this.userRepo.findAllByOrg(organizationId, limit, cursor, direction, search);
    }

    async updateUser(
        id: string,
        data: Partial<{ email: string; name: string; image: string | null }>
    ) {
        return await this.userRepo.update(id, data);
    }
}
