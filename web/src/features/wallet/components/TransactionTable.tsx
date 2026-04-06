import type { CursorPaginationConfig } from "@web/src/components/data/DataTable.types";
import {
    DataTableWithFilters,
    type FilterConfig,
} from "@web/src/components/data/DataTableWithFilters";
import { App } from "antd";
import {
    getTransactionColumns,
    type TransactionRecord,
} from "../../finance/components/TransactionColumns";

type TransactionTableProps = {
    transactions?: TransactionRecord[];
    loading?: boolean;
    pagination: CursorPaginationConfig;
    onFiltersChange: (filters: Record<string, any>) => void;
    filters: FilterConfig[];
};

export const TransactionTable = ({
    transactions,
    loading,
    pagination,
    onFiltersChange,
    filters,
}: TransactionTableProps) => {
    const { notification } = App.useApp();
    return (
        <DataTableWithFilters<TransactionRecord>
            config={{
                columns: getTransactionColumns(notification),
                data: transactions || [],
                pagination,
                loading,
                filters,
                onFiltersChange,
            }}
        />
    );
};
