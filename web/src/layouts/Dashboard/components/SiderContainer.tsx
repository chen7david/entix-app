import type { HtmlElementProps } from '@web/src/types';
import cn from 'classnames'

interface SiderContainerProps extends HtmlElementProps {
    show: boolean;
}

export const SiderContainer: React.FC<SiderContainerProps> = ({
    className,
    children,
    ...restProps
}) => {
    return (
        <div className={cn(
            "bg-green-100",
            "h-[100dvh] w-60",
            "overflow-y-auto",
            "z-30 hidden lg:block",
            "transition-all duration-300 ease-in-out",
            className,

        )} {...restProps}>
            {children}
        </div>
    );
};