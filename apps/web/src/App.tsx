import { ApiError } from '@repo/api-errors';
import { createUserSchema, type CreateUserParamsDto } from '@repo/entix-sdk';
import { createSchemaFieldRule } from 'antd-zod';
import { Button, Form, Input } from 'antd';

export function App() {
  const error = new ApiError({
    message: 'test',
    cause: new Error('test'),
  });
  console.log(error);

  const rules = createSchemaFieldRule(createUserSchema);

  const onSubmit = (values: CreateUserParamsDto) => {
    console.log(values);
  };

  return (
    <div>
      <h1>Hello Worlds</h1>
      <Form onFinish={onSubmit}>
        <Form.Item name="email" label="Email" rules={[rules]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[rules]}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
}
