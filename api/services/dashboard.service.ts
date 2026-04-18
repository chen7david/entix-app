import type { DashboardRepository } from "@api/repositories/dashboard.repository";
import { BaseService } from "./base.service";

export class DashboardService extends BaseService {
    constructor(private dashboardRepo: DashboardRepository) {
        super();
    }

    async getDashboardMetrics(organizationId: string) {
        const metrics = await this.dashboardRepo.findDashboardMetrics(organizationId);
        const now = new Date();

        const upcomingBirthdays = metrics.rawBirthdays
            .map((p) => {
                if (!p.birthDate) return null;
                const bday = new Date(p.birthDate);
                const nextBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
                if (nextBday < now) nextBday.setFullYear(now.getFullYear() + 1);
                const daysUntil = Math.ceil(
                    (nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                return {
                    userId: p.userId,
                    name: p.name ?? "Unknown User",
                    birthDate: p.birthDate.toISOString(),
                    daysUntil,
                };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null && p.daysUntil <= 30)
            .sort((a, b) => a.daysUntil - b.daysUntil);

        return {
            ...metrics,
            upcomingBirthdays,
        };
    }
}
