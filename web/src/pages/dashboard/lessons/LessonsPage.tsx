import { Typography } from "antd";
import type React from "react";

const { Title, Paragraph } = Typography;

export const LessonsPage: React.FC = () => {
    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <Title level={2} style={{ margin: 0 }}>
                    Lessons
                </Title>
                <Paragraph type="secondary">
                    Access and manage your course materials and lessons.
                </Paragraph>
            </div>
        </div>
    );
};
