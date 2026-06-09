import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Result, Typography } from "antd";
import type React from "react";
import { useNavigate } from "react-router";

const { Text } = Typography;

interface ComingSoonPageProps {
    title: string;
    description?: string;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
    title,
    description = "This feature is under active development.",
}) => {
    const navigate = useNavigate();

    return (
        <Result
            icon={<ClockCircleOutlined style={{ color: "#8b5cf6" }} />}
            title={title}
            subTitle={<Text type="secondary">{description}</Text>}
            extra={<Button onClick={() => navigate(-1)}>Go Back</Button>}
        />
    );
};
