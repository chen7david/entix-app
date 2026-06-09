import { DocumentLayout } from "../../shared/DocumentLayout";
import type { BankStatementDocumentData } from "./bank-statement.types";
import { StatementSummaryBlock } from "./StatementSummaryBlock";
import { StatementTransactionTable } from "./StatementTransactionTable";

interface BankStatementDocumentProps {
    data: BankStatementDocumentData;
}

export function BankStatementDocument({ data }: BankStatementDocumentProps) {
    return (
        <DocumentLayout meta={data.meta}>
            <StatementSummaryBlock data={data} />
            <StatementTransactionTable
                transactions={data.transactions}
                accountId={data.account.id}
                openingBalanceCents={data.openingBalanceCents}
            />
        </DocumentLayout>
    );
}
