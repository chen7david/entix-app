import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    InboxOutlined,
    RedoOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import type { TableProps } from "antd";
import {
    Button,
    Col,
    DatePicker,
    Empty,
    Input,
    Row,
    Select,
    Space,
    Table,
    Tooltip,
    Typography,
    theme,
} from "antd";
import dayjs from "dayjs";
import type React from "react";
import { useCallback, useMemo, useState } from "react";

const { Text } = Typography;

export interface FilterConfig {
    type: "search" | "dateRange" | "select";
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
            <div className="flex-1 overflow-auto custom-scrollbar relative">
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
                    size="large"
                    scroll={{ x: "max-content" }}
                    className="data-table-pro-content"
                    onRow={(record) => ({
                        onClick: () => config.onRowClick?.(record),
                        className: config.onRowClick ? "cursor-pointer" : "",
                    })}
                    locale={{
                        emptyText: (
                            <Empty
                                image={
                                    <InboxOutlined
                                        className="text-4xl"
                                        style={{ color: token.colorFillSecondary }}
                                    />
                                }
                                description={
                                    <div className="py-12">
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
                        ),
                    }}
                />
            </div>

            {/* Premium Pagination - Glassmorphism Design */}
            {isCursorPagination(config.pagination) && (
                <div
                    className="p-4 px-8 border-t sticky bottom-0 z-20 backdrop-blur-md"
                    style={{
                        background: `${token.colorFillAlter}d9`, // Translucent background for glass effect
                        borderColor: token.colorBorderSecondary,
                        boxShadow: "0 -4px 12px -4px rgba(0,0,0,0.05)",
                    }}
                >
                    <Row justify="end" align="middle">
                        <Col>
                            <Space size="middle">
                                <Button
                                    disabled={!config.pagination.hasPrevPage}
                                    onClick={config.pagination.onPrev}
                                    icon={<ArrowLeftOutlined />}
                                    className="flex items-center justify-center rounded-xl h-[40px] px-5 border-none shadow-sm transition-all hover:scale-105 active:scale-95"
                                    style={{
                                        background: token.colorBgElevated,
                                        color: config.pagination.hasPrevPage
                                            ? token.colorText
                                            : token.colorTextDisabled,
                                    }}
                                >
                                    Previous
                                </Button>
                                <Button
                                    type="primary"
                                    disabled={!config.pagination.hasNextPage}
                                    onClick={config.pagination.onNext}
                                    icon={<ArrowRightOutlined />}
                                    iconPosition="end"
                                    className="flex items-center justify-center rounded-xl h-[40px] px-6 shadow-md transition-all hover:scale-105 active:scale-95 hover:shadow-lg"
                                >
                                    Next
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
            )}
        </div>
    );
}
