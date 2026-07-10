import type { Transaction } from "@web/src/features/wallet/hooks/useTransactionHistory";
import { resolveTransactionDirection } from "./statement.utils";

interface StatementTransactionRowProps {
    tx: Transaction;
    accountId: string;
    runningBalance: number;
}

export function StatementTransactionRow({
    tx,
    accountId,
    runningBalance,
}: StatementTransactionRowProps) {
    const direction = resolveTransactionDirection(tx, accountId);
    const isCredit = direction === "credit";
    const sym = tx.currency.symbol;
    const formatted = (cents: number) => `${sym}${(cents / 100).toFixed(2)}`;
    const date = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(tx.transactionDate));

    return (
        <tr className="doc-table-row">
            <td style={{ width: "13%" }}>{date}</td>
            <td style={{ width: "28%" }}>{tx.description ?? tx.category.name}</td>
            <td style={{ width: "18%", color: "#555", fontSize: "9pt" }}>{tx.id.slice(0, 12)}…</td>
            <td style={{ width: "14%", textAlign: "right", color: "#c0392b" }}>
                {!isCredit ? formatted(tx.amountCents) : ""}
            </td>
            <td style={{ width: "14%", textAlign: "right", color: "#27ae60" }}>
                {isCredit ? formatted(tx.amountCents) : ""}
            </td>
            <td style={{ width: "13%", textAlign: "right", fontWeight: 500 }}>
                {formatted(runningBalance)}
            </td>
        </tr>
    );
}
