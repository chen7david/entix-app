import { NumberUtils } from "@web/src/utils/number";
import { Typography } from "antd";

const { Text } = Typography;

type TransactionAmountProps = {
    amountCents: number;
    currencySymbol?: string;
    currencyCode?: string;
    isRevenue?: boolean;
    isExpense?: boolean;
    compact?: boolean;
};

/**
 * Standard signed amount display from organization perspective:
 * revenue -> +, expense -> -
 */
export function TransactionAmount({
    amountCents,
    currencySymbol = "$",
    currencyCode,
    isRevenue,
    isExpense,
    compact = false,
}: TransactionAmountProps) {
    const sign = isRevenue ? "+" : isExpense ? "-" : "";
    const toneClass = isRevenue
        ? "text-emerald-600"
        : isExpense
          ? "text-rose-600"
          : "text-slate-800";

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
