/**
 * Standard signed amount display.
 * Prefer viewer `direction` (credit/debit). Fall back to category revenue/expense flags.
 */
import { NumberUtils } from "@web/src/utils/number";
import { Typography } from "antd";

const { Text } = Typography;

type TransactionAmountProps = {
    amountCents: number;
    currencySymbol?: string;
    currencyCode?: string;
    /** Viewer-relative ledger direction — preferred over category flags. */
    direction?: "credit" | "debit" | null;
    isRevenue?: boolean;
    isExpense?: boolean;
    compact?: boolean;
};

export function TransactionAmount({
    amountCents,
    currencySymbol = "$",
    currencyCode,
    direction,
    isRevenue,
    isExpense,
    compact = false,
}: TransactionAmountProps) {
    const isCredit =
        direction === "credit" ? true : direction === "debit" ? false : Boolean(isRevenue);
    const isDebit =
        direction === "debit" ? true : direction === "credit" ? false : Boolean(isExpense);

    const sign = isCredit ? "+" : isDebit ? "-" : "";
    const toneClass = isCredit ? "text-emerald-600" : isDebit ? "text-rose-600" : "text-slate-800";

    return (
        <div className="flex flex-col items-end">
            <Text
                strong
                className={`tabular-nums tracking-tight ${compact ? "text-sm" : "text-base"} ${toneClass}`}
            >
                {sign}
                {NumberUtils.formatCurrency(Math.abs(amountCents), currencySymbol)}
            </Text>
            {currencyCode ? (
                <Text
                    type="secondary"
                    className="text-[10px] uppercase font-semibold tracking-wide"
                >
                    {currencyCode}
                </Text>
            ) : null}
        </div>
    );
}
