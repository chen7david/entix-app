import { SettingOutlined } from "@ant-design/icons";
import { useAuth } from "@web/src/features/auth";
import { CurrencyActivationGrid } from "@web/src/features/finance/components/CurrencyActivationGrid";
import { useActivateCurrency } from "@web/src/features/finance/hooks/useActivateCurrency";
import { useOrgCurrencies } from "@web/src/features/finance/hooks/useOrgCurrencies";
import { useOrganization } from "@web/src/features/organization";
import { ThemeSelector, TimezoneSelector } from "@web/src/features/user-profiles";
import { Card, Col, Row, Space, Typography } from "antd";

const { Title, Text } = Typography;

export const SettingsPage = () => {
    const { isAdminOrOwner } = useAuth();
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;
    const { data: currenciesData, isLoading: isLoadingCurrencies } = useOrgCurrencies(orgId);
    const { mutate: activate, isPending: isActivating } = useActivateCurrency(orgId);

    return (
        <div>
            <div className="max-w-5xl">
                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Settings
                    </Title>
                    <Text type="secondary">Manage your account settings and preferences</Text>
                </div>

                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <Card className="shadow-sm">
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                            <SettingOutlined
                                style={{ fontSize: 20, marginRight: 12, color: "#2563eb" }}
                            />
                            <Title level={4} style={{ margin: 0 }}>
                                Personal Settings
                            </Title>
                        </div>
                        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                            Configure default environment settings like local timezone and interface
                            theme matching your workflows natively.
                        </Text>
                        <Row gutter={[24, 24]}>
                            <Col xs={24} md={12}>
                                <div className="mb-2">
                                    <Text strong>Timezone</Text>
                                </div>
                                <TimezoneSelector />
                            </Col>
                            <Col xs={24} md={12}>
                                <div className="mb-2">
                                    <Text strong>Theme</Text>
                                </div>
                                <ThemeSelector />
                            </Col>
                        </Row>
                    </Card>

                    <Card className="shadow-sm">
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                            <SettingOutlined
                                style={{ fontSize: 20, marginRight: 12, color: "#7c3aed" }}
                            />
                            <Title level={4} style={{ margin: 0 }}>
                                Organization Settings
                            </Title>
                        </div>
                        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
                            Manage billing-related organization configuration, including supported
                            currencies and wallet activation.
                        </Text>
                        {isAdminOrOwner ? (
                            <div>
                                <Text
                                    strong
                                    type="secondary"
                                    className="text-[11px] uppercase tracking-widest block mb-4"
                                >
                                    Currency Management
                                </Text>
                                <CurrencyActivationGrid
                                    currencies={currenciesData ?? []}
                                    onActivate={activate}
                                    activating={isActivating || isLoadingCurrencies}
                                    compact
                                />
                            </div>
                        ) : (
                            <Text type="secondary">
                                You need organization admin access to update organization settings.
                            </Text>
                        )}
                    </Card>
                </Space>
            </div>
        </div>
    );
};

export default SettingsPage;
