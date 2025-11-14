import { Form, Input, Button } from "antd";
import { Link } from "react-router-dom";

export const ForgotPasswordPage = () => {
  const onFinish = (values: any) => {
    console.log("Password reset request:", values);
  };

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-xl mb-8">
        <span className="text-white text-6xl">🦉</span>
      </div>

      <h1 className="text-4xl font-extrabold text-green-700 mb-2">
        Reset Password
      </h1>

      <p className="text-gray-600 mb-8 text-center">
        Enter your email and we’ll send you instructions to reset your password.
      </p>

      {/* Forgot Password Card */}
      <div className="bg-white p-8 rounded-3xl shadow-lg w-full max-w-md">
        <Form layout="vertical" onFinish={onFinish}>
          {/* Email */}
          <Form.Item
            label={<span className="font-semibold text-green-700">Email</span>}
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input
              className="!rounded-full !py-2"
              placeholder="you@example.com"
            />
          </Form.Item>

          {/* Submit */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="!w-full !bg-green-600 !border-none !py-2 !rounded-full hover:!bg-green-700 transition"
            >
              Send Reset Link
            </Button>
          </Form.Item>
        </Form>

        {/* Back to login */}
        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-green-600 font-semibold hover:text-green-700"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
