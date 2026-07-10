import { SearchOutlined } from "@ant-design/icons";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { Input, theme } from "antd";
import { useEffect, useMemo, useState } from "react";

type SearchFilterControlProps = {
    value: string;
    placeholder?: string;
    allowClear?: boolean;
    disabled?: boolean;
    debounceMs?: number;
    showTypingIndicator?: boolean;
    typingIndicatorText?: string;
    onValueChange: (value: string) => void;
};

export function SearchFilterControl({
    value,
    placeholder,
    allowClear = true,
    disabled,
    debounceMs,
    showTypingIndicator = false,
    typingIndicatorText = "typing...",
    onValueChange,
}: SearchFilterControlProps) {
    const { token } = theme.useToken();
    const [localValue, setLocalValue] = useState(value);

    const [debouncedValue, debounceState] = useDebouncedValue(
        localValue,
        {
            wait: debounceMs ?? 0,
        },
        (state) => ({ isPending: state.isPending })
    );

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if ((debounceMs ?? 0) <= 0) return;
        if (debouncedValue !== value) onValueChange(debouncedValue);
    }, [debounceMs, debouncedValue, onValueChange, value]);

    const suffix = useMemo(() => {
        if (!showTypingIndicator) return undefined;
        return debounceState.state.isPending ? (
            <span className="text-xs italic" style={{ color: token.colorTextTertiary }}>
                {typingIndicatorText}
            </span>
        ) : undefined;
    }, [
        debounceState.state.isPending,
        showTypingIndicator,
        token.colorTextTertiary,
        typingIndicatorText,
    ]);

    return (
        <Input
            placeholder={placeholder || "Search..."}
            prefix={<SearchOutlined style={{ color: token.colorTextDescription }} />}
            value={localValue}
            onChange={(e) => {
                const next = e.target.value;
                setLocalValue(next);
                if ((debounceMs ?? 0) <= 0 && next !== value) {
                    onValueChange(next);
                }
            }}
            variant="outlined"
            className="rounded-lg h-[40px] transition-colors"
            allowClear={allowClear}
            suffix={suffix}
            disabled={disabled}
        />
    );
}
