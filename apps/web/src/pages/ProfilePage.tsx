import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-10 px-4">
      <Card className="w-full max-w-2xl shadow-md rounded-2xl p-6">
        <Title level={2}>Your Profile</Title>
        <Paragraph>Welcome to your profile page. This is where your personal info will live.</Paragraph>
        {/* Add actual profile components here */}
      </Card>
    </div>
  );
};
