import { AppContext } from "@api/helpers/types.helpers";
import { Resend } from "resend";
import { Logger } from "pino";

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

export class Mailer {
    private $client: Resend;
    private sender: string = 'Entix <donotreply@entix.org>';
    private logger: Logger;

    constructor(apiKey: string, logger: Logger) {
        this.$client = new Resend(apiKey);
        this.logger = logger;
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
            this.logger.error({ error }, 'Failed to send HTML email');
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
            this.logger.error({ error }, 'Failed to send template email');
        }
    }
}