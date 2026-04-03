import {
    type CursorPaginationConfig,
    DataTableWithFilters,
    type FilterConfig,
} from "@web/src/components/data/DataTableWithFilters";
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
    return (
        <DataTableWithFilters<TransactionRecord>
            config={{
                columns: getTransactionColumns(),
                data: transactions || [],
                pagination,
                loading,
                filters,
                onFiltersChange,
            }}
        />
    );
};
