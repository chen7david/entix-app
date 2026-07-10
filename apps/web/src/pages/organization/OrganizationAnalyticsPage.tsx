import { FilterBar, type FilterConfig } from "@web/src/components/data/FilterBar";
import {
    type DatePresetOption,
    getRangeFromPreset,
    toIsoRange,
} from "@web/src/components/data/filter-bar/datePresetAdapter";
import { useDatePresetFilterState } from "@web/src/components/data/filter-bar/useDatePresetFilter";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import {
    AnalyticsMetricCards,
    AttendanceTrendChart,
    SessionVolumeChart,
    useAnalytics,
} from "@web/src/features/analytics";
import { useOrganization } from "@web/src/features/organization";
import { DateUtils } from "@web/src/utils/date";
import { Col, Row } from "antd";
import { useEffect } from "react";
import { useSearchParams } from "react-router";

const CUSTOM_RANGE_PRESET = "__custom";

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
    }, [startDateParam, endDateParam, searchParams, setSearchParams, queryEnd, queryStart]);

    const { sessionTrends, isLoadingSessions, attendanceTrends, isLoadingAttendance } =
        useAnalytics(activeOrganization?.id, queryStart, queryEnd);

    const handleRangeChange = (dates: any) => {
        const nextStart = dates?.[0] ? DateUtils.startOf("day", dates[0]).toString() : null;
        const nextEnd = dates?.[1] ? DateUtils.endOf("day", dates[1]).toString() : null;
        if (nextStart === startDateParam && nextEnd === endDateParam) return;

        const params = new URLSearchParams(searchParams);
        if (dates?.[0] && dates[1]) {
            params.set("startDate", nextStart as string);
            params.set("endDate", nextEnd as string);
        } else {
            params.delete("startDate");
            params.delete("endDate");
        }
        setSearchParams(params, { replace: true });
    };

    const presetOptions: DatePresetOption[] = [
        {
            label: "This Month",
            start: DateUtils.startOf("month"),
            end: DateUtils.endOf("month"),
        },
        {
            label: "Last Month",
            start: DateUtils.offsetStartOf(-1, "month", "month"),
            end: DateUtils.offsetEndOf(-1, "month", "month"),
        },
        {
            label: "This Year",
            start: DateUtils.startOf("year"),
            end: DateUtils.endOf("year"),
        },
        {
            label: "Last Year",
            start: DateUtils.offsetStartOf(-1, "year", "year"),
            end: DateUtils.offsetEndOf(-1, "year", "year"),
        },
        {
            label: "Next Year",
            start: DateUtils.offsetStartOf(1, "year", "year"),
            end: DateUtils.offsetEndOf(1, "year", "year"),
        },
    ];

    const { selectedPreset, setSelectedPreset, isoRange } = useDatePresetFilterState({
        presetOptions,
        startDate: queryStart,
        endDate: queryEnd,
        customPresetValue: CUSTOM_RANGE_PRESET,
    });

    const filterConfigs: FilterConfig[] = [
        {
            type: "select",
            key: "preset",
            placeholder: "Custom Range",
            minWidth: 130,
            options: [
                ...presetOptions.map((preset) => ({ label: preset.label, value: preset.label })),
                { label: "Custom Range", value: CUSTOM_RANGE_PRESET },
            ],
            allowClear: false,
        },
        {
            type: "dateRange",
            key: "dateRange",
            keys: ["startDate", "endDate"],
            minWidth: 280,
            visibleWhen: (values) => values.preset === CUSTOM_RANGE_PRESET,
        },
    ];

    const defaultIsoRange = toIsoRange(defaultStart, defaultEnd);

    const filterValues = {
        preset: selectedPreset ?? CUSTOM_RANGE_PRESET,
        startDate: isoRange.startDate,
        endDate: isoRange.endDate,
    };

    const defaultFilterValues = {
        preset: "This Month",
        startDate: defaultIsoRange.startDate,
        endDate: defaultIsoRange.endDate,
    };

    const handleFilterChange = (next: Record<string, any>) => {
        const preset = next.preset as string | null;
        const presetRange = getRangeFromPreset(presetOptions, preset);

        if (preset !== filterValues.preset) {
            setSelectedPreset(preset);
        }

        if (presetRange && preset !== filterValues.preset) {
            handleRangeChange([
                DateUtils.toLibDate(presetRange.start),
                DateUtils.toLibDate(presetRange.end),
            ]);
            return;
        }

        if (next.startDate && next.endDate) {
            if (next.startDate !== isoRange.startDate || next.endDate !== isoRange.endDate) {
                handleRangeChange([
                    DateUtils.toLibDate(new Date(next.startDate)),
                    DateUtils.toLibDate(new Date(next.endDate)),
                ]);
            }
        }
    };

    return (
        <div>
            <PageHeader title="Analytics" subtitle="Historical performance and engagement trends" />

            <div className="mb-6">
                <AnalyticsMetricCards queryStart={queryStart} queryEnd={queryEnd} />
            </div>
            <FilterBar
                filters={filterConfigs}
                values={filterValues}
                initialValues={defaultFilterValues}
                onChange={handleFilterChange}
                onReset={() =>
                    handleRangeChange([
                        DateUtils.toLibDate(defaultStart),
                        DateUtils.toLibDate(defaultEnd),
                    ])
                }
                showReset
            />

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
