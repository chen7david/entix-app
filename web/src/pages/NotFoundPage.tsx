import { Button } from "antd";
import { Link } from "react-router-dom";

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-6">
      {/* Owl */}
      <div className="w-40 h-40 bg-green-500 rounded-full flex items-center justify-center shadow-xl mb-8">
        <span className="text-white text-6xl">🦉</span>
      </div>

      {/* Title */}
      <h1 className="text-5xl font-extrabold text-green-700 text-center">
        404 — Page Not Found
      </h1>

      <p className="mt-4 text-lg text-gray-700 max-w-md text-center">
        Looks like you’ve wandered off the learning path. Don’t worry—let’s get
        you back on track.
      </p>

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        <Link to="/">
          <Button
            type="primary"
            className="!bg-green-600 !border-none !px-6 !py-2 !rounded-full hover:!bg-green-700 transition"
          >
            Go Home
          </Button>
        </Link>

        <Link to="/login">
          <Button className="!px-6 !py-2 !rounded-full !border-green-600 !text-green-600 hover:!bg-green-100 transition">
            Login
          </Button>
        </Link>
      </div>
    </div>
  );
};
