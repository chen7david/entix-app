import { Button, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <Title level={1} className="mb-4">
        Welcome to Entix
      </Title>
      <Paragraph className="text-lg text-gray-600 mb-6">Where learning fosters clarity and happiness.</Paragraph>

      <div className="flex justify-center gap-4 flex-wrap">
        <Link to="/auth/login">
          <Button size="large">Login</Button>
        </Link>
        <Link to="/auth/signup">
          <Button type="primary" size="large">
            Signup
          </Button>
        </Link>
      </div>
    </div>
  );
};
