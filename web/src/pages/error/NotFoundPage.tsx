import { Button, Result, theme } from 'antd';
import { useNavigate } from 'react-router';
import { links } from '@web/src/constants/links';

export const NotFoundPage = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();

    return (
        <div
            className="flex items-center justify-center min-h-screen p-4"
            style={{ backgroundColor: token.colorBgLayout }}
        >
            <Result
                status="404"
                title="404"
                subTitle="Sorry, the page you visited does not exist."
                extra={[
                    <Button
                        size="large"
                        key="back"
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </Button>,
                ]}
            />
        </div>
    );
};
