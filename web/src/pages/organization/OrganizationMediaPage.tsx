import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { Typography } from "antd";
import type React from "react";
import { MediaLibraryTable } from "./components/MediaLibraryTable";

const { Title, Text } = Typography;

export const OrganizationMediaPage: React.FC = () => {
    return (
        <>
            <Toolbar />
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="!mb-1">
                            Media Library
                        </Title>
                        <Text type="secondary">
                            Upload and manage your organization's video and audio assets.
                        </Text>
                    </div>
                </div>

                <MediaLibraryTable />
            </div>
        </>
    );
};
