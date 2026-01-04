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
            <SidenavContainer show={true}>

            </SidenavContainer>
            <MainContainer>
                <div className={cn("min-h-screen w-full flex items-center justify-center bg-gray-100 overflow-hidden", className)} {...restProps}>
                    <Outlet />
                </div>
            </MainContainer>
        </>
    );
};