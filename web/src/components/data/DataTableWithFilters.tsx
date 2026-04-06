import { InboxOutlined, RedoOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import { Button, DatePicker, Input, Segmented, Select, Table, theme } from "antd";
import dayjs from "dayjs";
import React, { useCallback, useMemo, useState } from "react";
import type { ClientPaginationConfig, CursorPaginationConfig } from "./DataTable.types";
import { isCursorPagination } from "./DataTable.types";
import { DataTablePagination } from "./DataTablePagination";
import { TableEmptyState } from "./TableEmptyState";

// Re-export pagination types and helpers so callers may import from either location
export type { ClientPaginationConfig, CursorPaginationConfig };
export { isCursorPagination };

export type FilterConfig =
    | {
          type: "search" | "select" | "segmented";
          key: string;
          label?: string;
          placeholder?: string;
          options?: { label: string; value: string | number }[];
      }
    | {
          type: "dateRange";
          key: string;
          keys: [string, string];
          label?: string;
          placeholder?: string;
      };

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
}

function DataTableWithFiltersInternal<T extends object>({
    config,
}: {
    config: DataTableConfig<T>;
}) {
    const { token } = theme.useToken();
    const [localFilters, setLocalFilters] = useState<Record<string, any>>({});

    const handleFiltersChange = useCallback(
        (newFilters: Record<string, any>) => {
            setLocalFilters(newFilters);
            config.onFiltersChange(newFilters);
        },
        [config.onFiltersChange]
    );

    const updateFilter = useCallback(
        (key: string, value: any) => {
            handleFiltersChange({
                ...localFilters,
                [key]: value,
            });
        },
        [localFilters, handleFiltersChange]
    );

    const handleReset = useCallback(() => {
        handleFiltersChange({});
    }, [handleFiltersChange]);

    const tableColumns = useMemo(() => {
        const cols = [...(config.columns || [])];
        if (config.actions) {
            cols.push({
                title: "Actions",
                key: "actions",
                fixed: "right" as const,
                width: 80,
                align: "center",
                render: (_: any, record: T) => config.actions?.(record),
            });
        }
        return cols;
    }, [config.columns, config.actions]);

    const hasFiltersSet = useMemo(() => {
        return Object.values(localFilters).some(
            (v) =>
                v !== undefined &&
                v !== "" &&
                v !== null &&
                (Array.isArray(v) ? v.length > 0 : true)
        );
    }, [localFilters]);

    const pagination = config.pagination;

    return (
        <div className="data-table-wrapper flex flex-col flex-1 min-h-0 overflow-hidden">
            {config.filters.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap mb-4 px-0.5">
                    {config.filters.map((filter) => (
                        <div
                            key={filter.key}
                            className="flex-shrink-0"
                            style={{
                                minWidth: filter.type === "dateRange" ? 280 : 200,
                            }}
                        >
                            {filter.type === "search" && (
                                <Input
                                    placeholder={filter.placeholder || "Search..."}
                                    prefix={
                                        <SearchOutlined
                                            style={{ color: token.colorTextDescription }}
                                        />
                                    }
                                    value={localFilters[filter.key] || ""}
                                    onChange={(e) => updateFilter(filter.key, e.target.value)}
                                    className="rounded-lg h-[40px] transition-all hover:border-primary focus:border-primary shadow-sm"
                                    allowClear
                                />
                            )}
                            {filter.type === "dateRange" && (
                                <DatePicker.RangePicker
                                    className="w-full rounded-lg h-[40px] shadow-sm"
                                    value={
                                        localFilters[filter.keys[0]] && localFilters[filter.keys[1]]
                                            ? [
                                                  dayjs(localFilters[filter.keys[0]]),
                                                  dayjs(localFilters[filter.keys[1]]),
                                              ]
                                            : null
                                    }
                                    onChange={(dates) => {
                                        const startKey = filter.keys[0];
                                        const endKey = filter.keys[1];
                                        handleFiltersChange({
                                            ...localFilters,
                                            [startKey]: dates?.[0]?.toISOString() || null,
                                            [endKey]: dates?.[1]?.toISOString() || null,
                                        });
                                    }}
                                />
                            )}
                            {filter.type === "select" && (
                                <Select
                                    placeholder={filter.placeholder || "All Statuses"}
                                    className="w-full h-[40px]"
                                    options={filter.options}
                                    value={localFilters[filter.key] || undefined}
                                    onChange={(value) => updateFilter(filter.key, value)}
                                    allowClear
                                />
                            )}
                            {filter.type === "segmented" && (
                                <Segmented
                                    block
                                    options={filter.options || []}
                                    value={
                                        localFilters[filter.key] ||
                                        (filter.options?.[0]?.value ?? "")
                                    }
                                    onChange={(value) => updateFilter(filter.key, value)}
                                    className="rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800"
                                />
                            )}
                        </div>
                    ))}

                    {hasFiltersSet && (
                        <Button
                            icon={<RedoOutlined />}
                            onClick={handleReset}
                            type="text"
                            className="flex items-center text-sm font-medium transition-all hover:bg-black/5 dark:hover:bg-white/10 h-[40px] px-3 rounded-lg"
                            style={{
                                color: token.colorTextSecondary,
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </div>
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
                                onClick: () => config.onRowClick?.(record),
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
