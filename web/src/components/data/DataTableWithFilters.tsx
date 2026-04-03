import { InboxOutlined, RedoOutlined, SearchOutlined } from "@ant-design/icons";
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
    theme,
} from "antd";
import dayjs from "dayjs";
import type React from "react";
import { useCallback, useMemo, useState } from "react";

export interface FilterConfig {
    type: "search" | "dateRange" | "select";
    key: string;
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

export interface DataTableConfig<T> {
    columns: TableProps<T>["columns"];
    data: T[];
    pagination: CursorPaginationConfig;
    loading?: boolean;
    filters: FilterConfig[];
    actions?: (record: T) => React.ReactNode;
    onFiltersChange: (filters: Record<string, any>) => void;
    onPaginationChange: (page: number, pageSize: number) => void;
    rowKey?: string | ((record: T) => string);
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
            className="data-table-pro-container flex flex-col h-full"
            style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorBorderSecondary}`,
            }}
        >
            {/* Context-Aware Filter Bar */}
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
                                    className="rounded-lg h-[42px]"
                                />
                            )}
                            {filter.type === "dateRange" && (
                                <DatePicker.RangePicker
                                    size="large"
                                    className="w-full rounded-lg h-[42px]"
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
                                    className="w-full rounded-lg h-[42px]"
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
                                className="flex items-center transition-colors h-[42px] px-4 rounded-lg"
                                style={{ color: token.colorTextSecondary }}
                            >
                                Reset
                            </Button>
                        </Tooltip>
                    </Col>
                </Row>
            </div>

            {/* Lean Theme-Aware Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <Table<T>
                    columns={tableColumns}
                    dataSource={config.data}
                    pagination={false}
                    loading={config.loading}
                    rowKey={config.rowKey || "id"}
                    size="large"
                    scroll={{ x: "max-content" }}
                    className="data-table-pro-content"
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
                                    <div className="py-6">
                                        <p
                                            style={{ color: token.colorTextTertiary }}
                                            className="text-base font-medium"
                                        >
                                            No matches found
                                        </p>
                                    </div>
                                }
                            />
                        ),
                    }}
                />
            </div>

            {/* Cursor-Based Navigation */}
            <div
                className="p-6 px-8 border-t"
                style={{
                    background: token.colorFillAlter,
                    borderColor: token.colorBorderSecondary,
                }}
            >
                <Row justify="end" align="middle" gutter={16}>
                    <Col>
                        <Space>
                            <Button
                                disabled={!config.pagination.hasPrevPage}
                                onClick={config.pagination.onPrev}
                            >
                                Previous
                            </Button>
                            <Button
                                type="primary"
                                disabled={!config.pagination.hasNextPage}
                                onClick={config.pagination.onNext}
                            >
                                Next
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
