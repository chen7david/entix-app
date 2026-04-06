import { useDebouncedValue } from "@tanstack/react-pacer";
import { DEFAULT_PAGE_SIZE } from "@web/src/components/data/DataTable.types";
import { useCallback, useState } from "react";

export type CursorTableStateOptions<T extends { search?: string }> = {
    initialPageSize?: number;
    initialFilters?: T;
    debounceMs?: number;
};

/**
 * A reusable hook for managing cursor-based pagination and filtering state.
 * Centralizes search debouncing, cursor stack management, and automatic resets.
 */
export function useCursorTableState<T extends { search?: string }>(
    options: CursorTableStateOptions<T> = {}
) {
    const {
        initialPageSize = DEFAULT_PAGE_SIZE,
        initialFilters = {} as T,
        debounceMs = 350,
    } = options;

    const [filters, setFilters] = useState<T>(initialFilters);
    const [searchInput, setSearchInput] = useState(filters.search || "");
    const [cursorStack, setCursorStack] = useState<string[]>([]);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const [debouncedSearch] = useDebouncedValue(searchInput, {
        wait: debounceMs,
    });

    const resetCursor = useCallback(() => {
        setCursorStack([]);
    }, []);

    const handleFiltersChange = useCallback(
        (newFilters: Partial<T>) => {
            // Handle search separately for local UI state
            if (newFilters.search !== undefined) {
                setSearchInput(newFilters.search);
            }

            // Check if any filter besides search has changed
            // Cursor resets are triggered on raw filter input changes to ensure immediate pagination reset.
            let otherFiltersChanged = false;
            for (const key in newFilters) {
                if (key !== "search") {
                    if (newFilters[key] !== filters[key]) {
                        otherFiltersChanged = true;
                        break;
                    }
                }
            }

            if (otherFiltersChanged) {
                resetCursor();
            }

            setFilters((prev) => ({ ...prev, ...newFilters }));
        },
        [filters, resetCursor]
    );

    const handlePageSizeChange = useCallback(
        (size: number) => {
            setPageSize(size);
            resetCursor();
        },
        [resetCursor]
    );

    const handleNext = useCallback((nextCursor: string | null | undefined) => {
        if (nextCursor) {
            setCursorStack((prev) => [...prev, nextCursor]);
        }
    }, []);

    const handlePrev = useCallback(() => {
        setCursorStack((prev) => prev.slice(0, -1));
    }, []);

    return {
        // State
        filters,
        searchInput,
        debouncedSearch,
        cursorStack,
        pageSize,
        currentCursor: cursorStack[cursorStack.length - 1],

        // Helpers
        setSearchInput,
        onFiltersChange: handleFiltersChange,
        onPageSizeChange: handlePageSizeChange,
        onNext: handleNext,
        onPrev: handlePrev,
        resetCursor,
    };
}
