import { Toolbar } from "@web/src/components/navigation/Toolbar/Toolbar";
import { Typography } from "antd";
import type React from "react";

const { Title } = Typography;

export const MoviesPage: React.FC = () => {
    return (
        <>
            <Toolbar />
            <div className="p-6">
                <Title level={2}>Movies</Title>
                <p>Welcome to the Movies dashboard module.</p>
            </div>
        </>
    );
};
