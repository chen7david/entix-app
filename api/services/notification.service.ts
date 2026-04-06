import { BadRequestError, NotFoundError } from "@api/errors/app.error";
import type { UserRepository } from "@api/repositories/user.repository";
import type { Auth } from "better-auth";
import { BaseService } from "./base.service";

/**
 * NotificationService owns all cross-cutting notification concerns:
 * - verification emails
 * - password reset triggers
 *
 * Keeping these here (rather than in UserService or MailService) avoids
 * coupling either service to the auth SDK's email side-effects.
 */
export class NotificationService extends BaseService {
    constructor(
        private userRepo: UserRepository,
        private auth: Auth
    ) {
        super();
    }

    /**
     * Resend email verification for a user (admin-initiated).
     * Validates user exists and is not already verified before triggering.
     */
    async sendVerificationReminder(email: string): Promise<void> {
        const user = await this.userRepo.findByEmail(email);
        if (!user) {
            throw new NotFoundError(`User with email ${email} not found`);
        }
        if (user.emailVerified) {
            throw new BadRequestError(`User with email ${email} is already verified`);
        }

        await this.auth.api.sendVerificationEmail({
            body: { email },
            headers: new Headers(), // Empty headers bypass session-scoped checks
        });
    }
}
