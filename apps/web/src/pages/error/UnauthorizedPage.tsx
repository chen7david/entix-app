import { AppRoutes } from "@shared";
import { Button, Result, theme } from "antd";
import type React from "react";
import { useNavigate } from "react-router";

export const UnauthorizedPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();

    return (
        <div
            className="flex items-center justify-center min-h-screen p-4"
            style={{ backgroundColor: token.colorBgLayout }}
        >
            <Result
                status="403"
                title="403"
                subTitle="Sorry, you are not authorized to access this page."
                extra={[
                    <Button
                        type="primary"
                        size="large"
                        key="home"
                        onClick={() => navigate(AppRoutes.onboarding.selectOrganization)}
                    >
                        Switch Organization
                    </Button>,
                    <Button size="large" key="back" onClick={() => navigate(-1)}>
                        Go Back
                    </Button>,
                ]}
            />
        </div>
    );
};
