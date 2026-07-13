import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import type React from "react";

export const ShopPage: React.FC = () => {
    return (
        <PageShell fill={false}>
            <PageHeader
                title="Shop"
                subtitle="Digital products and rewards will appear here when enabled."
            />
        </PageShell>
    );
};
