import { Routes, Route } from "react-router";
import { HomePage } from "./pages/home/HomePage";
import { SignUpPage } from "./pages/signup/SignUpPage";
import { AuthLayout } from "./layouts/AuthLayout";

export default function App() {
  return (
    <Routes>
      <Route index element={<HomePage />} />
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="signup" element={<SignUpPage />} />
      </Route>
    </Routes>
  );
}