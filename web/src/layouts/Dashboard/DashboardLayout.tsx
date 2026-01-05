import { Outlet } from "react-router";
import type { HtmlElementProps } from '@web/src/types';
import cn from 'classnames'
import { MainContainer } from "./components/MainContainer";
import { SiderContainer } from "./components/SiderContainer";

export const DashboardLayout: React.FC<HtmlElementProps> = ({
    className,
    children,
    ...restProps
}) => {
    return (
        <>
            <SiderContainer show={false}>
                Test Dashboard Content
            </SiderContainer>
            <MainContainer className={cn("", className)} {...restProps}>
                <Outlet />
            </MainContainer>
        </>
    );
};