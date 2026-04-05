import {
    AnalyticsMetricCards,
    AttendanceTrendChart,
    SessionVolumeChart,
    useAnalytics,
} from "@web/src/features/analytics";
import { useOrganization } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { Col, DatePicker, Row, Select, Typography } from "antd";
import { useEffect } from "react";
import { useSearchParams } from "react-router";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export const OrganizationAnalyticsPage = () => {
    const { activeOrganization } = useOrganization();
    const [searchParams, setSearchParams] = useSearchParams();

    // Default to "This Month" dynamically cleanly linking URL state universally
    const defaultStart = DateUtils.startOf("month");
    const defaultEnd = DateUtils.endOf("month");

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const queryStart = startDateParam ? parseInt(startDateParam, 10) : defaultStart;
    const queryEnd = endDateParam ? parseInt(endDateParam, 10) : defaultEnd;

    useEffect(() => {
        if (!startDateParam || !endDateParam) {
            const params = new URLSearchParams(searchParams);
            params.set("startDate", queryStart.toString());
            params.set("endDate", queryEnd.toString());
            setSearchParams(params, { replace: true });
        }
    }, [
        startDateParam,
        endDateParam,
        searchParams,
        setSearchParams,
        queryEnd.toString,
        queryStart.toString,
    ]);

    const { sessionTrends, isLoadingSessions, attendanceTrends, isLoadingAttendance } =
        useAnalytics(activeOrganization?.id, queryStart, queryEnd);

    const handleRangeChange = (dates: any) => {
        const params = new URLSearchParams(searchParams);
        if (dates?.[0] && dates[1]) {
            params.set("startDate", DateUtils.startOf("day", dates[0]).toString());
            params.set("endDate", DateUtils.endOf("day", dates[1]).toString());
        } else {
            params.delete("startDate");
            params.delete("endDate");
        }
        setSearchParams(params, { replace: true });
    };

    return (
        <div>
            <div
                className="flex justify-between items-end flex-wrap gap-4"
                style={{ marginBottom: 32 }}
            >
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Analytics
                    </Title>
                    <Text type="secondary">Historical performance and engagement trends</Text>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <Select
                        value={
                            queryStart === DateUtils.startOf("month") &&
                            queryEnd === DateUtils.endOf("month")
                                ? "This Month"
                                : queryStart === DateUtils.offsetStartOf(-1, "month", "month") &&
                                    queryEnd === DateUtils.offsetEndOf(-1, "month", "month")
                                  ? "Last Month"
                                  : queryStart === DateUtils.startOf("year") &&
                                      queryEnd === DateUtils.endOf("year")
                                    ? "This Year"
                                    : queryStart === DateUtils.offsetStartOf(-1, "year", "year") &&
                                        queryEnd === DateUtils.offsetEndOf(-1, "year", "year")
                                      ? "Last Year"
                                      : queryStart === DateUtils.offsetStartOf(1, "year", "year") &&
                                          queryEnd === DateUtils.offsetEndOf(1, "year", "year")
                                        ? "Next Year"
                                        : null
                        }
                        placeholder="Custom Range"
                        onChange={(val) => {
                            if (val === "This Month")
                                handleRangeChange([
                                    DateUtils.toLibDate(DateUtils.startOf("month")),
                                    DateUtils.toLibDate(DateUtils.endOf("month")),
                                ]);
                            else if (val === "Last Month")
                                handleRangeChange([
                                    DateUtils.toLibDate(
                                        DateUtils.offsetStartOf(-1, "month", "month")
                                    ),
                                    DateUtils.toLibDate(
                                        DateUtils.offsetEndOf(-1, "month", "month")
                                    ),
                                ]);
                            else if (val === "This Year")
                                handleRangeChange([
                                    DateUtils.toLibDate(DateUtils.startOf("year")),
                                    DateUtils.toLibDate(DateUtils.endOf("year")),
                                ]);
                            else if (val === "Last Year")
                                handleRangeChange([
                                    DateUtils.toLibDate(
                                        DateUtils.offsetStartOf(-1, "year", "year")
                                    ),
                                    DateUtils.toLibDate(DateUtils.offsetEndOf(-1, "year", "year")),
                                ]);
                            else if (val === "Next Year")
                                handleRangeChange([
                                    DateUtils.toLibDate(DateUtils.offsetStartOf(1, "year", "year")),
                                    DateUtils.toLibDate(DateUtils.offsetEndOf(1, "year", "year")),
                                ]);
                        }}
                        style={{ minWidth: 130 }}
                        options={[
                            { label: "This Month", value: "This Month" },
                            { label: "Last Month", value: "Last Month" },
                            { label: "This Year", value: "This Year" },
                            { label: "Last Year", value: "Last Year" },
                            { label: "Next Year", value: "Next Year" },
                        ]}
                    />
                    <RangePicker
                        onChange={handleRangeChange}
                        value={
                            [
                                queryStart ? DateUtils.toLibDate(queryStart) : null,
                                queryEnd ? DateUtils.toLibDate(queryEnd) : null,
                            ] as any
                        }
                        allowClear={false}
                    />
                </div>
            </div>

            <div className="mb-6">
                <AnalyticsMetricCards queryStart={queryStart} queryEnd={queryEnd} />
            </div>

            <Row gutter={[24, 24]}>
                <Col span={24} lg={12}>
                    <SessionVolumeChart data={sessionTrends} isLoading={isLoadingSessions} />
                </Col>
                <Col span={24} lg={12}>
                    <AttendanceTrendChart data={attendanceTrends} isLoading={isLoadingAttendance} />
                </Col>
            </Row>
        </div>
    );
};
