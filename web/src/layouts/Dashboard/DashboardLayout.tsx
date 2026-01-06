import { Outlet } from "react-router";
import type { HtmlElementProps } from '@web/src/types';
import cn from 'classnames'
import { MainContainer } from "./components/MainContainer";
import { SiderContainer } from "./components/SiderContainer";
import { useSidebar } from "@web/src/hooks/navigation/sidebar.hook";
import { Sidebar } from "@web/src/components/navigation/Sidebar/Sidebar";
import { SidebarMenu } from "@web/src/components/navigation/Sidebar/SidebarMenu";

export const DashboardLayout: React.FC<HtmlElementProps> = ({
    className,
    ...restProps
}) => {
    const { isOpen } = useSidebar();

    return (
        <>
            <SiderContainer show={isOpen}>
                <SidebarMenu />
                <Sidebar />
            </SiderContainer>
            <MainContainer className={cn("", className)} {...restProps}>
                <Outlet />
            </MainContainer>
        </>
    );
};