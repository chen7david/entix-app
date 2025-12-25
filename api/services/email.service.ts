import { Resend } from 'resend';

/**
 * Email Service for sending transactional emails via Resend
 * Optimized for Cloudflare Workers environment
 */
export class EmailService {
    private resend: Resend;
    private fromEmail: string;
    private isDevelopment: boolean;

    constructor(apiKey: string, fromEmail: string = 'donotreply@entix.org', isDevelopment: boolean = false) {
        this.resend = new Resend(apiKey);
        this.fromEmail = fromEmail;
        this.isDevelopment = isDevelopment;
    }

    /**
     * Send email verification link to user
     */
    async sendVerificationEmail(params: {
        to: string;
        userName: string;
        verificationUrl: string;
    }): Promise<{ success: boolean; error?: string }> {
        const { to, userName, verificationUrl } = params;

        return this.sendEmail({
            to,
            subject: 'Verify your email address',
            templateId: 'email-verification',
            variables: {
                DISPLAY_NAME: userName,
                VERIFICATION_LINK: verificationUrl,
                EXPIRY_TIME: '24 hours', // Placeholder as requested
            },
        });
    }

    /**
     * Send password reset link to user
     */
    async sendPasswordResetEmail(params: {
        to: string;
        userName: string;
        resetUrl: string;
    }): Promise<{ success: boolean; error?: string }> {
        const { to, userName, resetUrl } = params;

        return this.sendEmail({
            to,
            subject: 'Reset your password',
            templateId: 'password-reset', // Placeholder template ID
            variables: {
                DISPLAY_NAME: userName,
                RESET_LINK: resetUrl, // Using RESET_LINK as a likely variable name for the reset template
                EXPIRY_TIME: '1 hour', // Placeholder
            },
        });
    }

    /**
     * Internal method to send email via Resend
     */
    private async sendEmail(params: {
        to: string;
        subject: string;
        templateId: string;
        variables: Record<string, string>;
    }): Promise<{ success: boolean; error?: string }> {
        const { to, subject, templateId, variables } = params;
        console.log({ isDevelopment: this.isDevelopment })

        try {
            // In development, log email instead of sending
            if (this.isDevelopment) {
                console.log('📧 [EMAIL SERVICE - DEV MODE]');
                console.log('To:', to);
                console.log('Subject:', subject);
                console.log('Template ID:', templateId);
                console.log('Variables:', JSON.stringify(variables, null, 2));
                return { success: true };
            }

            // Send email via Resend using Template
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: [to],
                subject,
                template: {
                    id: templateId,
                    variables: variables,
                },
            });

            if (error) {
                console.error('❌ [EMAIL SERVICE] Failed to send email:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ [EMAIL SERVICE] Email sent successfully:', data?.id);
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ [EMAIL SERVICE] Exception while sending email:', errorMessage);
            return { success: false, error: errorMessage };
        }
    }
}

/**
 * Factory function to create EmailService instance
 * Use this in your Better Auth configuration
 */
export function createEmailService(env: CloudflareBindings): EmailService {
    const isDevelopment = env.BETTER_AUTH_URL?.includes('localhost') || false;
    return new EmailService(env.RESEND_API_KEY, 'donotreply@entix.org', isDevelopment);
}
