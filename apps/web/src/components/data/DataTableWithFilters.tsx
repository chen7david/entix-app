import { InboxOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { Table, theme } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ClientPaginationConfig, CursorPaginationConfig } from "./DataTable.types";
import { isCursorPagination } from "./DataTable.types";
import { DataTablePagination } from "./DataTablePagination";
import { FilterBar, type FilterConfig } from "./FilterBar";
import { TableEmptyState } from "./TableEmptyState";

// Re-export pagination types and helpers so callers may import from either location
export type { ClientPaginationConfig, CursorPaginationConfig, FilterConfig };
export { isCursorPagination };

export interface DataTableConfig<T> {
    columns: TableProps<T>["columns"];
    data: T[];
    pagination: CursorPaginationConfig | ClientPaginationConfig | null;
    loading?: boolean;
    filters: FilterConfig[];
    actions?: (record: T) => React.ReactNode;
    onFiltersChange: (filters: Record<string, any>) => void;
    onRowClick?: (record: T) => void;
    rowKey?: string | ((record: T) => string);
    selectedRowKey?: string | number | null;
    initialFilters?: Record<string, any>;
    filterBar?: {
        showReset?: boolean;
        resetLabel?: React.ReactNode;
        className?: string;
        compact?: boolean;
        resetIconOnly?: boolean;
    };
}

function DataTableWithFiltersInternal<T extends object>({
    config,
}: {
    config: DataTableConfig<T>;
}) {
    const { token } = theme.useToken();
    const [localFilters, setLocalFilters] = useState<Record<string, any>>(
        config.initialFilters ?? {}
    );

    useEffect(() => {
        setLocalFilters(config.initialFilters ?? {});
    }, [config.initialFilters]);

    const handleFiltersChange = useCallback(
        (newFilters: Record<string, any>) => {
            setLocalFilters(newFilters);
            config.onFiltersChange(newFilters);
        },
        [config.onFiltersChange]
    );

    const handleReset = useCallback(() => {
        handleFiltersChange(config.initialFilters ?? {});
    }, [config.initialFilters, handleFiltersChange]);

    const tableColumns = useMemo(() => {
        const cols = [...(config.columns || [])];
        if (config.actions) {
            cols.push({
                title: "Actions",
                key: "actions",
                fixed: "right" as const,
                width: 80,
                align: "center",
                // Wrap in a data-row-action sentinel so the onRow guard below
                // can swallow clicks that originate here before they fire onRowClick.
                render: (_: any, record: T) => (
                    <div
                        data-row-action="true"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        {config.actions?.(record)}
                    </div>
                ),
            });
        }
        return cols;
    }, [config.columns, config.actions]);

    const pagination = config.pagination;

    return (
        <div className="data-table-wrapper flex flex-col flex-1 min-h-0 overflow-hidden">
            {config.filters.length > 0 && (
                <FilterBar
                    filters={config.filters}
                    values={localFilters}
                    initialValues={config.initialFilters}
                    onChange={(nextFilters) => handleFiltersChange(nextFilters)}
                    onReset={handleReset}
                    showReset={config.filterBar?.showReset}
                    resetLabel={config.filterBar?.resetLabel}
                    className={config.filterBar?.className}
                    compact={config.filterBar?.compact}
                    resetIconOnly={config.filterBar?.resetIconOnly}
                />
            )}

            <div
                className="data-table-pro-container flex-1 overflow-hidden"
                style={{
                    background: token.colorBgContainer,
                    borderRadius: token.borderRadiusLG,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div className="flex-1 custom-scrollbar relative overflow-auto">
                    <Table<T>
                        columns={tableColumns}
                        dataSource={config.data}
                        pagination={false}
                        loading={config.loading}
                        rowKey={config.rowKey || "id"}
                        size="middle"
                        sticky={true}
                        scroll={{ x: "max-content" }}
                        className="data-table-pro-content"
                        onRow={(record) => {
                            const key =
                                typeof config.rowKey === "function"
                                    ? config.rowKey(record)
                                    : (record as any)[config.rowKey || "id"];
                            const isSelected =
                                config.selectedRowKey !== undefined &&
                                config.selectedRowKey === key;

                            return {
                                onClick: (e) => {
                                    // Double-fence: ignore clicks that originate from the
                                    // actions column sentinel, regardless of stopPropagation.
                                    const target = e.target as HTMLElement;
                                    if (target.closest("[data-row-action]")) return;
                                    config.onRowClick?.(record);
                                },
                                className:
                                    `${config.onRowClick ? "cursor-pointer" : ""} ${isSelected ? "row-active" : ""}`.trim(),
                            };
                        }}
                        locale={{
                            emptyText: (
                                <TableEmptyState
                                    icon={
                                        <InboxOutlined
                                            style={{
                                                fontSize: 64,
                                                color: token.colorFillSecondary,
                                            }}
                                        />
                                    }
                                />
                            ),
                        }}
                    />
                </div>

                {pagination && (
                    <div
                        className="px-4 py-3 border-t backdrop-blur-md sticky bottom-0 z-20 mt-auto"
                        style={{
                            background: `${token.colorFillAlter}d9`,
                            borderColor: token.colorBorderSecondary,
                            borderBottomLeftRadius: token.borderRadiusLG,
                            borderBottomRightRadius: token.borderRadiusLG,
                        }}
                    >
                        <DataTablePagination pagination={pagination} />
                    </div>
                )}
                <style>{`
                .data-table-pro-container .ant-table-row.row-active > td {
                    background-color: ${token.colorPrimary}14;
                    position: relative;
                }
                .data-table-pro-container .ant-table-row.row-active > td:first-child {
                    border-left: 3px solid ${token.colorPrimary};
                }
                .data-table-pro-container .ant-table-row.row-active:hover > td {
                    background-color: ${token.colorPrimary}1a;
                }
                .data-table-pro-container .ant-table-row > td:first-child {
                    border-left: 3px solid transparent;
                    transition: border-color 0.2s ease, background-color 0.2s ease;
                }
            `}</style>
            </div>
        </div>
    );
}

export const DataTableWithFilters = React.memo(DataTableWithFiltersInternal) as <
    T extends object,
>(props: {
    config: DataTableConfig<T>;
}) => React.ReactElement;
