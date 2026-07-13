import { BadRequestError, ConflictError, NotFoundError } from "@api/errors/app.error";
import type { MemberRepository } from "@api/repositories/members/member.repository";
import type { UserRepository } from "@api/repositories/users/user.repository";
import type { Auth } from "better-auth";
import type { PinoLogger } from "hono-pino";
import { BaseService } from "../base.service";

/**
 * Org-scoped account administration (login email corrections, etc.).
 * Better Auth self-service `changeEmail` requires the member's own session;
 * org staff correcting a member email uses this service instead.
 */
export class MemberAccountService extends BaseService {
    constructor(
        private readonly memberRepo: MemberRepository,
        private readonly userRepo: UserRepository,
        private readonly auth: Auth,
        private readonly logger: PinoLogger
    ) {
        super();
    }

    async updateMemberEmail(input: {
        organizationId: string;
        userId: string;
        email: string;
        sendVerification?: boolean;
    }) {
        const membership = await this.memberRepo.find(input.userId, input.organizationId);
        if (!membership) {
            throw new NotFoundError("Member not found in this organization");
        }

        const user = await this.userRepo.findById(input.userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        const nextEmail = input.email.trim().toLowerCase();
        if (!nextEmail) {
            throw new BadRequestError("Email is required");
        }

        const currentEmail = user.email.trim().toLowerCase();
        if (nextEmail === currentEmail) {
            return {
                userId: user.id,
                email: user.email,
                emailVerified: !!user.emailVerified,
                verificationEmailQueued: false,
            };
        }

        const existing = await this.userRepo.findByEmail(nextEmail);
        if (existing && existing.id !== user.id) {
            throw new ConflictError("Another account already uses this email");
        }

        // Immediate apply (admin correction). Reset verification so the new address must be confirmed.
        await this.userRepo.update(user.id, {
            email: nextEmail,
            emailVerified: false,
            updatedAt: new Date(),
        });

        const shouldSend = input.sendVerification !== false;
        let verificationEmailQueued = false;

        if (shouldSend) {
            try {
                await this.auth.api.sendVerificationEmail({
                    body: { email: nextEmail },
                    headers: new Headers(),
                });
                verificationEmailQueued = true;
            } catch (err: unknown) {
                this.logger.error(
                    { err, userId: user.id, email: nextEmail },
                    "Failed to queue verification email after admin email update"
                );
            }
        }

        // Best-effort: drop existing sessions via DB (admin plugin revoke needs platform admin session).
        try {
            await this.userRepo.deleteSessionsForUser(user.id);
        } catch (err: unknown) {
            this.logger.warn(
                { err, userId: user.id },
                "Could not revoke sessions after email update (email still updated)"
            );
        }

        return {
            userId: user.id,
            email: nextEmail,
            emailVerified: false,
            verificationEmailQueued,
        };
    }
}
