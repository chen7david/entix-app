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
            setFilters((prev) => {
                const isFullReset = Object.keys(newFilters).length === 0;
                const next = isFullReset ? initialFilters : { ...prev, ...newFilters };

                // Determine if any filter actually changed compared to the previous state.
                // We check all potential keys (union of current and next) to catch removals and updates.
                const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
                let filtersChanged = false;

                for (const key of allKeys) {
                    if ((prev as any)[key] !== (next as any)[key]) {
                        filtersChanged = true;
                        break;
                    }
                }

                if (filtersChanged) {
                    // Side-effect: Reset pagination state
                    resetCursor();

                    // Side-effect: Synchronize local search input if it changed
                    if (next.search !== prev.search) {
                        setSearchInput(next.search || "");
                    }
                }

                return next;
            });
        },
        [initialFilters, resetCursor]
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
