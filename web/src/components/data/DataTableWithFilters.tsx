import { InboxOutlined, RedoOutlined, SearchOutlined } from "@ant-design/icons";
import type { TableProps } from "antd";
import {
    Button,
    Col,
    DatePicker,
    Empty,
    Input,
    Row,
    Segmented,
    Select,
    Table,
    Tooltip,
    Typography,
    theme,
} from "antd";
import dayjs from "dayjs";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { DataTablePagination } from "./DataTablePagination";

const { Text } = Typography;

export interface FilterConfig {
    type: "search" | "dateRange" | "select" | "segmented";
    key: string;
    label?: string;
    placeholder?: string;
    options?: { label: string; value: string | number }[];
    keys?: string[]; // ['startDate', 'endDate']
}

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
    total?: number;
    onChange?: (page: number, pageSize: number) => void;
}

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

export function isCursorPagination(
    pagination: CursorPaginationConfig | ClientPaginationConfig | null
): pagination is CursorPaginationConfig {
    return !!pagination && "onNext" in pagination;
}

export function DataTableWithFilters<T extends object>({ config }: { config: DataTableConfig<T> }) {
    const { token } = theme.useToken();
    const [localFilters, setLocalFilters] = useState<Record<string, any>>({});

    const handleFiltersChange = useCallback(
        (newFilters: Record<string, any>) => {
            setLocalFilters(newFilters);
            config.onFiltersChange(newFilters);
        },
        [config]
    );

    const handleReset = () => {
        handleFiltersChange({});
    };

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

    return (
        <div
            className="data-table-pro-container flex flex-col h-full overflow-hidden"
            style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorBorderSecondary}`,
            }}
        >
            {/* Premium Filter Bar */}
            <div
                className="p-6 border-b"
                style={{
                    background: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                }}
            >
                <Row gutter={[16, 16]} align="middle">
                    {config.filters.map((filter) => (
                        <Col key={filter.key} xs={24} sm={12} md={8} lg={6}>
                            {filter.label && (
                                <div className="mb-1.5 px-0.5">
                                    <Text
                                        type="secondary"
                                        className="text-xs font-semibold uppercase tracking-wider"
                                    >
                                        {filter.label}
                                    </Text>
                                </div>
                            )}
                            {filter.type === "search" && (
                                <Input
                                    placeholder={filter.placeholder || "Search..."}
                                    prefix={
                                        <SearchOutlined
                                            style={{ color: token.colorTextDescription }}
                                        />
                                    }
                                    value={localFilters[filter.key] || ""}
                                    onChange={(e) =>
                                        handleFiltersChange({
                                            ...localFilters,
                                            [filter.key]: e.target.value,
                                        })
                                    }
                                    size="large"
                                    allowClear
                                    className="rounded-xl h-[44px] transition-all focus:shadow-md"
                                />
                            )}
                            {filter.type === "dateRange" && (
                                <DatePicker.RangePicker
                                    size="large"
                                    className="w-full rounded-xl h-[44px] transition-all focus:shadow-md"
                                    value={
                                        localFilters[filter.keys?.[0] || "startDate"] &&
                                        localFilters[filter.keys?.[1] || "endDate"]
                                            ? [
                                                  dayjs(
                                                      localFilters[filter.keys?.[0] || "startDate"]
                                                  ),
                                                  dayjs(
                                                      localFilters[filter.keys?.[1] || "endDate"]
                                                  ),
                                              ]
                                            : null
                                    }
                                    onChange={(dates) => {
                                        const startKey = filter.keys?.[0] || "startDate";
                                        const endKey = filter.keys?.[1] || "endDate";
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
                                    className="w-full rounded-xl h-[44px] transition-all hover:shadow-sm"
                                    size="large"
                                    options={filter.options}
                                    value={localFilters[filter.key] || undefined}
                                    onChange={(value) =>
                                        handleFiltersChange({
                                            ...localFilters,
                                            [filter.key]: value,
                                        })
                                    }
                                    allowClear
                                />
                            )}
                            {filter.type === "segmented" && (
                                <Segmented
                                    block
                                    size="large"
                                    className="rounded-xl h-[44px] p-1"
                                    options={filter.options || []}
                                    value={
                                        localFilters[filter.key] ||
                                        (filter.options?.[0]?.value ?? "")
                                    }
                                    onChange={(value) =>
                                        handleFiltersChange({
                                            ...localFilters,
                                            [filter.key]: value,
                                        })
                                    }
                                />
                            )}
                        </Col>
                    ))}
                    <Col>
                        <Tooltip title="Reset all filters">
                            <Button
                                icon={<RedoOutlined />}
                                onClick={handleReset}
                                size="large"
                                type="text"
                                className="flex items-center transition-all hover:bg-black/5 dark:hover:bg-white/10 h-[44px] px-4 rounded-xl mt-auto"
                                style={{
                                    color: token.colorTextSecondary,
                                    marginTop: config.filters.some((f) => f.label) ? "22px" : "0",
                                }}
                            >
                                Reset
                            </Button>
                        </Tooltip>
                    </Col>
                </Row>
            </div>
            {/* Lean Theme-Aware Table */}
            <div
                className={`flex-1 custom-scrollbar relative ${(config.data?.length ?? 0) > 0 ? "overflow-auto" : "overflow-hidden flex flex-col justify-center"}`}
            >
                <Table<T>
                    columns={tableColumns}
                    dataSource={config.data}
                    pagination={
                        !isCursorPagination(config.pagination)
                            ? (config.pagination ?? false)
                            : false
                    }
                    loading={config.loading}
                    rowKey={config.rowKey || "id"}
                    size="middle"
                    scroll={{ x: "max-content" }}
                    className="data-table-pro-content"
                    onRow={(record) => {
                        const key =
                            typeof config.rowKey === "function"
                                ? config.rowKey(record)
                                : (record as any)[config.rowKey || "id"];
                        const isSelected =
                            config.selectedRowKey !== undefined && config.selectedRowKey === key;

                        return {
                            onClick: () => config.onRowClick?.(record),
                            className:
                                `${config.onRowClick ? "cursor-pointer" : ""} ${isSelected ? "row-active" : ""}`.trim(),
                        };
                    }}
                    locale={{
                        emptyText: (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Empty
                                    image={
                                        <InboxOutlined
                                            style={{
                                                fontSize: 64,
                                                color: token.colorFillSecondary,
                                                marginBottom: 16,
                                            }}
                                        />
                                    }
                                    description={
                                        <div className="max-w-[300px]">
                                            <p
                                                style={{ color: token.colorTextTertiary }}
                                                className="text-lg font-medium mb-1"
                                            >
                                                No matches found
                                            </p>
                                            <Text type="secondary">
                                                Try adjusting your filters or search terms
                                            </Text>
                                        </div>
                                    }
                                />
                            </div>
                        ),
                    }}
                />
            </div>
            {/* Premium Pagination - Glassmorphism Design */}
            {(() => {
                if (!config.pagination) return null;

                // For client-side, hide if total <= pageSize (no navigation needed)
                if (!isCursorPagination(config.pagination)) {
                    if (
                        config.pagination.total !== undefined &&
                        config.pagination.total <= config.pagination.pageSize
                    ) {
                        return null;
                    }
                }

                return (
                    <div
                        className="p-3 border-t sticky bottom-0 z-20 backdrop-blur-md"
                        style={{
                            background: `${token.colorFillAlter}d9`,
                            borderColor: token.colorBorderSecondary,
                            boxShadow: "0 -4px 12px -4px rgba(0,0,0,0.05)",
                        }}
                    >
                        <DataTablePagination pagination={config.pagination} />
                    </div>
                );
            })()}
            <style>{`
                .ant-table-row.row-active > td {
                    background-color: ${token.colorPrimary}14 !important;
                    position: relative;
                }
                .ant-table-row.row-active > td:first-child {
                    border-left: 3px solid ${token.colorPrimary} !important;
                }
                /* Ensure hover state still feels interactive but keeps the theme */
                .ant-table-row.row-active:hover > td {
                    background-color: ${token.colorPrimary}1a !important;
                }
                /* Animation for the border accent */
                .ant-table-row > td:first-child {
                    border-left: 3px solid transparent;
                    transition: border-color 0.2s ease, background-color 0.2s ease;
                }
            `}</style>
        </div>
    );
}
