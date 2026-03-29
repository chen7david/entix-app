import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { Typography } from "antd";
import type React from "react";

const { Title } = Typography;

export const LessonsPage: React.FC = () => {
    return (
        <>
            <Toolbar />
            <div className="p-6">
                <Title level={2}>Lessons</Title>
                <p>Welcome to the Lessons page.</p>
            </div>
        </>
    );
};
