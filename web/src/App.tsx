import { useEffect, useState } from "react";
import { userSchema } from "@shared/index";
import type { UserDTO } from "@shared/index";
import { createSchemaFieldRule } from "antd-zod";
import { Button, Form, Input, Card, Typography, Space } from "antd";
import axios from "axios";

const { Title, Paragraph } = Typography;

function App() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const rule = createSchemaFieldRule(userSchema);

  const onFinish = (values: UserDTO) => {
    console.log(values);
    setUser(values);
  };

  const getUser = async () => {
    const response = await axios.get<UserDTO[]>("/api/v1/users");
    setUser(response.data[0]);
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        padding: "40px 20px",
      }}
    >
      <Card
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "32px",
          borderRadius: 16,
        }}
      >
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Title level={2} style={{ margin: 0 }}>
              Welcome
            </Title>
            <Paragraph type="secondary">
              Manage your profile using the form below.
            </Paragraph>
          </div>

          {user && (
            <Card
              size="small"
              style={{
                background: "#fafafa",
                borderRadius: 8,
              }}
            >
              <Paragraph style={{ margin: 0 }}>
                <strong>Current user:</strong> {user.name} ({user.email})
              </Paragraph>
            </Card>
          )}

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item label="User name" name="name" rules={[rule]}>
              <Input placeholder="Enter your name" />
            </Form.Item>

            <Form.Item label="User email" name="email" rules={[rule]}>
              <Input placeholder="Enter your email" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block>
              Submit
            </Button>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

export default App;
