import { useAuth } from "@web/src/features/auth";
import type React from "react";
import { AdminPortal } from "../org/admin/AdminPortal";
import { StudentPortal } from "../org/student/StudentPortal";
import { TeacherPortal } from "../org/teacher/TeacherPortal";

export const HomePage: React.FC = () => {
    const { user } = useAuth();
    const role = user?.orgRole;

    if (role === "admin" || role === "owner") {
        return <AdminPortal />;
    }

    if (role === "teacher") {
        return <TeacherPortal />;
    }

    // Default to Student Portal for students or unknown roles within an org context
    return <StudentPortal />;
};

export default HomePage;
