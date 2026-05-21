import { CurrencyActivationGrid } from "@web/src/features/finance/components/CurrencyActivationGrid";
import { Typography } from "antd";
import { useAdminActivateCurrency, useAdminOrgCurrencies } from "../hooks/useAdminOrgCurrencies";

const { Text } = Typography;

export const AdminOrgCurrencyPanel: React.FC<{ orgId: string }> = ({ orgId }) => {
    const { data: currencies = [], isLoading } = useAdminOrgCurrencies(orgId);
    const { mutate: activate, isPending } = useAdminActivateCurrency(orgId);

    return (
        <div>
            <Text type="secondary" className="block mb-4">
                Organization Settings - Manage billing-related organization configuration, including
                supported currencies and wallet activation.
            </Text>
            <CurrencyActivationGrid
                currencies={currencies}
                onActivate={activate}
                activating={isLoading || isPending}
                compact
            />
        </div>
    );
};
