import { Resend } from "resend";

type SendTemplateParams = {
    to: string;
    templateId: string;
    variables: Record<string, string>;
}

type SendHtmlParams = {
    to: string;
    subject: string;
    html: string;
}

type SendPasswordResetParams = {
    to: string;
    displayName: string;
    resetUrl: string;
}

export class Mailer {
    private $client: Resend;
    private sender: string = 'Entix <donotreply@entix.org>';

    constructor(apiKey: string) {
        this.$client = new Resend(apiKey);
    }

    public async sendHtml({ to, subject, html }: SendHtmlParams) {
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

    public async sendWelcomeEmailWithPasswordReset({ to, displayName, resetUrl }: SendPasswordResetParams) {
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