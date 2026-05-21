import type { WalletAccountDTO } from "@shared";
import type { Transaction } from "@web/src/features/wallet/hooks/useTransactionHistory";
import type { DocumentMeta } from "../../shared/document.types";
import { compareTransactionsChronologically, resolveTransactionDirection } from "./statement.utils";

export interface BankStatementDocumentData {
    account: WalletAccountDTO;
    transactions: Transaction[];
    periodFrom: Date;
    periodTo: Date;
    openingBalanceCents: number;
    closingBalanceCents: number;
    totalCreditCents: number;
    totalDebitCents: number;
    /** True when closingBalanceCents was derived from account.balanceCents
     * rather than an authoritative balance-at-date. Templates can use this
     * to show a disclaimer when the period extends beyond the live balance. */
    closingBalanceIsLive: boolean;
    meta: DocumentMeta;
}

export interface BuildStatementDataOptions {
    /**
     * Authoritative closing balance at periodTo, in cents. When omitted,
     * we fall back to account.balanceCents — which is only correct when
     * periodTo is the current moment AND no transactions occurred after it.
     * Pass this when the API exposes a balance-at-date endpoint.
     */
    closingBalanceCentsOverride?: number;
}

export function buildStatementData(
    account: WalletAccountDTO,
    transactions: Transaction[],
    periodFrom: Date,
    periodTo: Date,
    orgName: string,
    logoUrl?: string,
    options?: BuildStatementDataOptions
): BankStatementDocumentData {
    const completed = transactions
        .filter((t) => t.status === "completed")
        .slice()
        .sort(compareTransactionsChronologically);

    const totalCreditCents = completed
        .filter((t) => resolveTransactionDirection(t, account.id) === "credit")
        .reduce((sum, t) => sum + t.amountCents, 0);

    const totalDebitCents = completed
        .filter((t) => resolveTransactionDirection(t, account.id) === "debit")
        .reduce((sum, t) => sum + t.amountCents, 0);

    const hasOverride = options?.closingBalanceCentsOverride !== undefined;
    const closingBalanceCents = hasOverride
        ? (options?.closingBalanceCentsOverride as number)
        : account.balanceCents;
    const openingBalanceCents = closingBalanceCents - totalCreditCents + totalDebitCents;

    return {
        account,
        transactions: completed,
        periodFrom,
        periodTo,
        openingBalanceCents,
        closingBalanceCents,
        totalCreditCents,
        totalDebitCents,
        closingBalanceIsLive: !hasOverride,
        meta: {
            title: "Account Statement",
            subtitle: account.name,
            orgName,
            logoUrl,
            generatedAt: new Date(),
        },
    };
}
