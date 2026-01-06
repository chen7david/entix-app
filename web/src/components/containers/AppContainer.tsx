import type { HtmlElementProps } from '@web/src/types';
import cn from 'classnames'

export const AppContainer: React.FC<HtmlElementProps> = ({
    className,
    children,
    ...restProps
}) => {
    return (
        <div className={cn("flex h-[calc(100dvh)] m-0 p-0", className)} {...restProps}>
            {children}
        </div>
    );
};