import { PageHeader } from "@web/src/components/layout/PageHeader";
import { PageShell } from "@web/src/components/layout/PageShell";
import type React from "react";

export const MoviesPage: React.FC = () => {
    return (
        <PageShell fill={false}>
            <PageHeader
                title="Movies"
                subtitle="Media collections will appear here when enabled."
            />
        </PageShell>
    );
};
