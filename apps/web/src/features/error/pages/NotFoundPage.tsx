import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <div className="space-x-4">
            <Button type="primary" onClick={() => navigate('/')}>
              Back Home
            </Button>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        }
      />
    </div>
  );
};
