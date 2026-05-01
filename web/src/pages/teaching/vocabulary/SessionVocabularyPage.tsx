import { ArrowLeftOutlined, QuestionCircleOutlined, UserOutlined } from "@ant-design/icons";
import type { WalletSummaryDTO } from "@shared";
import { FINANCIAL_CATEGORIES, FINANCIAL_CURRENCIES, getAvatarUrl } from "@shared";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@web/src/components/layout/PageHeader";
import { useOrgContext } from "@web/src/context/OrgContext";
import { useAuth } from "@web/src/features/auth";
import { useSessionById } from "@web/src/features/schedule";
import { AddVocabularyForm, useVocabulary, VocabularyTable } from "@web/src/features/vocabulary";
import {
    CENTS_PER_POINT,
    clearSessionPointsDraftAllScopes,
    loadSessionPointsDraftMigrating,
    POINTS_DRAFT_STEP,
    saveSessionPointsDraft,
} from "@web/src/features/vocabulary/utils/sessionPointsDraft";
import { countUniqueVocabularyWords } from "@web/src/features/vocabulary/utils/sessionVocabularyDisplay";
import { useWalletBalance } from "@web/src/features/wallet/hooks/useWalletBalance";
import { useWalletTransfer } from "@web/src/features/wallet/hooks/useWalletTransfer";
import { getApiClient } from "@web/src/lib/api-client";
import { hcJson } from "@web/src/lib/hc-json";
import { App, Avatar, Button, Card, Result, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

const { Text, Title } = Typography;

type StudentRow = {
    attendanceId: string;
    userId: string;
    name: string;
    email: string;
    image: string | null;
    walletAccountId: string | null;
    currentPoints: number;
    stagedDelta: number;
};

export function SessionVocabularyPage() {
    const { activeOrganization } = useOrgContext();
    const { notification } = App.useApp();
    const { isAdminOrOwner } = useAuth();
    const navigate = useNavigate();
    const { slug, sessionId } = useParams<{ slug: string; sessionId: string }>();
    const organizationId = activeOrganization?.id;
    const queryClient = useQueryClient();

    const sessionQuery = useSessionById(organizationId, sessionId);
    const { items, isLoading, error, createVocabularyMutation } = useVocabulary(
        organizationId,
        sessionId
    );
    const orgWalletQuery = useWalletBalance(organizationId, "org");

    const studentWalletQueries = useQueries({
        queries: (sessionQuery.data?.attendances ?? []).map((attendance) => ({
            queryKey: ["walletBalance", organizationId, attendance.userId, "user"],
            queryFn: async () => {
                if (!organizationId) return null;
                const api = getApiClient();
                const res = await api.api.v1.orgs[":organizationId"].members[
                    ":userId"
                ].wallet.summary.$get({
                    param: { organizationId, userId: attendance.userId },
                });
                return hcJson<{
                    data: {
                        accounts: Array<{
                            id: string;
                            currencyId: string;
                            balanceCents: number;
                            accountType: string;
                        }>;
                    };
                }>(res);
            },
            enabled: !!organizationId,
        })),
    });
    const transferPoints = useWalletTransfer(organizationId);
    const savePointsInFlightRef = useRef(false);
    const [stagedDeltas, setStagedDeltas] = useState<Record<string, number>>({});
    /** Prefer org id when present so scope matches hydration ref (slug-only fallback avoids slug↔uuid key flips that reload drafts and wipe per-row +1). */
    const draftScopeKey = organizationId ?? slug ?? null;
    const sessionDraftKey = draftScopeKey && sessionId ? `${draftScopeKey}:${sessionId}` : null;
    /** Only re-load from localStorage when org/session identity changes (not on every render). */
    const hydratedDraftKeyRef = useRef<string | null>(null);

    useLayoutEffect(() => {
        return () => {
            hydratedDraftKeyRef.current = null;
        };
    }, []);

    /** Single layout effect: hydrate before any save so we never persist `{}` over an existing draft. */
    useLayoutEffect(() => {
        if (!sessionDraftKey || !draftScopeKey || !sessionId) return;

        if (hydratedDraftKeyRef.current !== sessionDraftKey) {
            hydratedDraftKeyRef.current = sessionDraftKey;
            setStagedDeltas(
                loadSessionPointsDraftMigrating(
                    window.localStorage,
                    slug,
                    organizationId,
                    sessionId
                )
            );
            return;
        }

        saveSessionPointsDraft(window.localStorage, draftScopeKey, sessionId, stagedDeltas);
    }, [sessionDraftKey, draftScopeKey, sessionId, stagedDeltas, slug, organizationId]);

    const orgFundingAccountId = useMemo(() => {
        return (
            orgWalletQuery.data?.accounts.find(
                (account) =>
                    account.currencyId === FINANCIAL_CURRENCIES.ETD &&
                    account.accountType === "funding"
            )?.id ?? null
        );
    }, [orgWalletQuery.data]);

    const studentRows = useMemo<StudentRow[]>(() => {
        const attendances = sessionQuery.data?.attendances ?? [];
        return attendances.map((attendance, index) => {
            const walletAccounts = studentWalletQueries[index]?.data?.data.accounts ?? [];
            const etdAccount =
                walletAccounts.find((account) => account.currencyId === FINANCIAL_CURRENCIES.ETD) ??
                null;
            const stagedDelta = stagedDeltas[attendance.userId] ?? 0;
            return {
                attendanceId: `${attendance.sessionId}:${attendance.userId}`,
                userId: attendance.userId,
                name: attendance.user?.name ?? attendance.user?.email ?? attendance.userId,
                email: attendance.user?.email ?? "No email",
                image: attendance.user?.image ?? null,
                walletAccountId: etdAccount?.id ?? null,
                currentPoints: (etdAccount?.balanceCents ?? 0) / CENTS_PER_POINT,
                stagedDelta,
            };
        });
    }, [sessionQuery.data?.attendances, stagedDeltas, studentWalletQueries]);

    const nonZeroRows = studentRows.filter((row) => row.stagedDelta !== 0);
    const totalDelta = nonZeroRows.reduce((sum, row) => sum + row.stagedDelta, 0);

    const uniqueWordCount = useMemo(() => countUniqueVocabularyWords(items), [items]);

    const attendeeUserIds = useMemo(
        () => sessionQuery.data?.attendances?.map((a) => a.userId) ?? [],
        [sessionQuery.data?.attendances]
    );

    /** Add pending points for every enrolled student (batch staged deltas). */
    const addPendingToEveryone = useCallback(
        (increment: number) => {
            if (increment === 0 || attendeeUserIds.length === 0) return;
            setStagedDeltas((prev) => {
                const next = { ...prev };
                for (const userId of attendeeUserIds) {
                    next[userId] = (next[userId] ?? 0) + increment;
                }
                return next;
            });
        },
        [attendeeUserIds]
    );

    const pointsStepHint = `Each + or − changes a student’s balance by ${POINTS_DRAFT_STEP} point${POINTS_DRAFT_STEP === 1 ? "" : "s"} until you click Save points.`;

    const flushPendingStaging = useCallback(() => {
        /** Same preference as `draftScopeKey` so LS clear/write matches the layout persist path. */
        const scope = organizationId ?? slug;
        if (!scope || !sessionId) return;
        clearSessionPointsDraftAllScopes(window.localStorage, slug, organizationId, sessionId);
        saveSessionPointsDraft(window.localStorage, scope, sessionId, {});
        setStagedDeltas({});
    }, [slug, organizationId, sessionId]);

    const studentColumns: ColumnsType<StudentRow> = [
        {
            title: "Student",
            key: "student",
            render: (_, row) => (
                <Space align="start" size={12}>
                    <Avatar
                        size={40}
                        src={row.image ? getAvatarUrl(row.image, "sm") : undefined}
                        icon={!row.image && <UserOutlined />}
                    />
                    <div>
                        <Text strong>{row.name}</Text>
                        <div>
                            <Text type="secondary">{row.email}</Text>
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: (
                <Space size={4}>
                    <span>Current Points</span>
                    <Tooltip title={pointsStepHint}>
                        <QuestionCircleOutlined className="text-[var(--ant-color-text-tertiary)] cursor-help" />
                    </Tooltip>
                </Space>
            ),
            key: "currentPoints",
            render: (_, row) => (
                <Tooltip title="ETD wallet balance for this student in this org.">
                    <Text>{row.currentPoints.toFixed(2)}</Text>
                </Tooltip>
            ),
        },
        {
            title: "Pending",
            key: "pending",
            render: (_, row) => (
                <Tag
                    color={
                        row.stagedDelta === 0 ? "default" : row.stagedDelta > 0 ? "green" : "red"
                    }
                >
                    {row.stagedDelta > 0 ? `+${row.stagedDelta}` : row.stagedDelta}
                </Tag>
            ),
        },
        {
            title: "Preview",
            key: "preview",
            render: (_, row) => (
                <Text strong>{(row.currentPoints + row.stagedDelta).toFixed(2)}</Text>
            ),
        },
        {
            title: (
                <Space size={4}>
                    <span>Adjust</span>
                    <Tooltip title={pointsStepHint}>
                        <QuestionCircleOutlined className="text-[var(--ant-color-text-tertiary)] cursor-help" />
                    </Tooltip>
                </Space>
            ),
            key: "adjust",
            align: "right",
            render: (_, row) => (
                <Space>
                    <Tooltip title={`Remove ${POINTS_DRAFT_STEP} point(s) from pending`}>
                        <Button
                            onClick={() =>
                                setStagedDeltas((prev) => ({
                                    ...prev,
                                    [row.userId]: (prev[row.userId] ?? 0) - POINTS_DRAFT_STEP,
                                }))
                            }
                        >
                            -
                        </Button>
                    </Tooltip>
                    <Tooltip title={`Add ${POINTS_DRAFT_STEP} point(s) to pending`}>
                        <Button
                            onClick={() =>
                                setStagedDeltas((prev) => ({
                                    ...prev,
                                    [row.userId]: (prev[row.userId] ?? 0) + POINTS_DRAFT_STEP,
                                }))
                            }
                        >
                            +
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const handleSavePoints = async () => {
        if (!organizationId || !sessionId) return;
        if (!orgFundingAccountId) {
            notification.error({
                message: "Funding account required",
                description: "Organization funding account (ETD) is missing.",
            });
            return;
        }
        if (nonZeroRows.length === 0) {
            notification.info({ message: "No pending point changes to save." });
            return;
        }

        if (savePointsInFlightRef.current || transferPoints.isPending) {
            return;
        }
        savePointsInFlightRef.current = true;

        try {
            /** Fresh each Save click so repeating the same pending delta later is allowed; still dedupes retries of this batch (same key + body). */
            const saveBatchId = crypto.randomUUID();
            const failures: string[] = [];
            const succeededRows: StudentRow[] = [];

            for (const row of nonZeroRows) {
                if (!row.walletAccountId) {
                    failures.push(`${row.name}: no ETD wallet`);
                    continue;
                }
                const amountCents = Math.abs(row.stagedDelta) * CENTS_PER_POINT;
                const idempotencyKey = `session-points:${organizationId}:${sessionId}:${saveBatchId}:${row.userId}`;
                const categoryId =
                    row.stagedDelta > 0
                        ? FINANCIAL_CATEGORIES.CASH_DEPOSIT
                        : FINANCIAL_CATEGORIES.SERVICE_FEE;
                const description = `Session ${sessionQuery.data?.title ?? sessionId} points adjustment`;

                try {
                    const creditStudent = row.stagedDelta > 0;
                    await transferPoints.mutateAsync({
                        categoryId,
                        sourceAccountId: creditStudent ? orgFundingAccountId : row.walletAccountId,
                        destinationAccountId: creditStudent
                            ? row.walletAccountId
                            : orgFundingAccountId,
                        currencyId: FINANCIAL_CURRENCIES.ETD,
                        amountCents,
                        description,
                        idempotencyKey,
                    });
                    succeededRows.push(row);
                } catch (error) {
                    const message =
                        error instanceof Error && error.message
                            ? error.message
                            : "transaction failed";
                    failures.push(`${row.name}: ${message}`);
                }
            }

            if (succeededRows.length === 0) {
                notification.error({
                    message: "Point changes failed",
                    description: failures.join("; "),
                });
                return;
            }

            const succeededDeltaSum = succeededRows.reduce((sum, row) => sum + row.stagedDelta, 0);

            /** Clear pending before wallet cache updates so no intermediate render keeps old staged values in the Pending column. */
            if (failures.length === 0) {
                flushPendingStaging();
            } else {
                setStagedDeltas((prev) => {
                    const next = { ...prev };
                    for (const row of succeededRows) {
                        delete next[row.userId];
                    }
                    return next;
                });
            }

            for (const row of succeededRows) {
                queryClient.setQueryData<
                    | {
                          data: {
                              accounts: Array<{
                                  id: string;
                                  currencyId: string;
                                  balanceCents: number;
                                  accountType: string;
                              }>;
                          };
                      }
                    | undefined
                >(["walletBalance", organizationId, row.userId, "user"], (current) => {
                    if (!current) return current;
                    return {
                        data: {
                            ...current.data,
                            accounts: current.data.accounts.map((account) =>
                                account.currencyId === FINANCIAL_CURRENCIES.ETD
                                    ? {
                                          ...account,
                                          balanceCents:
                                              account.balanceCents +
                                              row.stagedDelta * CENTS_PER_POINT,
                                      }
                                    : account
                            ),
                        },
                    };
                });
            }

            queryClient.setQueryData<WalletSummaryDTO | undefined>(
                ["walletBalance", organizationId, "org", undefined],
                (current) => {
                    if (!current) return current;
                    return {
                        ...current,
                        accounts: current.accounts.map((account) => {
                            if (
                                account.currencyId !== FINANCIAL_CURRENCIES.ETD ||
                                account.accountType !== "funding"
                            ) {
                                return account;
                            }
                            return {
                                ...account,
                                balanceCents:
                                    account.balanceCents - succeededDeltaSum * CENTS_PER_POINT,
                            };
                        }),
                    };
                }
            );

            queryClient.invalidateQueries({ queryKey: ["walletBalance", organizationId] });

            if (failures.length === 0) {
                notification.success({
                    message: "Points saved",
                    description: `Saved ${succeededRows.length} student transactions. Pending adjustments cleared.`,
                });
            } else {
                notification.warning({
                    message: "Some point changes failed",
                    description: `${failures.join("; ")} — Saved ${succeededRows.length} student(s); pending cleared only for those.`,
                });
            }
        } finally {
            savePointsInFlightRef.current = false;
        }
    };

    if (!organizationId || !sessionId) {
        return (
            <Result
                status="warning"
                title="Missing context"
                subTitle="Organization or session was not found in route context."
            />
        );
    }

    if (error) {
        return (
            <Result
                status="error"
                title="Vocabulary unavailable"
                subTitle="Failed to load session vocabulary."
            />
        );
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <PageHeader
                title="Session Vocabulary"
                subtitle="Create vocabulary and track assignments for this session."
                actions={
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => {
                            if (!slug) return;
                            navigate(`/org/${slug}/teaching/sessions`);
                        }}
                    >
                        Back to Schedule
                    </Button>
                }
            />

            <Card size="small">
                <Space direction="vertical" size={8} className="w-full">
                    <Title level={5} style={{ margin: 0 }}>
                        {sessionQuery.data?.title ?? "Session Dashboard"}
                    </Title>
                    <Text type="secondary">
                        Adjust points for students currently enrolled in this class, then click save
                        to create transactions.
                    </Text>
                    <Space wrap className="w-full justify-between items-start">
                        <Space wrap>
                            <Tag color={nonZeroRows.length > 0 ? "processing" : "default"}>
                                {nonZeroRows.length} pending student
                                {nonZeroRows.length === 1 ? "" : "s"}
                            </Tag>
                            <Tag
                                color={
                                    totalDelta === 0 ? "default" : totalDelta > 0 ? "green" : "red"
                                }
                            >
                                Net delta: {totalDelta > 0 ? `+${totalDelta}` : totalDelta}
                            </Tag>
                            <Tooltip title={pointsStepHint}>
                                <span className="inline-flex items-center gap-1 text-[var(--ant-color-text-tertiary)] text-sm cursor-help">
                                    <QuestionCircleOutlined />
                                    <span>Point step</span>
                                </span>
                            </Tooltip>
                        </Space>
                        <Space wrap size="small">
                            {attendeeUserIds.length > 0 && (
                                <>
                                    <Tooltip title="Add +1 pending for every enrolled student">
                                        <Button
                                            type="default"
                                            onClick={() => addPendingToEveryone(1)}
                                            disabled={
                                                studentRows.length === 0 || sessionQuery.isLoading
                                            }
                                        >
                                            +1
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Add +5 pending for every enrolled student">
                                        <Button
                                            type="default"
                                            onClick={() => addPendingToEveryone(5)}
                                            disabled={
                                                studentRows.length === 0 || sessionQuery.isLoading
                                            }
                                        >
                                            +5
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Add +10 pending for every enrolled student">
                                        <Button
                                            type="default"
                                            onClick={() => addPendingToEveryone(10)}
                                            disabled={
                                                studentRows.length === 0 || sessionQuery.isLoading
                                            }
                                        >
                                            +10
                                        </Button>
                                    </Tooltip>
                                </>
                            )}
                            <Button onClick={flushPendingStaging}>Reset</Button>
                            <Button
                                type="primary"
                                onClick={handleSavePoints}
                                disabled={!isAdminOrOwner}
                                loading={transferPoints.isPending}
                            >
                                Save points
                            </Button>
                        </Space>
                    </Space>
                    <Table
                        rowKey="attendanceId"
                        columns={studentColumns}
                        dataSource={studentRows}
                        pagination={false}
                        loading={
                            sessionQuery.isLoading || studentWalletQueries.some((q) => q.isLoading)
                        }
                    />
                </Space>
            </Card>

            <Card size="small">
                <Space direction="vertical" size={12} className="w-full">
                    <Text type="secondary">
                        Words are added once to the org bank and assigned to every student enrolled
                        in this session (each gets their own list entry). The table below shows one
                        row per word with a student count—not duplicate words.
                    </Text>
                    <AddVocabularyForm
                        isSubmitting={createVocabularyMutation.isPending}
                        onSubmit={async (text) => {
                            await createVocabularyMutation.mutateAsync({ text, sessionId });
                        }}
                    />
                </Space>
            </Card>

            <Card size="small" title={`Words for this session (${uniqueWordCount} unique)`}>
                <VocabularyTable items={items} loading={isLoading} groupByWord />
            </Card>
        </div>
    );
}
