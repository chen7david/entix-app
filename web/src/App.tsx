import { Routes, Route, Navigate } from "react-router";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { AuthLayout } from "./layouts/AuthLayout";
import { links } from "./constants/links";
import { AppContainer } from "./components/containers/AppContainer";

export default function App() {
  return (
    <AppContainer>
      <Routes>
        <Route path="/" element={<Navigate to={links.auth.signIn} replace />} />
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="sign-in" element={<SignInPage />} />
          <Route path="sign-up" element={<SignUpPage />} />
        </Route>
        <Route path={links.dashboard.profile} element={<ProfilePage />} />
      </Routes>
    </AppContainer>
  );
}