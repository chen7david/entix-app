import { PrinterOutlined } from "@ant-design/icons";
import type { WalletAccountDTO } from "@shared";
import { Alert, Button, DatePicker, Drawer, Space, Statistic } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useMemo, useRef, useState } from "react";
import { buildPrintFileName } from "../../core/buildPrintFileName";
import { usePrintDocument } from "../../core/usePrintDocument";
import { BankStatementDocument } from "./BankStatementDocument";
import { buildStatementData } from "./bank-statement.types";
import {
    STATEMENT_TRANSACTION_HARD_CAP,
    useStatementTransactions,
} from "./useStatementTransactions";

const { RangePicker } = DatePicker;

/** Matches Ant Design Drawer close animation (~300ms) plus a small buffer before print. */
const DRAWER_CLOSE_BEFORE_PRINT_MS = 350;

type RangePreset = { label: string; value: [Dayjs, Dayjs] };

/** Quick-pick presets for common statement periods. End-of-day is used
 * for past ranges so the entire final day's transactions are included. */
function buildRangePresets(): RangePreset[] {
    const today = dayjs();
    const startOfThisMonth = today.startOf("month");
    const lastMonth = today.subtract(1, "month");
    const startOfLastMonth = lastMonth.startOf("month");
    const endOfLastMonth = lastMonth.endOf("month");
    const startOfThisYear = today.startOf("year");
    const lastYear = today.subtract(1, "year");
    const startOfLastYear = lastYear.startOf("year");
    const endOfLastYear = lastYear.endOf("year");

    return [
        { label: "This Month", value: [startOfThisMonth, today] },
        { label: "Last Month", value: [startOfLastMonth, endOfLastMonth] },
        { label: "Last 30 Days", value: [today.subtract(30, "day"), today] },
        { label: "This Year", value: [startOfThisYear, today] },
        { label: "Last Year", value: [startOfLastYear, endOfLastYear] },
        { label: "Last 12 Months", value: [today.subtract(1, "year"), today] },
    ];
}

interface StatementPrintDrawerProps {
    account: WalletAccountDTO;
    orgId: string;
    orgName: string;
    logoUrl?: string;
}

export function StatementPrintDrawer({
    account,
    orgId,
    orgName,
    logoUrl,
}: StatementPrintDrawerProps) {
    const [open, setOpen] = useState(false);
    const [dateRange, setDateRange] = useState<[Date, Date]>(() => {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return [firstOfMonth, now];
    });

    const closingForPrintRef = useRef(false);
    const { print, cancelPendingPrint } = usePrintDocument();
    /** Computed once per drawer mount; "today" doesn't need to track midnight rollovers. */
    const presets = useMemo(() => buildRangePresets(), []);

    /** Send full ISO timestamps spanning the full local day so the server
     * (which compares against `new Date(filters.endDate)`) doesn't silently
     * exclude transactions on the boundary days. Bare YYYY-MM-DD is parsed
     * as midnight UTC, which truncates the end day on every timezone east
     * of UTC and the start day on every timezone west of UTC. */
    const startDate = dayjs(dateRange[0]).startOf("day").toISOString();
    const endDate = dayjs(dateRange[1]).endOf("day").toISOString();

    const { transactions, isLoading, isFetching, isExhausted, truncated, totalLoaded } =
        useStatementTransactions({
            orgId,
            accountId: account.id,
            startDate,
            endDate,
            enabled: open,
        });

    /** Closing balance can only be safely derived from account.balanceCents
     * when the period ends today. For past periods we currently lack a
     * balance-at-date endpoint; flag that to the user. */
    const isCurrentPeriod = dayjs(dateRange[1]).isSame(dayjs(), "day");

    const canPrint = isExhausted && !isFetching;

    const handlePrint = () => {
        if (!canPrint) return;
        const statementData = buildStatementData(
            account,
            transactions,
            dateRange[0],
            dateRange[1],
            orgName,
            logoUrl
        );
        const periodLabel = dayjs(dateRange[0]).isSame(dateRange[1], "month")
            ? `${dayjs(dateRange[0]).format("MMM YYYY")} Statement`
            : `${dayjs(dateRange[0]).format("MMM YYYY")}–${dayjs(dateRange[1]).format("MMM YYYY")} Statement`;
        const fileName = buildPrintFileName(account.name, periodLabel);
        closingForPrintRef.current = true;
        setOpen(false);
        print(
            <BankStatementDocument data={statementData} />,
            DRAWER_CLOSE_BEFORE_PRINT_MS,
            fileName
        );
    };

    const handleDrawerClose = () => {
        if (!closingForPrintRef.current) {
            cancelPendingPrint();
        }
        setOpen(false);
    };

    return (
        <>
            <Button size="small" icon={<PrinterOutlined />} onClick={() => setOpen(true)}>
                Print Statement
            </Button>

            <Drawer
                title={`Statement — ${account.name}`}
                placement="right"
                width={420}
                open={open}
                onClose={handleDrawerClose}
                afterOpenChange={(visible) => {
                    if (!visible) {
                        closingForPrintRef.current = false;
                    }
                }}
                footer={
                    <Button
                        type="primary"
                        icon={<PrinterOutlined />}
                        block
                        loading={isLoading || isFetching}
                        disabled={!canPrint}
                        onClick={handlePrint}
                    >
                        {canPrint ? "Print / Save as PDF" : "Loading transactions…"}
                    </Button>
                }
            >
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    <div>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>Statement Period</div>
                        <RangePicker
                            style={{ width: "100%" }}
                            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                            presets={presets}
                            allowClear={false}
                            onChange={(dates) => {
                                if (dates?.[0] && dates?.[1]) {
                                    setDateRange([dates[0].toDate(), dates[1].toDate()]);
                                }
                            }}
                        />
                    </div>

                    <div style={{ background: "#fafafa", borderRadius: 8, padding: 16 }}>
                        <Statistic
                            title="Transactions in period"
                            value={isLoading ? "…" : totalLoaded}
                        />
                    </div>

                    {truncated && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Statement truncated"
                            description={`More than ${STATEMENT_TRANSACTION_HARD_CAP} transactions were found in this period. Only the first ${STATEMENT_TRANSACTION_HARD_CAP} will be printed. Narrow the date range for a complete statement.`}
                        />
                    )}

                    {!isCurrentPeriod && (
                        <Alert
                            type="info"
                            showIcon
                            message="Closing balance is the live account balance"
                            description="This statement uses the account's current balance as the closing balance. If transactions occurred after the period end, the opening balance figure may be off. Use today's date as the end date for an exact statement."
                        />
                    )}

                    <div style={{ color: "#888", fontSize: 12 }}>
                        Use your browser&apos;s print dialog to save as PDF. Set paper size to A4
                        for best results.
                    </div>
                </Space>
            </Drawer>
        </>
    );
}
