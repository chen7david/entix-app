import { Routes, Route } from "react-router";
import { HomePage } from "./pages/home/HomePage";
import { SignUpPage } from "./pages/signup/SignUpPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
    </Routes>
  );
}