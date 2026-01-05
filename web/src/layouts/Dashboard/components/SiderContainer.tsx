import type { HtmlElementProps } from '@web/src/types';
import cn from 'classnames'

interface SiderContainerProps extends HtmlElementProps {
    show: boolean;
}

export const SiderContainer: React.FC<SiderContainerProps> = ({
    className,
    children,
    show,
    ...restProps
}) => {
    return (
        <div className={cn('bg-green-100',
            'h-[calc(100dvh)] z-30 fixed w-60 inset-y-0 md:translate-x-0',
            'transform transition-all duration-300 ease-in-out',
            className,
            { 'translate-x-0': show },
            { '-translate-x-full block': !show },
        )} {...restProps}>
            {children}
        </div>
    );
};