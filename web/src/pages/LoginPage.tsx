import { Form, Input, Button } from "antd";
import { Link } from "react-router-dom";

export const LoginPage = () => {
  const onFinish = (values: any) => {
    console.log("Login submitted:", values);
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-4">
      {/* Logo / Title */}
      <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-xl mb-8">
        <span className="text-white text-6xl">🦉</span>
      </div>

      <h1 className="text-4xl font-extrabold text-green-700 mb-2">
        Welcome Back
      </h1>

      <p className="text-gray-600 mb-8 text-center">
        Log in to continue your learning journey.
      </p>

      {/* Login Card */}
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md">
        <Form layout="vertical" onFinish={onFinish}>
          {/* Username */}
          <Form.Item
            label={
              <span className="font-semibold text-green-700">Username</span>
            }
            name="username"
            rules={[{ required: true, message: "Please enter your username" }]}
          >
            <Input
              className="!rounded-full !py-2"
              placeholder="Enter your username"
            />
          </Form.Item>

          {/* Password */}
          <Form.Item
            label={
              <span className="font-semibold text-green-700">Password</span>
            }
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              className="!rounded-full !py-2"
              placeholder="Enter your password"
            />
          </Form.Item>

          {/* Forgot Password */}
          <div className="flex justify-end mb-4">
            <Link
              to="/forgot-password"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          {/* Login Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="!w-full !bg-green-600 !border-none !py-2 !rounded-full hover:!bg-green-700 transition"
            >
              Log In
            </Button>
          </Form.Item>
        </Form>

        {/* Sign Up */}
        <div className="text-center mt-4">
          <span className="text-gray-600">Don’t have an account? </span>
          <Link
            to="/signup"
            className="text-green-600 font-semibold hover:text-green-700"
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};
