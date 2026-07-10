import type { InputProps } from "antd";
import { Input } from "antd";
import type React from "react";
import { useEffect, useState } from "react";
import { NumericFormat, type NumericFormatProps } from "react-number-format";

interface POSInputProps
    extends Omit<
        NumericFormatProps,
        "onChange" | "customInput" | "onValueChange" | "size" | "prefix"
    > {
    value?: number | string;
    onChange?: (value: number | undefined) => void;
    /**
     * Optional prefix for the currency symbol. Defaults to '$'.
     */
    prefix?: string;
    /**
     * Optional size for the input. Follows Ant Design sizing.
     */
    size?: "small" | "middle" | "large";
    /**
     * Standard antd input props to pass through
     */
    inputProps?: InputProps;
    className?: string;
    /**
     * If true, implements a shift-register (POS style) entry logic where digits are pushed from the right.
     * Defaults to true.
     */
    posMode?: boolean;
}

/**
 * A standardized currency input component.
 * Supports "posMode" (default) which implements "push from right" behavior.
 * Integrated with Ant Design Form and theme.
 */
export const POSInput: React.FC<POSInputProps> = ({
    value,
    onChange,
    prefix = "$",
    inputProps,
    className,
    posMode = true,
    disabled,
    ...rest
}) => {
    // Internal state: integer cents (the shift register)
    const [cents, setCents] = useState<number>(() => Math.round((Number(value) || 0) * 100));

    // Sync external value changes (e.g. form.setFieldsValue / initialValues)
    useEffect(() => {
        const externalCents = Math.round((Number(value) || 0) * 100);
        if (externalCents !== cents) {
            setCents(externalCents);
        }
    }, [value, cents]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!posMode || disabled) return;

        if (e.key >= "0" && e.key <= "9") {
            e.preventDefault(); // Prevents NumericFormat from handling the key
            const newCents = Math.min(cents * 10 + Number(e.key), 999999999); // Cap at $9,999,999.99
            setCents(newCents);
            onChange?.(newCents / 100);
        } else if (e.key === "Backspace") {
            e.preventDefault();
            const newCents = Math.floor(cents / 10);
            setCents(newCents);
            onChange?.(newCents / 100);
        }
        // Other keys (Tab, Enter, arrows) pass through
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (!posMode || disabled) return;

        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
        if (pasted) {
            const newCents = Math.min(Number(pasted), 999999999);
            setCents(newCents);
            onChange?.(newCents / 100);
        }
    };

    return (
        <NumericFormat
            value={(cents / 100) as number}
            // In posMode, onKeyDown/onPaste handlers own all mutation.
            // When not in posMode, we fall back to standard NumericFormat behavior.
            onValueChange={posMode ? () => {} : (values) => onChange?.(values.floatValue)}
            thousandSeparator={true}
            prefix={prefix as string}
            decimalScale={2}
            fixedDecimalScale={true}
            allowNegative={false}
            placeholder={`${prefix}0.00`}
            customInput={Input}
            className={className}
            onKeyDown={posMode ? handleKeyDown : undefined}
            onPaste={posMode ? handlePaste : undefined}
            disabled={disabled}
            size={rest.size}
            {...(rest as any)}
            {...(inputProps as any)}
        />
    );
};
