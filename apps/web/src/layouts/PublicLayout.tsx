import { Outlet } from 'react-router-dom';
import { PublicRoute } from '@/components/PublicRoute';

/**
 * PublicLayout component for pages accessible to non-authenticated users
 * Includes the PublicRoute guard to redirect authenticated users
 */
export const PublicLayout = () => {
  return (
    <PublicRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </PublicRoute>
  );
};
