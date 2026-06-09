import type { Transaction } from "@web/src/features/wallet/hooks/useTransactionHistory";

export type TransactionDirection = "credit" | "debit";

/**
 * Determines whether a transaction credits or debits the given account.
 * Single source of truth for direction-derived display logic in the bank
 * statement template.
 */
export function resolveTransactionDirection(
    tx: Transaction,
    accountId: string
): TransactionDirection {
    return tx.destinationAccountId === accountId ? "credit" : "debit";
}

export function compareTransactionsChronologically(a: Transaction, b: Transaction): number {
    const da = new Date(a.transactionDate).getTime();
    const db = new Date(b.transactionDate).getTime();
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
}
