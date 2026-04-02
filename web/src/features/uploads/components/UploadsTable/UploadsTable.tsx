import {
    DeleteOutlined,
    FileOutlined,
    PictureOutlined,
    PlaySquareOutlined,
} from "@ant-design/icons";
import { getAssetUrl, type UploadDto } from "@shared";
import { Button, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type React from "react";

type Props = {
    uploads: UploadDto[];
    onDelete: (id: string) => void;
    isDeleting: (id: string) => boolean;
};

export const UploadsTable: React.FC<Props> = ({ uploads, onDelete, isDeleting }) => {
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    };

    const getFileIcon = (contentType: string) => {
        if (contentType.startsWith("image/")) return <PictureOutlined className="text-blue-500" />;
        if (contentType.startsWith("video/"))
            return <PlaySquareOutlined className="text-purple-500" />;
        return <FileOutlined className="text-gray-500" />;
    };

    const columns: ColumnsType<UploadDto> = [
        {
            title: "File Name",
            dataIndex: "originalName",
            key: "originalName",
            width: 300,
            ellipsis: true,
            render: (name: string, record: UploadDto) => (
                <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(record.contentType)}
                    <Tooltip title={name} placement="topLeft" mouseEnterDelay={0.5}>
                        <a
                            href={getAssetUrl(record.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium truncate block"
                        >
                            {name}
                        </a>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: "Size",
            dataIndex: "fileSize",
            key: "fileSize",
            width: 120,
            align: "right",
            render: (size: number) => formatBytes(size),
        },
        {
            title: "Type",
            dataIndex: "contentType",
            key: "contentType",
            width: 120,
            render: (type: string) => <Tag>{type.split("/")[1] || type}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 130,
            render: (status: string) => (
                <Tag
                    color={
                        status === "completed"
                            ? "success"
                            : status === "failed"
                              ? "error"
                              : "processing"
                    }
                >
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: "Uploaded At",
            dataIndex: "createdAt",
            key: "createdAt",
            width: 180,
            render: (date: number) => new Date(date).toLocaleString(),
        },
        {
            title: "Actions",
            key: "actions",
            width: 70,
            fixed: "right",
            align: "center",
            render: (_: unknown, record: UploadDto) => (
                <Tooltip title="Delete File">
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onDelete(record.id)}
                        loading={isDeleting(record.id)}
                    />
                </Tooltip>
            ),
        },
    ];

    return (
        <Table
            dataSource={uploads}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 12 }}
            scroll={{ x: "max-content" }}
            tableLayout="fixed"
            size="middle"
        />
    );
};
