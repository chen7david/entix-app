import { Card, Typography, Select, Popconfirm, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface MemberRolesFormProps {
    member: any;
    currentUserId: string;
    canUpdateMember: boolean;
    canDeleteMember: boolean;
    handleRoleChange: (memberId: string, newRoles: string[]) => Promise<void>;
    handleRemoveMember: (memberId: string) => Promise<void>;
    onRemoveSuccess?: () => void;
}

export const MemberRolesForm = ({
    member,
    currentUserId,
    canUpdateMember,
    canDeleteMember,
    handleRoleChange,
    handleRemoveMember,
    onRemoveSuccess
}: MemberRolesFormProps) => {
    const isSelf = member.userId === currentUserId;
    const canEdit = canUpdateMember && !isSelf;
    const memberRoles = (String(member.role || "")).split(",").map(r => r.trim()).filter(Boolean);

    return (
        <div className="flex flex-col gap-4 pt-2">
            <Card size="small" title="Role Management" className="shadow-sm border-gray-200 dark:border-gray-800">
                {canEdit ? (
                    <div className="flex flex-col gap-2">
                        <Text type="secondary">Assign roles for this organization</Text>
                        <Select
                            mode="multiple"
                            value={memberRoles}
                            style={{ width: '100%' }}
                            placeholder="Select roles"
                            onChange={(values) => handleRoleChange(member.id as string, values)}
                            options={[
                                { value: 'member', label: 'Member' },
                                { value: 'admin', label: 'Admin' },
                                { value: 'owner', label: 'Owner' },
                            ]}
                        />
                    </div>
                ) : (
                    <Text type="secondary">{isSelf ? "You cannot change your own role." : "You do not have permission to change this member's roles."}</Text>
                )}
            </Card>

            {canDeleteMember && !isSelf && (
                <Card size="small" title="Danger Zone" className="border-red-200 dark:border-red-900 shadow-sm">
                    <Text type="secondary" className="block mb-3">
                        Remove this member from the organization entirely.
                    </Text>
                    <Popconfirm
                        title="Remove Member"
                        description="Are you sure you want to remove this user from the organization? This action cannot be undone."
                        onConfirm={() => handleRemoveMember(member.id as string).then(() => onRemoveSuccess?.())}
                        okText="Yes"
                        cancelText="No"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger icon={<DeleteOutlined />} block>
                            Remove Member
                        </Button>
                    </Popconfirm>
                </Card>
            )}
        </div>
    );
};
