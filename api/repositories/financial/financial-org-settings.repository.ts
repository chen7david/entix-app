import type { AppDb } from "@api/factories/db.factory";
import { financialOrgSettings } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export class FinancialOrgSettingsRepository {
    constructor(private db: AppDb) {}

    /**
     * Finds the financial settings for an organization.
     * Returns null if no settings have been initialized yet.
     */
    async findByOrgId(organizationId: string) {
        return this.db.query.financialOrgSettings.findFirst({
            where: eq(financialOrgSettings.organizationId, organizationId),
        });
    }

    /**
     * Initializes default financial settings for an organization.
     */
    async initializeDefaults(organizationId: string) {
        const id = nanoid();
        const [settings] = await this.db
            .insert(financialOrgSettings)
            .values({
                id,
                organizationId,
                // Defaults are handled by schema: ["fcur_etd", "fcur_usd"]
            })
            .returning();
        return settings;
    }

    /**
     * Ensures settings exist for an organization, creating them if necessary.
     */
    async findOrCreate(organizationId: string) {
        const existing = await this.findByOrgId(organizationId);
        if (existing) return existing;
        return this.initializeDefaults(organizationId);
    }
}
