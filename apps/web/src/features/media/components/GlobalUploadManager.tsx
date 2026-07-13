import {
    AudioOutlined,
    CheckCircleOutlined,
    CloseOutlined,
    CloudUploadOutlined,
    ExclamationCircleOutlined,
    FileOutlined,
    LoadingOutlined,
    SyncOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";
import { AppRoutes } from "@shared";
import { useOrgNavigate } from "@web/src/features/organization/hooks/useOrgNavigate";
import { Badge, Button, List, Modal, Progress, Space, Tag, Typography, theme } from "antd";
import { useAtom, useAtomValue } from "jotai";
import type React from "react";
import { useMemo } from "react";
import {
    hasActiveUploadsAtom,
    isUploadModalOpenAtom,
    isUploadWindowVisibleAtom,
    type UploadTask,
    uploadQueueAtom,
} from "../store/upload.store";

const { Text, Title } = Typography;
const { useToken } = theme;

function statusMeta(task: UploadTask) {
    switch (task.status) {
        case "completed":
            return {
                color: "success" as const,
                label: "Complete",
                icon: <CheckCircleOutlined className="text-green-500" />,
            };
        case "error":
            return {
                color: "error" as const,
                label: "Failed",
                icon: <ExclamationCircleOutlined className="text-red-500" />,
            };
        case "processing":
            return {
                color: "processing" as const,
                label: "Processing",
                icon: <SyncOutlined spin className="text-blue-500" />,
            };
        case "uploading":
            return {
                color: "processing" as const,
                label: "Uploading",
                icon: <LoadingOutlined className="text-blue-500" />,
            };
        default:
            return {
                color: "default" as const,
                label: "Queued",
                icon: <LoadingOutlined className="text-gray-400" />,
            };
    }
}

function FileTypeIcon({ type }: { type: UploadTask["type"] }) {
    if (type === "video") return <VideoCameraOutlined className="text-primary" />;
    if (type === "audio") return <AudioOutlined className="text-blue-500" />;
    return <FileOutlined className="text-gray-500" />;
}

export const GlobalUploadManager: React.FC = () => {
    const [queue, setQueue] = useAtom(uploadQueueAtom);
    const [isVisible, setIsVisible] = useAtom(isUploadWindowVisibleAtom);
    const [modalOpen, setModalOpen] = useAtom(isUploadModalOpenAtom);
    const hasActiveUploads = useAtomValue(hasActiveUploadsAtom);
    const { token } = useToken();
    const navigateOrg = useOrgNavigate();

    const activeCount = useMemo(
        () =>
            queue.filter(
                (t) =>
                    t.status === "uploading" || t.status === "pending" || t.status === "processing"
            ).length,
        [queue]
    );
    const errorCount = useMemo(() => queue.filter((t) => t.status === "error").length, [queue]);
    const completedCount = useMemo(
        () => queue.filter((t) => t.status === "completed").length,
        [queue]
    );
    const overallProgress = useMemo(() => {
        if (queue.length === 0) return 0;
        const sum = queue.reduce(
            (acc, t) => acc + (t.status === "completed" ? 100 : t.progress),
            0
        );
        return Math.round(sum / queue.length);
    }, [queue]);

    if (!isVisible && queue.length === 0) return null;

    const handleDismiss = () => {
        if (hasActiveUploads) return;
        setModalOpen(false);
        setIsVisible(false);
        setQueue((q) =>
            q.filter(
                (t) =>
                    t.status === "uploading" || t.status === "pending" || t.status === "processing"
            )
        );
    };

    const handleClearFinished = () => {
        setQueue((q) =>
            q.filter(
                (t) =>
                    t.status === "uploading" || t.status === "pending" || t.status === "processing"
            )
        );
    };

    const cancelTask = (task: UploadTask) => {
        task.xhr?.abort();
        setQueue((q) => q.filter((t) => t.id !== task.id));
    };

    const fabLabel = hasActiveUploads
        ? `${activeCount} uploading`
        : errorCount > 0
          ? `${errorCount} failed`
          : "Uploads complete";

    return (
        <>
            <button
                type="button"
                aria-label="Open upload progress"
                onClick={() => setModalOpen(true)}
                className="fixed bottom-6 right-6 z-[99] flex items-center gap-3 rounded-full border px-4 py-2.5 shadow-lg transition-all hover:shadow-xl focus:outline-none focus-visible:ring-2"
                style={{
                    backgroundColor: token.colorBgElevated,
                    borderColor: token.colorBorderSecondary,
                    color: token.colorText,
                    boxShadow: token.boxShadowSecondary,
                }}
            >
                <Badge
                    count={hasActiveUploads ? activeCount : errorCount > 0 ? errorCount : 0}
                    size="small"
                    offset={[-2, 2]}
                    color={errorCount > 0 && !hasActiveUploads ? token.colorError : undefined}
                >
                    <span
                        className="flex h-9 w-9 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${token.colorPrimary}14` }}
                    >
                        {hasActiveUploads ? (
                            <CloudUploadOutlined
                                style={{ color: token.colorPrimary, fontSize: 18 }}
                            />
                        ) : errorCount > 0 ? (
                            <ExclamationCircleOutlined
                                style={{ color: token.colorError, fontSize: 18 }}
                            />
                        ) : (
                            <CheckCircleOutlined
                                style={{ color: token.colorSuccess, fontSize: 18 }}
                            />
                        )}
                    </span>
                </Badge>
                <div className="flex min-w-[7.5rem] flex-col items-start text-left">
                    <Text strong className="text-sm leading-tight">
                        {fabLabel}
                    </Text>
                    {hasActiveUploads ? (
                        <Progress
                            percent={overallProgress}
                            size="small"
                            showInfo={false}
                            className="mt-1 w-28"
                            strokeColor={token.colorPrimary}
                        />
                    ) : (
                        <Text type="secondary" className="text-xs">
                            View details
                        </Text>
                    )}
                </div>
            </button>

            <Modal
                title={
                    <div className="flex items-center gap-3 pr-8">
                        <CloudUploadOutlined style={{ color: token.colorPrimary }} />
                        <div>
                            <Title level={5} className="!m-0">
                                Upload activity
                            </Title>
                            <Text type="secondary" className="text-xs font-normal">
                                {queue.length} file{queue.length === 1 ? "" : "s"} in this session
                            </Text>
                        </div>
                    </div>
                }
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                width={520}
                destroyOnClose={false}
                footer={
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button
                            type="link"
                            className="!px-0"
                            onClick={() => {
                                setModalOpen(false);
                                navigateOrg(AppRoutes.org.admin.uploads);
                            }}
                        >
                            Open Files & Uploads
                        </Button>
                        <Space>
                            {!hasActiveUploads && queue.length > 0 && (
                                <Button onClick={handleClearFinished}>Clear finished</Button>
                            )}
                            <Button
                                onClick={() => setModalOpen(false)}
                                type={hasActiveUploads ? "primary" : "default"}
                            >
                                {hasActiveUploads ? "Keep uploading" : "Close"}
                            </Button>
                            {!hasActiveUploads && (
                                <Button type="primary" onClick={handleDismiss}>
                                    Dismiss
                                </Button>
                            )}
                        </Space>
                    </div>
                }
            >
                <div className="mb-4 flex flex-wrap gap-2">
                    <Tag color={hasActiveUploads ? "processing" : "default"}>
                        Active {activeCount}
                    </Tag>
                    <Tag color="success">Complete {completedCount}</Tag>
                    <Tag color={errorCount > 0 ? "error" : "default"}>Failed {errorCount}</Tag>
                </div>

                {queue.length === 0 ? (
                    <div className="py-10 text-center">
                        <Text type="secondary">No uploads in the queue</Text>
                    </div>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={queue}
                        renderItem={(task) => {
                            const meta = statusMeta(task);
                            const inFlight =
                                task.status === "uploading" ||
                                task.status === "pending" ||
                                task.status === "processing";
                            return (
                                <List.Item
                                    className="!px-0"
                                    actions={
                                        inFlight
                                            ? [
                                                  <Button
                                                      key="cancel"
                                                      type="text"
                                                      size="small"
                                                      danger
                                                      icon={<CloseOutlined />}
                                                      aria-label={`Cancel ${task.originalName}`}
                                                      onClick={() => cancelTask(task)}
                                                  />,
                                              ]
                                            : undefined
                                    }
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <span
                                                className="flex h-10 w-10 items-center justify-center rounded-lg"
                                                style={{
                                                    backgroundColor: token.colorFillAlter,
                                                    fontSize: 18,
                                                }}
                                            >
                                                <FileTypeIcon type={task.type} />
                                            </span>
                                        }
                                        title={
                                            <div className="flex items-center justify-between gap-2">
                                                <Text
                                                    ellipsis
                                                    className="font-medium"
                                                    title={task.originalName}
                                                >
                                                    {task.originalName}
                                                </Text>
                                                <Tag
                                                    icon={meta.icon}
                                                    color={meta.color}
                                                    className="m-0 shrink-0"
                                                >
                                                    {meta.label}
                                                </Tag>
                                            </div>
                                        }
                                        description={
                                            <div className="mt-1">
                                                {(inFlight || task.status === "error") && (
                                                    <Progress
                                                        percent={Math.floor(task.progress)}
                                                        size="small"
                                                        status={
                                                            task.status === "error"
                                                                ? "exception"
                                                                : task.status === "processing"
                                                                  ? "active"
                                                                  : "normal"
                                                        }
                                                        showInfo={task.status !== "pending"}
                                                    />
                                                )}
                                                {task.status === "error" && task.errorMessage ? (
                                                    <Text type="danger" className="text-xs">
                                                        {task.errorMessage}
                                                    </Text>
                                                ) : null}
                                            </div>
                                        }
                                    />
                                </List.Item>
                            );
                        }}
                    />
                )}
            </Modal>
        </>
    );
};
