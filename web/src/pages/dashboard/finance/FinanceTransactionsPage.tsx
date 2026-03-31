import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { useOrganization } from "@web/src/features/organization";
import { Typography } from "antd";
import type React from "react";

const { Title, Text } = Typography;

export const FinanceTransactionsPage: React.FC = () => {
    const { activeOrganization } = useOrganization();

    return (
        <>
            <Toolbar title="Finance — Transactions" />
            <div className="p-6">
                <Title level={2}>Finance — Transactions</Title>
                <Text type="secondary">
                    Review recent transactions and ledger entries for {activeOrganization?.name}.
                </Text>

                <div className="py-20 text-center border rounded-lg mt-12 bg-gray-50 border-dashed border-gray-300">
                    <Text type="secondary">Detailed transaction breakdown coming soon...</Text>
                </div>
            </div>
        </>
    );
};
