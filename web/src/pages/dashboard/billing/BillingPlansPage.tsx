import { PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import {
    BillingPlanManagement,
    type BillingPlanManagementRef,
} from "@web/src/features/finance/components/BillingPlanManagement";
import { useOrganization } from "@web/src/features/organization";
import { Button } from "antd";
import type React from "react";
import { useRef } from "react";

export const BillingPlansPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;
    const managementRef = useRef<BillingPlanManagementRef>(null);

    return (
        <div>
            <PageHeader
                title="Billing Plans"
                subtitle="Manage tiered billing rates, student limits, and overdraft protections for automated charging."
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        className="h-11 font-semibold"
                        onClick={() => managementRef.current?.handleCreate()}
                    >
                        Create Plan
                    </Button>
                }
            />

            <div>{orgId ? <BillingPlanManagement ref={managementRef} orgId={orgId} /> : null}</div>
        </div>
    );
};
