import { Outlet } from "react-router";
import type { HtmlElementProps } from '@web/src/types';
import cn from 'classnames'
import { MainContainer } from "./components/MainContainer";
import { SidenavContainer } from "./components/SideNavContainer";


export const DashboardLayout: React.FC<HtmlElementProps> = ({
    className,
    children,
    ...restProps
}) => {
    return (
        <>
            <SidenavContainer show={false}>
                Test Dashboard Content
            </SidenavContainer>
            <MainContainer className={cn("", className)} {...restProps}>
                <Outlet />
            </MainContainer>
        </>
    );
};