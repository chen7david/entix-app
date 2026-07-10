import { Typography } from "antd";
import type React from "react";

const { Title, Paragraph } = Typography;

export const MoviesPage: React.FC = () => {
    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Movies
                </Title>
                <Paragraph type="secondary">Browse and manage your movie collection.</Paragraph>
            </div>
        </div>
    );
};
