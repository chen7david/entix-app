import { ServiceUnavailableError } from "@api/errors/app.error";
import { Resend } from "resend";
import { BaseService } from "./base.service";

type SendTemplateParams = {
    to: string;
    templateId: string;
    variables: Record<string, string>;
};

type SendHtmlParams = {
    to: string;
    subject: string;
    html: string;
};

type SendPasswordResetParams = {
    to: string;
    displayName: string;
    resetUrl: string;
};

export class MailService extends BaseService {
    private $client: Resend | null = null;
    private isFallback: boolean = false;
    private sender: string = "Entix <donotreply@entix.org>";

    constructor(apiKey?: string) {
        super();
        if (!apiKey || apiKey === "LOCAL_DEV_REPLACE_ME") {
            this.isFallback = true;
            console.warn("[MAILER] No RESEND_API_KEY provided. Falling back to console logging.");
        } else {
            this.$client = new Resend(apiKey);
        }
    }

    public async listEmails(options: { limit?: number; after?: string; before?: string }) {
        if (!this.$client) {
            throw new ServiceUnavailableError(
                "MailService client is not initialized (fallback mode)."
            );
        }

        const paginationParam = options.after
            ? { after: options.after }
            : options.before
              ? { before: options.before }
              : {};

        return this.$client.emails.list({
            limit: options.limit ?? 20,
            ...paginationParam,
        });
    }

    public async getEmail(emailId: string) {
        if (!this.$client) {
            throw new ServiceUnavailableError(
                "MailService client is not initialized (fallback mode)."
            );
        }

        return this.$client.emails.get(emailId);
    }

    public async sendHtml({ to, subject, html }: SendHtmlParams) {
        if (this.isFallback || !this.$client) {
            console.log("--- [MAILER FALLBACK: HTML EMAIL] ---");
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: ${html}`);
            console.log("-------------------------------------");
            return;
        }

        try {
            await this.$client.emails.send({
                from: this.sender,
                to,
                subject,
                react: html,
            });
        } catch (error) {
            console.error(error);
        }
    }

    public async sendTemplate({ to, templateId, variables }: SendTemplateParams) {
        if (this.isFallback || !this.$client) {
            console.log("--- [MAILER FALLBACK: TEMPLATE EMAIL] ---");
            console.log(`To: ${to}`);
            console.log(`Template: ${templateId}`);
            console.log(`Variables: ${JSON.stringify(variables, null, 2)}`);
            console.log("-----------------------------------------");
            return;
        }

        try {
            await this.$client.emails.send({
                from: this.sender,
                to,
                template: {
                    id: templateId,
                    variables,
                },
            });
        } catch (error) {
            console.error(error);
        }
    }

    public async sendWelcomeEmailWithPasswordReset({
        to,
        displayName,
        resetUrl,
    }: SendPasswordResetParams) {
        return this.sendTemplate({
            to,
            templateId: "welcome-initial-password-setup",
            variables: {
                DISPLAY_NAME: displayName,
                RESET_LINK: resetUrl,
            },
        });
    }

    public async sendPasswordResetEmail({ to, displayName, resetUrl }: SendPasswordResetParams) {
        return this.sendTemplate({
            to,
            templateId: "reset-password",
            variables: {
                DISPLAY_NAME: displayName,
                RESET_LINK: resetUrl,
            },
        });
    }
}
