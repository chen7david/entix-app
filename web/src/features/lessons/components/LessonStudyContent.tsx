import { CheckCircleOutlined, EditOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { getAssetUrl } from "@shared";
import type { CefrLevel } from "@shared/constants/cefr";
import { useQueries } from "@tanstack/react-query";
import {
    useLessonObjectives,
    useLessonPlaylists,
    useLessonVocabulary,
} from "@web/src/features/lessons/hooks/useLessonContent";
import { useLessonById } from "@web/src/features/lessons/hooks/useLessons";
import { usePlaylist } from "@web/src/features/media/hooks/usePlaylists";
import { VocabularyTable } from "@web/src/features/vocabulary/components/VocabularyTable";
import type {
    SessionVocabularyItemDTO,
    VocabularyItemDTO,
} from "@web/src/features/vocabulary/hooks/useVocabulary";
import { dedupeSessionVocabularyByWord } from "@web/src/features/vocabulary/utils/sessionVocabularyDisplay";
import { hcJson } from "@web/src/lib/hc-json";
import { QUERY_STALE_MS } from "@web/src/lib/query-config";
import {
    Button,
    Card,
    Col,
    Empty,
    Row,
    Skeleton,
    Space,
    Tag,
    Tooltip,
    Typography,
    theme,
} from "antd";
import type React from "react";
import { useMemo } from "react";
import { Link } from "react-router";

const { Title, Text, Paragraph } = Typography;

function cefrTagColor(cefrLevel: CefrLevel | null) {
    if (!cefrLevel) return undefined;
    if (cefrLevel === "A1" || cefrLevel === "A2") return "green";
    if (cefrLevel === "B1" || cefrLevel === "B2") return "blue";
    return "purple";
}

function LessonPlaylistStudyCard(props: {
    playlistId: string;
    playHref: string;
}): React.ReactElement {
    const q = usePlaylist(props.playlistId);
    const title = q.data?.title ?? (q.isPending ? "…" : "Playlist");
    const cover = q.data?.coverArtUrl ? getAssetUrl(q.data.coverArtUrl) : null;
    return (
        <Link
            to={props.playHref}
            className="group block rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            style={{ borderColor: "var(--ant-color-border-secondary, #f0f0f0)" }}
        >
            <div className="relative aspect-video bg-slate-200/80 dark:bg-slate-800/80">
                {cover ? (
                    <img
                        src={cover}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-300/40 to-slate-500/30">
                        <PlayCircleOutlined className="text-4xl text-slate-500/80" />
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35">
                    <PlayCircleOutlined className="text-5xl text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-95" />
                </div>
            </div>
            <div className="p-3 bg-[var(--ant-color-bg-container)]">
                <Text strong className="text-base block truncate">
                    {title}
                </Text>
                {q.data?.description ? (
                    <Paragraph type="secondary" className="!mb-0 !mt-1 text-sm line-clamp-2">
                        {q.data.description}
                    </Paragraph>
                ) : null}
            </div>
        </Link>
    );
}

export type LessonStudyEditSection = "objectives" | "vocabulary" | "playlists";

export type LessonStudyContentProps = {
    organizationId: string;
    lessonId: string;
    slug: string;
    /** Base path segment after org slug for playlist player links. */
    playlistArea: "teaching" | "dashboard";
    /** When set, each section shows an edit control (teacher lesson builder). */
    onEditSection?: (section: LessonStudyEditSection) => void;
    /** When set, the lesson card shows an edit control (title, description, cover, CEFR). */
    onEditLesson?: () => void;
};

function cardEditExtra(onClick: (() => void) | undefined, label: string): React.ReactNode {
    if (!onClick) return undefined;
    return (
        <Tooltip title={`Edit ${label}`}>
            <Button
                type="text"
                icon={<EditOutlined />}
                aria-label={`Edit ${label}`}
                onClick={onClick}
            />
        </Tooltip>
    );
}

function sectionEditExtra(
    onEditSection: ((section: LessonStudyEditSection) => void) | undefined,
    section: LessonStudyEditSection,
    label: string
): React.ReactNode {
    return cardEditExtra(onEditSection ? () => onEditSection(section) : undefined, label);
}

export function LessonStudyContent({
    organizationId,
    lessonId,
    slug,
    playlistArea,
    onEditSection,
    onEditLesson,
}: LessonStudyContentProps): React.ReactElement {
    const { token } = theme.useToken();

    const lessonQuery = useLessonById(organizationId, lessonId);
    const objectivesQuery = useLessonObjectives(organizationId, lessonId);
    const playlistsQuery = useLessonPlaylists(organizationId, lessonId);
    const vocabularyQuery = useLessonVocabulary(organizationId, lessonId);

    const lessonVocabularySorted = useMemo(
        () => [...(vocabularyQuery.data ?? [])].sort((a, b) => a.position - b.position),
        [vocabularyQuery.data]
    );

    const vocabularyBankQueries = useQueries({
        queries: lessonVocabularySorted.map((row) => ({
            queryKey: ["vocabulary-bank-item", organizationId, row.vocabularyId] as const,
            queryFn: async () => {
                const res = await fetch(
                    `/api/v1/orgs/${organizationId}/vocabulary/bank/${row.vocabularyId}`,
                    { credentials: "include" }
                );
                const body = await hcJson<{ data: VocabularyItemDTO }>(res);
                return body.data;
            },
            enabled: !!organizationId && !!lessonId,
            staleTime: QUERY_STALE_MS,
        })),
    });

    const vocabBankLoading =
        lessonVocabularySorted.length > 0 && vocabularyBankQueries.some((q) => q.isPending);

    const vocabTableItems = useMemo((): SessionVocabularyItemDTO[] => {
        const out: SessionVocabularyItemDTO[] = [];
        for (let i = 0; i < lessonVocabularySorted.length; i++) {
            const row = lessonVocabularySorted.at(i);
            if (row === undefined) continue;
            const q = vocabularyBankQueries[i];
            const vocab = q?.data;
            if (!vocab) continue;
            out.push({
                id: `lesson-study:${lessonId}:${row.vocabularyId}`,
                userId: "",
                organizationId,
                attendanceId: "",
                createdAt: row.addedAt,
                vocabulary: vocab,
            });
        }
        return out;
    }, [lessonVocabularySorted, vocabularyBankQueries, organizationId, lessonId]);

    const objectivesSorted = useMemo(
        () => [...(objectivesQuery.data ?? [])].sort((a, b) => a.position - b.position),
        [objectivesQuery.data]
    );
    const playlistsSorted = useMemo(
        () => [...(playlistsQuery.data ?? [])].sort((a, b) => a.position - b.position),
        [playlistsQuery.data]
    );

    const playlistPlayerHref = (playlistId: string) =>
        `/org/${slug}/${playlistArea}/playlists/${playlistId}`;

    const lesson = lessonQuery.data;
    const lessonTitle = lesson?.title ?? "Lesson";

    const coverUrl = lesson?.coverArtUrl ? getAssetUrl(lesson.coverArtUrl) : null;
    const bg = token.colorBgContainer;
    const coverRightFade = `linear-gradient(90deg, ${bg}00 0%, ${bg}35 28%, ${bg}A0 58%, ${bg}F5 88%, ${bg} 100%)`;
    const heroEmptyCoverFill = `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorFillAlter} 100%)`;

    return (
        <Space direction="vertical" size="large" className="w-full">
            {lessonQuery.isLoading && !lesson ? (
                <div
                    className="relative rounded-2xl overflow-hidden shadow-md p-6"
                    style={{
                        border: `1px solid ${token.colorBorderSecondary}`,
                        backgroundColor: bg,
                    }}
                >
                    {onEditLesson ? (
                        <div className="absolute top-3 right-3 z-10">
                            {cardEditExtra(onEditLesson, "lesson")}
                        </div>
                    ) : null}
                    <Skeleton active paragraph={{ rows: 4 }} />
                </div>
            ) : (
                <div
                    className="relative flex flex-row rounded-2xl overflow-hidden shadow-md"
                    style={{
                        border: `1px solid ${token.colorBorderSecondary}`,
                        backgroundColor: bg,
                    }}
                >
                    {onEditLesson ? (
                        <div className="absolute top-3 right-3 z-10 md:top-6 md:right-6">
                            {cardEditExtra(onEditLesson, "lesson")}
                        </div>
                    ) : null}
                    <div className="relative aspect-square w-[min(42vw,168px)] shrink-0 sm:w-[min(38vw,200px)] md:w-[240px] lg:w-[280px]">
                        {coverUrl ? (
                            <>
                                <img
                                    src={coverUrl}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                                <div
                                    className="pointer-events-none absolute inset-y-0 right-0 w-[min(52%,112px)] sm:w-[min(48%,100px)] md:w-28"
                                    style={{ background: coverRightFade }}
                                />
                            </>
                        ) : (
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ background: heroEmptyCoverFill }}
                            >
                                <Text type="secondary" style={{ fontSize: token.fontSize }}>
                                    No cover
                                </Text>
                            </div>
                        )}
                    </div>

                    <div className="flex min-h-[168px] min-w-0 flex-1 flex-col justify-center py-5 pl-3 pr-4 sm:min-h-[200px] sm:py-6 sm:pl-4 sm:pr-6 md:min-h-0 md:py-8 md:pl-6 md:pr-10">
                        <Title
                            level={2}
                            className="!mb-0 !mt-0"
                            style={{
                                color: token.colorTextHeading,
                                fontWeight: token.fontWeightStrong,
                                fontSize: token.fontSizeHeading2,
                                lineHeight: token.lineHeightHeading2,
                            }}
                        >
                            {lessonTitle}
                        </Title>
                        <Space wrap className="mb-4 mt-3">
                            {lesson?.cefrLevel != null ? (
                                <Tag color={cefrTagColor(lesson.cefrLevel)}>{lesson.cefrLevel}</Tag>
                            ) : (
                                <Tag>CEFR not set</Tag>
                            )}
                        </Space>
                        {lesson?.description ? (
                            <Paragraph
                                className="!mb-0"
                                style={{
                                    color: token.colorTextSecondary,
                                    fontSize: token.fontSizeLG,
                                    lineHeight: token.lineHeightLG,
                                }}
                            >
                                {lesson.description}
                            </Paragraph>
                        ) : (
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: token.fontSize,
                                    lineHeight: token.lineHeight,
                                }}
                            >
                                No description for this lesson.
                            </Text>
                        )}
                    </div>
                </div>
            )}

            <Card
                title="Learning objectives"
                className="shadow-sm"
                extra={sectionEditExtra(onEditSection, "objectives", "objectives")}
            >
                {objectivesQuery.isLoading ? (
                    <Skeleton active title={false} paragraph={{ rows: 3 }} />
                ) : objectivesSorted.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No objectives listed yet"
                    />
                ) : (
                    <ol className="list-none pl-0 m-0 space-y-3">
                        {objectivesSorted.map((o) => (
                            <li
                                key={o.id}
                                className="flex gap-3 items-start rounded-xl px-4 py-3"
                                style={{ background: token.colorFillAlter }}
                            >
                                <CheckCircleOutlined
                                    className="text-lg mt-0.5 flex-shrink-0"
                                    style={{ color: token.colorSuccess }}
                                />
                                <Text className="text-base">{o.objective}</Text>
                            </li>
                        ))}
                    </ol>
                )}
            </Card>

            <Card
                title="Vocabulary"
                className="shadow-sm"
                extra={sectionEditExtra(onEditSection, "vocabulary", "vocabulary")}
            >
                <Paragraph type="secondary" className="!mt-0 !mb-3">
                    Words for this lesson (tap English or Chinese for audio when available).
                </Paragraph>
                <VocabularyTable
                    items={dedupeSessionVocabularyByWord(vocabTableItems)}
                    loading={vocabularyQuery.isLoading || vocabBankLoading}
                    groupByWord
                    hideStudentCountColumn
                />
            </Card>

            <Card
                title="Playlists"
                className="shadow-sm"
                extra={sectionEditExtra(onEditSection, "playlists", "playlists")}
            >
                <Paragraph type="secondary" className="!mt-0 !mb-4">
                    Tap a cover to open the playlist in the full player.
                </Paragraph>
                {playlistsQuery.isLoading ? (
                    <Skeleton active paragraph={{ rows: 2 }} />
                ) : playlistsSorted.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No playlists linked yet"
                    />
                ) : (
                    <Row gutter={[16, 16]}>
                        {playlistsSorted.map((row) => (
                            <Col xs={24} sm={12} lg={8} key={`${row.lessonId}-${row.playlistId}`}>
                                <LessonPlaylistStudyCard
                                    playlistId={row.playlistId}
                                    playHref={playlistPlayerHref(row.playlistId)}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </Card>
        </Space>
    );
}
