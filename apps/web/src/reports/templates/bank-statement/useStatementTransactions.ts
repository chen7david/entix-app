import { useInfiniteQuery } from "@tanstack/react-query";
import type {
    Transaction,
    TransactionHistoryResponse,
} from "@web/src/features/wallet/hooks/useTransactionHistory";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import { useEffect, useMemo } from "react";

/** Hard cap so a runaway range can't fetch unbounded pages. Narrow the
 * date range to stay below this; the drawer surfaces a warning when hit. */
export const STATEMENT_TRANSACTION_HARD_CAP = 500;

/** Maximum page size accepted by the API (`paginationSchema.limit.max(100)`). */
const STATEMENT_PAGE_SIZE = 100;

interface UseStatementTransactionsArgs {
    orgId: string;
    accountId: string;
    /** YYYY-MM-DD inclusive */
    startDate: string;
    /** YYYY-MM-DD inclusive */
    endDate: string;
    enabled?: boolean;
}

export interface StatementTransactionsResult {
    transactions: Transaction[];
    /** True only on the very first fetch (page 1). */
    isLoading: boolean;
    /** True on any in-flight fetch including pagination. */
    isFetching: boolean;
    /** True once every page in the range has been loaded; safe to print. */
    isExhausted: boolean;
    /** True when the hard cap was hit before exhaustion. */
    truncated: boolean;
    totalLoaded: number;
}

/**
 * Fetches every completed transaction in the date range for a single
 * account, cursoring through pages until exhaustion or the hard cap.
 * Used by the bank statement template so printed statements never
 * silently truncate.
 *
 * The auto-pagination effect destructures stable primitives from the
 * query result; the React-Query result object is a fresh reference on
 * every render, so depending on it directly thrashes the loop.
 */
export function useStatementTransactions({
    orgId,
    accountId,
    startDate,
    endDate,
    enabled = true,
}: UseStatementTransactionsArgs): StatementTransactionsResult {
    const query = useInfiniteQuery<TransactionHistoryResponse>({
        queryKey: ["statementTransactions", orgId, accountId, startDate, endDate],
        queryFn: async ({ pageParam }) => {
            const api = getApiClient();
            const res = await api.api.v1.orgs[":organizationId"].finance.transactions.$get({
                param: { organizationId: orgId },
                query: {
                    limit: STATEMENT_PAGE_SIZE,
                    cursor: (pageParam as string | undefined) ?? undefined,
                    startDate,
                    endDate,
                    accountId,
                    status: "completed",
                },
            });
            return hcJson<TransactionHistoryResponse>(res);
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: enabled && !!orgId && !!accountId,
        staleTime: QUERY_STALE_MS,
    });

    const transactions = useMemo(
        () => (query.data?.pages ?? []).flatMap((p) => p.data),
        [query.data]
    );
    const totalLoaded = transactions.length;
    const truncated = totalLoaded >= STATEMENT_TRANSACTION_HARD_CAP;

    /** Stable primitives — never put `query` itself in deps; React Query
     * returns a fresh result object on every render which would thrash
     * this effect and short-circuit the pagination loop. */
    const { isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = query;

    useEffect(() => {
        if (!enabled) return;
        if (isFetching || isFetchingNextPage) return;
        if (!hasNextPage) return;
        if (truncated) return;
        void fetchNextPage();
    }, [enabled, truncated, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage]);

    /** Safe to print only when every page has settled. */
    const isExhausted = !hasNextPage && !isFetching && !isFetchingNextPage;

    return {
        transactions,
        isLoading: query.isLoading,
        isFetching: isFetching || isFetchingNextPage,
        isExhausted,
        truncated,
        totalLoaded,
    };
}
