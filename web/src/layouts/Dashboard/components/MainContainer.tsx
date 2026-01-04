import type { HtmlElementProps } from '@web/src/types';
import cn from 'classnames'

export const MainContainer: React.FC<HtmlElementProps> = ({
    className,
    children,
    ...restProps
}) => {
    return (
        <div className={cn("bg-blue-100 h-[calc(100dvh)] flex-1 overflow-y-auto", className)} {...restProps}>
            {children}
        </div>
    );
};