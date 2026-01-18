import { InvitationsTable } from "@web/src/components/organization/InvitationsTable";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { links } from "@web/src/constants/links";

export const InvitationsPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Toolbar
                title="Invitations"
                breadcrumbs={[
                    { title: "Organization" },
                    { title: "Invitations" }
                ]}
                actions={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate(links.dashboard.organization.inviteMember)}
                    >
                        Invite Member
                    </Button>
                }
            />
            <div className="p-6">
                <InvitationsTable />
            </div>
        </>
    );
};
