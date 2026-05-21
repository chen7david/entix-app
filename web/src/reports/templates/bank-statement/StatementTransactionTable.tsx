import type { Transaction } from "@web/src/features/wallet/hooks/useTransactionHistory";
import { StatementTransactionRow } from "./StatementTransactionRow";
import { resolveTransactionDirection } from "./statement.utils";

interface StatementTransactionTableProps {
    transactions: Transaction[];
    accountId: string;
    openingBalanceCents: number;
}

interface BalancedRow {
    tx: Transaction;
    balance: number;
}

/** Pure helper kept at module scope so we can mutate a local accumulator
 * (push + running `let`) without tripping React's immutability lint, and
 * still avoid the O(n²) accumulating-spread pattern Biome flags inside
 * `Array.prototype.reduce`. */
function computeRunningBalances(
    transactions: Transaction[],
    accountId: string,
    openingBalanceCents: number
): BalancedRow[] {
    const rows: BalancedRow[] = [];
    let runningBalance = openingBalanceCents;
    for (const tx of transactions) {
        const direction = resolveTransactionDirection(tx, accountId);
        runningBalance =
            direction === "credit"
                ? runningBalance + tx.amountCents
                : runningBalance - tx.amountCents;
        rows.push({ tx, balance: runningBalance });
    }
    return rows;
}

export function StatementTransactionTable({
    transactions,
    accountId,
    openingBalanceCents,
}: StatementTransactionTableProps) {
    /** Walk transactions chronologically (oldest → newest) so each row's
     * running balance is the post-transaction balance at that moment. */
    const rowsWithBalance = computeRunningBalances(transactions, accountId, openingBalanceCents);

    /** Display newest first while preserving each row's already-computed
     * running balance — the first row shows the closing balance. */
    const displayRows = rowsWithBalance.slice().reverse();

    return (
        <table className="doc-table">
            <thead>
                <tr>
                    <th style={{ width: "13%" }}>Date</th>
                    <th style={{ width: "28%" }}>Description</th>
                    <th style={{ width: "18%" }}>Reference</th>
                    <th style={{ width: "14%", textAlign: "right" }}>Debit</th>
                    <th style={{ width: "14%", textAlign: "right" }}>Credit</th>
                    <th style={{ width: "13%", textAlign: "right" }}>Balance</th>
                </tr>
            </thead>
            <tbody>
                {displayRows.map(({ tx, balance: rowBalance }) => (
                    <StatementTransactionRow
                        key={tx.id}
                        tx={tx}
                        accountId={accountId}
                        runningBalance={rowBalance}
                    />
                ))}
                {displayRows.length === 0 && (
                    <tr>
                        <td
                            colSpan={6}
                            style={{ textAlign: "center", padding: "12pt", color: "#888" }}
                        >
                            No transactions in this period
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
