import { Form, Input, Button, App } from "antd";
import { Link } from "react-router-dom";
import { createSchemaFieldRule } from "antd-zod";
import { createUserDto, type CreateUserDto } from "@shared/dtos/user.dto";
import { useState } from "react";

const zodRule = createSchemaFieldRule(createUserDto);

export const SignupPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: CreateUserDto) => {
    console.log("Signup submitted:", values);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => null);

      console.log("Signup response:", {
        ok: res.ok,
        status: res.status,
        data,
      });

      if (!res.ok) {
        message.error(data?.message ?? "Signup failed");
        return;
      }

      message.success("Account created!");
      form.resetFields();
    } catch (err: any) {
      console.error("Signup error:", err);
      message.error("Network error — try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-xl mb-8">
        <span className="text-white text-6xl">🦉</span>
      </div>

      <h1 className="text-4xl font-extrabold text-green-700 mb-2">
        Create Account
      </h1>
      <p className="text-gray-600 mb-8 text-center">
        Join Entix and start your learning journey.
      </p>

      {/* Signup Card */}
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={
              <span className="font-semibold text-green-700">Username</span>
            }
            name="username"
            rules={[zodRule]}
          >
            <Input
              className="!rounded-full !py-2"
              placeholder="Choose a username"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-semibold text-green-700">Email</span>}
            name="email"
            rules={[zodRule]}
          >
            <Input
              className="!rounded-full !py-2"
              placeholder="you@example.com"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-semibold text-green-700">Password</span>
            }
            name="password"
            rules={[zodRule]}
          >
            <Input.Password
              className="!rounded-full !py-2"
              placeholder="Create a password"
            />
          </Form.Item>

          <Form.Item
            label={
              <span className="font-semibold text-green-700">
                Confirm Password
              </span>
            }
            name="passwordConfirm"
            rules={[zodRule]}
          >
            <Input.Password
              className="!rounded-full !py-2"
              placeholder="Confirm your password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="!w-full !bg-green-600 !border-none !py-2 !rounded-full hover:!bg-green-700 transition"
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <span className="text-gray-600">Already have an account? </span>
          <Link
            to="/login"
            className="text-green-600 font-semibold hover:text-green-700"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};
