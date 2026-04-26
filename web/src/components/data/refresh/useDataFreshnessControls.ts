import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DateUtils } from "@web/src/utils/date";

type FreshnessStatus = "idle" | "fresh" | "aging" | "stale";

type FreshnessInfo = {
    status: FreshnessStatus;
    label: string;
    tooltip: string;
};

const THIRTY_SECONDS_MS = 1000 * 30;
const STALE_THRESHOLD_MS = 1000 * 60;

function formatAgeWithSeconds(ageMs: number): string {
    const totalSeconds = Math.max(0, Math.floor(ageMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes <= 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

export function getFreshnessInfo(
    lastFetchedAt: number | null | undefined,
    nowMs: number = Date.now()
): FreshnessInfo {
    if (!lastFetchedAt) {
        return {
            status: "idle",
            label: "Not fetched yet",
            tooltip: "No successful fetch yet",
        };
    }

    const ageMs = Math.max(0, nowMs - lastFetchedAt);
    const exactIso = new Date(lastFetchedAt).toISOString();
    const exactHuman = DateUtils.format(lastFetchedAt, "YYYY-MM-DD HH:mm:ss Z");

    if (ageMs < THIRTY_SECONDS_MS) {
        return {
            status: "fresh",
            label: `Refreshed ${formatAgeWithSeconds(ageMs)} ago`,
            tooltip: `Fetched at ${exactHuman} (${exactIso})`,
        };
    }

    const status: FreshnessStatus = ageMs <= STALE_THRESHOLD_MS ? "aging" : "stale";
    return {
        status,
        label: `Refreshed ${formatAgeWithSeconds(ageMs)} ago`,
        tooltip: `Fetched at ${exactHuman} (${exactIso})`,
    };
}

type UseDataFreshnessControlsArgs = {
    lastFetchedAt?: number;
    isFetching?: boolean;
    onRefresh: () => unknown | Promise<unknown>;
    manualRefreshCooldownMs?: number;
};

export function useDataFreshnessControls({
    lastFetchedAt,
    isFetching = false,
    onRefresh,
    manualRefreshCooldownMs = 1200,
}: UseDataFreshnessControlsArgs) {
    const [clockNow, setClockNow] = useState<number>(() => Date.now());
    const lastManualRefreshAtRef = useRef<number>(0);

    useEffect(() => {
        const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const freshness = useMemo(
        () => getFreshnessInfo(lastFetchedAt, clockNow),
        [lastFetchedAt, clockNow]
    );

    const refreshNow = useCallback(() => {
        const now = Date.now();
        if (isFetching) return;
        if (now - lastManualRefreshAtRef.current < manualRefreshCooldownMs) return;
        lastManualRefreshAtRef.current = now;
        void onRefresh();
    }, [isFetching, manualRefreshCooldownMs, onRefresh]);

    return {
        isFetching,
        refreshNow,
        freshness,
    };
}
