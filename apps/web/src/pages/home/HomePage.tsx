import { CenteredSpin } from "@web/src/components/common/CenteredView";
import { useActiveRole } from "@web/src/features/organization";
import type React from "react";
import { AdminPortal } from "../org/admin/AdminPortal";
import { FinancePortal } from "../org/finance/FinancePortal";
import { StudentPortal } from "../org/student/StudentPortal";
import { TeacherPortal } from "../org/teacher/TeacherPortal";

export const HomePage: React.FC = () => {
    const { activeRole } = useActiveRole();

    if (activeRole === "finance") {
        return <FinancePortal />;
    }

    if (activeRole === "admin" || activeRole === "owner") {
        return <AdminPortal />;
    }

    if (activeRole === "teacher") {
        return <TeacherPortal />;
    }

    if (activeRole === "student") {
        return <StudentPortal />;
    }

    return <CenteredSpin />;
};

export default HomePage;
