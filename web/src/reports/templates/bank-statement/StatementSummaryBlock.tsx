import { FINANCIAL_CURRENCY_CONFIG } from "@shared";
import { DocumentSection } from "../../shared/DocumentSection";
import type { BankStatementDocumentData } from "./bank-statement.types";

function formatCents(cents: number, symbol: string): string {
    return `${symbol}${(cents / 100).toFixed(2)}`;
}

function formatDate(d: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(d);
}

interface SummaryBlockProps {
    data: BankStatementDocumentData;
}

export function StatementSummaryBlock({ data }: SummaryBlockProps) {
    const currencyConfig =
        FINANCIAL_CURRENCY_CONFIG[
            data.account.currencyId as keyof typeof FINANCIAL_CURRENCY_CONFIG
        ];
    const sym = data.transactions[0]?.currency?.symbol ?? currencyConfig?.symbol ?? "$";
    const currencyLabel =
        data.transactions[0]?.currency?.code ?? currencyConfig?.code ?? data.account.currencyId;

    const rows: [string, string][] = [
        ["Account Name", data.account.name],
        ["Account Type", data.account.accountType],
        ["Currency", currencyLabel],
        ["Statement Period", `${formatDate(data.periodFrom)} — ${formatDate(data.periodTo)}`],
        ["Opening Balance", formatCents(data.openingBalanceCents, sym)],
        ["Closing Balance", formatCents(data.closingBalanceCents, sym)],
        ["Total Credits", formatCents(data.totalCreditCents, sym)],
        ["Total Debits", formatCents(data.totalDebitCents, sym)],
    ];

    return (
        <DocumentSection style={{ marginBottom: "14pt" }}>
            <table style={{ width: "60%", borderCollapse: "collapse", fontSize: "10pt" }}>
                <tbody>
                    {rows.map(([label, value]) => (
                        <tr key={label}>
                            <td style={{ padding: "3pt 8pt 3pt 0", color: "#555", width: "45%" }}>
                                {label}
                            </td>
                            <td
                                style={{
                                    padding: "3pt 0",
                                    fontWeight: label.includes("Balance") ? 600 : 400,
                                }}
                            >
                                {value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </DocumentSection>
    );
}
