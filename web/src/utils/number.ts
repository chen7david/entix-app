/**
 * NumberUtils - Standardized formatting for numeric and financial values across the application.
 */
export const NumberUtils = {
    /**
     * Formats an amount in cents into a localized currency string with thousand separators.
     * @param amountCents - The amount in cents.
     * @param currencySymbol - The currency symbol (e.g., "¥", "$").
     * @returns A formatted string e.g. "¥50,000.00"
     */
    formatCurrency: (amountCents: number, currencySymbol: string = "¥") => {
        const amount = Math.abs(amountCents) / 100;
        const formatted = new Intl.NumberFormat("en-US", {
            style: "decimal",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);

        const prefix = amountCents < 0 ? "-" : "";
        return `${prefix}${currencySymbol}${formatted}`;
    },

    /**
     * Formats a raw number with thousand separators.
     */
    formatNumber: (value: number) => {
        return new Intl.NumberFormat("en-US").format(value);
    },
};
