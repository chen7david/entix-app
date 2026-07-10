import type { AppDb } from "@api/factories/db.factory";
import { financialOrgSettings } from "@shared/db/schema";
import { eq } from "drizzle-orm";

export class FinancialOrgSettingsRepository {
    constructor(private db: AppDb) {}

    /**
     * Finds the financial settings for an organization.
     * Returns null if no settings have been initialized yet.
     */
    async findByOrgId(organizationId: string) {
        return (
            (await this.db.query.financialOrgSettings.findFirst({
                where: eq(financialOrgSettings.organizationId, organizationId),
            })) ?? null
        );
    }

    /**
     * Inserts default financial settings for an organization.
     * Primary key comes from schema `$defaultFn` (see `financial-org-settings.schema.ts`).
     */
    async insertDefaults(organizationId: string) {
        const [settings] = await this.db
            .insert(financialOrgSettings)
            .values({
                organizationId,
                // Defaults are handled by schema: ["fcur_etd", "fcur_usd"]
            })
            .returning();
        return settings ?? null;
    }
}
