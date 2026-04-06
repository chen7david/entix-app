export interface CursorPaginationConfig {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    pageSize: number;
    onNext: () => void;
    onPrev: () => void;
    onPageSizeChange?: (size: number) => void;
}

export interface ClientPaginationConfig {
    pageSize: number;
    current?: number;
    onChange?: (page: number, pageSize: number) => void;
}

export function isCursorPagination(
    pagination: CursorPaginationConfig | ClientPaginationConfig | null
): pagination is CursorPaginationConfig {
    return !!pagination && "onNext" in pagination;
}
