import { Button } from 'antd'
import cn from 'classnames'
import { MenuOutlined } from '@ant-design/icons';
import { useSidebar } from '@web/src/hooks/navigation/useSidebar';


export const Toolbar = ({
    children,
    className,
    ...rest
}: React.HTMLAttributes<HTMLDivElement>) => {

    const { toggle } = useSidebar();
    return (
        <div
            className={cn(
                'bg-gray-100 z-10 flex items-center sticky top-0 h-16 md:pr-4 md:pl-0 px-4',
                className,
            )}
            {...rest}
        >
            <div className="flex items-center w-full gap-2">
                <div className="md:hidden">
                    <div>
                        <Button onClick={toggle} size="large" icon={<MenuOutlined />} type="text" />
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
}
