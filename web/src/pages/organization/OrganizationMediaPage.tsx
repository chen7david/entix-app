import { Typography } from "antd";
import type React from "react";
import { MediaLibraryTable } from "./components/MediaLibraryTable";

const { Title, Text } = Typography;

export const OrganizationMediaPage: React.FC = () => {
    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>
                        Media Library
                    </Title>
                    <Text type="secondary">
                        Upload and manage your organization's video and audio assets.
                    </Text>
                </div>
            </div>

            <MediaLibraryTable />
        </div>
    );
};
