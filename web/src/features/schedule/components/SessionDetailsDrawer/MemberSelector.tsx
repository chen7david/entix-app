import { getAvatarUrl } from "@shared";
import { Avatar, Form, Select, Space, Tag, Tooltip } from "antd";
import type React from "react";

type MemberSelectorProps = {
    loading: boolean;
    members: any[];
    memberSearch: string;
    onSearch: (val: string) => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    memberCache: Record<string, { name: string; image?: string }>;
};

export const MemberSelector: React.FC<MemberSelectorProps> = ({
    loading,
    members,
    memberSearch,
    onSearch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    memberCache,
}) => {
    return (
        <Form.Item
            name="userIds"
            label="Assign Members"
            rules={[{ required: true, message: "Required" }]}
        >
            <Select
                mode="multiple"
                placeholder="Select teachers or participants"
                loading={loading || isFetchingNextPage}
                options={(members || []).map((m: any) => ({
                    label: m.name || m.email,
                    value: m.userId,
                    image: m.avatarUrl,
                }))}
                showSearch
                filterOption={false}
                onSearch={onSearch}
                onPopupScroll={(e) => {
                    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                    if (
                        scrollHeight - scrollTop <= clientHeight + 10 &&
                        hasNextPage &&
                        !isFetchingNextPage
                    ) {
                        fetchNextPage();
                    }
                }}
                searchValue={memberSearch}
                onSelect={() => onSearch("")}
                onBlur={() => onSearch("")}
                optionRender={(option) => (
                    <Space>
                        <Avatar
                            size="small"
                            src={
                                option.data.image
                                    ? getAvatarUrl(option.data.image, "sm")
                                    : undefined
                            }
                        >
                            {!option.data.image && option.label?.toString().charAt(0).toUpperCase()}
                        </Avatar>
                        {option.label}
                    </Space>
                )}
                tagRender={(props) => {
                    const { label, value, closable, onClose } = props;
                    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
                        event.preventDefault();
                        event.stopPropagation();
                    };

                    const cached = memberCache[value];
                    const displayName = cached?.name || label;
                    const displayImage = cached?.image;

                    return (
                        <Tooltip title={displayName} mouseEnterDelay={0.5}>
                            <Tag
                                color="blue"
                                onMouseDown={onPreventMouseDown}
                                closable={closable}
                                onClose={onClose}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    margin: "2px 4px 2px 0",
                                    maxWidth: 140, // Ensure wrapping doesn't break layout
                                }}
                            >
                                <Avatar
                                    size={16}
                                    src={
                                        displayImage ? getAvatarUrl(displayImage, "sm") : undefined
                                    }
                                    style={{ fontSize: 10, flexShrink: 0 }}
                                >
                                    {!displayImage &&
                                        displayName?.toString().charAt(0).toUpperCase()}
                                </Avatar>
                                <span className="truncate">{displayName}</span>
                            </Tag>
                        </Tooltip>
                    );
                }}
            />
        </Form.Item>
    );
};
