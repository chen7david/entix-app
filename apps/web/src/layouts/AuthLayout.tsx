import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Outlet />
    </div>
  );
}
