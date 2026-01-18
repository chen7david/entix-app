import { MembersList } from "@web/src/components/organization/MembersList";
import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";

export const MembersPage = () => {
    return (
        <>
            <Toolbar
                title="Members"
                breadcrumbs={[
                    { title: "Organization" },
                    { title: "Members" }
                ]}
            />
            <div className="p-6">
                <MembersList />
            </div>
        </>
    );
};
