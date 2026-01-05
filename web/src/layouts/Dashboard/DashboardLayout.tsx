import { Outlet } from "react-router";
import type { HtmlElementProps } from '@web/src/types';
import cn from 'classnames'
import { MainContainer } from "./components/MainContainer";
import { SiderContainer } from "./components/SiderContainer";
import { useSidebar } from "@web/src/hooks/auth/sidebar.hook";

export const DashboardLayout: React.FC<HtmlElementProps> = ({
    className,
    ...restProps
}) => {
    const { isOpen } = useSidebar();

    return (
        <>
            <SiderContainer show={isOpen}>
                Test Dashboard Content
            </SiderContainer>
            <MainContainer className={cn("", className)} {...restProps}>
                <Outlet />
            </MainContainer>
        </>
    );
};