import { useState } from 'react'
import { userSchema } from '@shared/index'
import type { UserDTO } from "@shared/index";
import { createSchemaFieldRule } from 'antd-zod';
import { Button, Form, Input } from 'antd'

function App() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const rule = createSchemaFieldRule(userSchema);

  const onFinish = (values: UserDTO) => {
    console.log(values);
    setUser(values);
  };

  return (
    <>
      {user && <p>{user.name}</p>}
      <Form onFinish={onFinish}>
        <Form.Item label="User name" name="name" rules={[rule]}>
          <Input />
        </Form.Item>
        <Form.Item label="User email" name="email" rules={[rule]}>
          <Input />
        </Form.Item>
        <Button htmlType="submit">Submit</Button>
      </Form>
    </>
  )
}

export default App
