import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { CurrencyActivationGrid } from "@web/src/features/finance/components/CurrencyActivationGrid";
import { useActivateCurrency } from "@web/src/features/finance/hooks/useActivateCurrency";
import { useOrgCurrencies } from "@web/src/features/finance/hooks/useOrgCurrencies";
import { useOrganization } from "@web/src/features/organization";
import { CreateAccountDrawer } from "@web/src/features/wallet/components/CreateAccountDrawer";
import { Button, Divider, Typography } from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;

export const FinanceAccountsPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

    const { data, isLoading } = useOrgCurrencies(orgId);
    const { mutate: activate, isPending } = useActivateCurrency(orgId);

    const activated = data?.currencies.filter((c) => c.isActivated) ?? [];
    const available = data?.currencies.filter((c) => !c.isActivated) ?? [];

    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <Title level={2} style={{ marginBottom: 4 }}>
                            Finance — Accounts
                        </Title>
                        <Text type="secondary">
                            Manage your organization's financial accounts and activate new
                            currencies.
                        </Text>
                    </div>
                    <Button type="primary" size="large" onClick={() => setIsCreateDrawerOpen(true)}>
                        Create Custom Account
                    </Button>
                </div>

                {activated.length > 0 && (
                    <>
                        <div style={{ marginTop: 24, marginBottom: 8 }}>
                            <Text strong>Active Accounts</Text>
                        </div>
                        <CurrencyActivationGrid
                            currencies={activated}
                            onActivate={activate}
                            activating={isPending}
                        />
                    </>
                )}

                {available.length > 0 && (
                    <>
                        <Divider />
                        <div style={{ marginBottom: 12 }}>
                            <Text type="secondary">
                                Available Currencies — click Activate to enable
                            </Text>
                        </div>
                        <CurrencyActivationGrid
                            currencies={available}
                            onActivate={activate}
                            activating={isPending}
                        />
                    </>
                )}

                {isLoading && (
                    <div className="py-20 text-center">
                        <Text type="secondary">Loading currencies...</Text>
                    </div>
                )}

                <CreateAccountDrawer
                    open={isCreateDrawerOpen}
                    onClose={() => setIsCreateDrawerOpen(false)}
                    orgId={orgId}
                />
            </div>
        </>
    );
};
