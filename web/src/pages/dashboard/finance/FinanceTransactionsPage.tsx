import { ClearOutlined, SearchOutlined } from "@ant-design/icons";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { TransactionLedgerTable } from "@web/src/features/finance/components/TransactionLedgerTable";
import { useReverseTransaction } from "@web/src/features/finance/hooks/useReverseTransaction";
import { useTransactions } from "@web/src/features/finance/hooks/useTransactions";
import { useOrganization } from "@web/src/features/organization";
import {
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Typography,
} from "antd";
import type React from "react";
import { useState } from "react";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const FinanceTransactionsPage: React.FC = () => {
    const { activeOrganization } = useOrganization();
    const orgId = activeOrganization?.id;

    // Filter State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [dateRange, setDateRange] = useState<[any, any] | null>(null);
    const [minAmount, setMinAmount] = useState<number | null>(null);
    const [maxAmount, setMaxAmount] = useState<number | null>(null);
    const [status, setStatus] = useState<string | undefined>(undefined);
    const [searchId, setSearchId] = useState("");

    const { data, isLoading } = useTransactions(orgId, {
        page,
        pageSize,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
        minAmount: minAmount ? minAmount * 100 : undefined,
        maxAmount: maxAmount ? maxAmount * 100 : undefined,
        status,
        txId: searchId || undefined,
    });

    const { mutate: reverse, isPending: isReversing, variables } = useReverseTransaction(orgId);

    const resetFilters = () => {
        setDateRange(null);
        setMinAmount(null);
        setMaxAmount(null);
        setStatus(undefined);
        setSearchId("");
        setPage(1);
    };

    return (
        <>
            <Toolbar />
            <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 24 }}>
                    <Title level={2} style={{ marginBottom: 4 }}>
                        Financial Ledger
                    </Title>
                    <Text type="secondary">
                        A comprehensive, immutable record of all organizational financial
                        transactions and reversals.
                    </Text>
                </div>

                {/* Filter Bar */}
                <Card style={{ marginBottom: 24 }} bodyStyle={{ padding: 16 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} lg={8}>
                            <Input
                                prefix={
                                    <SearchOutlined
                                        style={{ color: "var(--ant-color-text-description)" }}
                                    />
                                }
                                placeholder="Search by Transaction ID..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                size="large"
                            />
                        </Col>

                        <Col xs={24} md={12} lg={6}>
                            <RangePicker
                                style={{ width: "100%" }}
                                value={dateRange}
                                onChange={(val) => setDateRange(val as any)}
                                size="large"
                            />
                        </Col>

                        <Col xs={12} md={6} lg={4}>
                            <Select
                                placeholder="Status"
                                style={{ width: "100%" }}
                                allowClear
                                value={status}
                                onChange={setStatus}
                                size="large"
                                options={[
                                    { label: "Completed", value: "completed" },
                                    { label: "Reversed", value: "reversed" },
                                    { label: "Pending", value: "pending" },
                                ]}
                            />
                        </Col>

                        <Col xs={12} md={6} lg={4}>
                            <Button
                                icon={<ClearOutlined />}
                                onClick={resetFilters}
                                size="large"
                                block
                            >
                                Reset
                            </Button>
                        </Col>

                        <Col xs={24}>
                            <Space align="center">
                                <Text strong type="secondary" style={{ fontSize: 12 }}>
                                    AMOUNT RANGE
                                </Text>
                                <InputNumber
                                    placeholder="Min"
                                    value={minAmount}
                                    onChange={setMinAmount}
                                    precision={2}
                                    size="large"
                                    prefix="$"
                                />
                                <Text type="secondary">—</Text>
                                <InputNumber
                                    placeholder="Max"
                                    value={maxAmount}
                                    onChange={setMaxAmount}
                                    precision={2}
                                    size="large"
                                    prefix="$"
                                />
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* Table */}
                <TransactionLedgerTable
                    transactions={data?.items || []}
                    loading={isLoading}
                    onReverse={(txId, reason) => reverse({ txId, reason })}
                    isReversing={isReversing ? variables?.txId : null}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: data?.items?.length
                            ? data.items.length < pageSize
                                ? (page - 1) * pageSize + data.items.length
                                : 1000
                            : 0,
                        onChange: (p, ps) => {
                            setPage(p);
                            setPageSize(ps);
                        },
                    }}
                />
            </div>
        </>
    );
};
