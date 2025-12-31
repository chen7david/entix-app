import { Routes, Route, Navigate } from "react-router";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { AuthLayout } from "./layouts/AuthLayout";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { links } from "./constants/links";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={links.auth.signIn} replace />} />
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<LoginPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
      </Route>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}