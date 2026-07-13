import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import type React from "react";

export const OrdersPage: React.FC = () => {
    return (
        <PageShell fill={false}>
            <PageHeader
                title="Orders"
                subtitle="Order history will appear here when the shop is enabled."
            />
        </PageShell>
    );
};
