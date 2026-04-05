import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button, Dropdown, Space, theme } from "antd";
import type React from "react";
import {
    type ClientPaginationConfig,
    type CursorPaginationConfig,
    isCursorPagination,
} from "./DataTableWithFilters";

interface DataTablePaginationProps {
    pagination: CursorPaginationConfig | ClientPaginationConfig;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({ pagination }) => {
    const { token } = theme.useToken();

    // Standardized page size options
    const pageSizeOptions = [5, 10, 20, 50, 100];

    const isCursor = isCursorPagination(pagination);

    // Derived states
    const hasPrev = isCursor ? pagination.hasPrevPage : (pagination.current || 1) > 1;
    const hasNext = isCursor ? pagination.hasNextPage : false; // For now, non-cursor pagination is purely driven by parent if provided.

    const onNext = () => {
        if (isCursor) {
            pagination.onNext();
        } else {
            pagination.onChange?.((pagination.current || 1) + 1, pagination.pageSize);
        }
    };

    const onPrev = () => {
        if (isCursor) {
            pagination.onPrev();
        } else {
            pagination.onChange?.((pagination.current || 1) - 1, pagination.pageSize);
        }
    };

    const onPageSizeChange = (size: number) => {
        if (isCursor) {
            pagination.onPageSizeChange?.(size);
        } else {
            pagination.onChange?.(1, size); // Reset to page 1 on size change
        }
    };

    const pageSizeItems = pageSizeOptions.map((size) => ({
        key: size.toString(),
        label: size.toString(),
        onClick: () => onPageSizeChange(size),
    }));

    return (
        <div className="flex justify-end w-full px-2">
            <Space size={4} className="items-center">
                <Button
                    disabled={!hasPrev}
                    onClick={onPrev}
                    icon={<LeftOutlined style={{ fontSize: 16 }} />}
                    type="text"
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${hasPrev ? "hover:bg-black/5 dark:hover:bg-white/10" : "pointer-events-none opacity-30"}`}
                    style={{
                        color: hasPrev ? token.colorPrimary : token.colorTextDisabled,
                    }}
                />

                <Dropdown menu={{ items: pageSizeItems }} trigger={["click"]} placement="topCenter">
                    <Button
                        type="text"
                        className="text-sm font-bold px-2 h-9 min-w-[36px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
                        style={{ color: token.colorText }}
                    >
                        {pagination.pageSize}
                    </Button>
                </Dropdown>

                <Button
                    disabled={!hasNext}
                    onClick={onNext}
                    icon={<RightOutlined style={{ fontSize: 16 }} />}
                    type="text"
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${hasNext ? "hover:bg-black/5 dark:hover:bg-white/10" : "pointer-events-none opacity-30"}`}
                    style={{
                        color: hasNext ? token.colorPrimary : token.colorTextDisabled,
                    }}
                />
            </Space>
        </div>
    );
};
