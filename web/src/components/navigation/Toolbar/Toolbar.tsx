import { Button } from 'antd'
import cn from 'classnames'
import { MenuOutlined } from '@ant-design/icons';
import { useSidebar } from '@web/src/hooks/navigation/sidebar.hook';


import { Breadcrumb, Typography } from 'antd';

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    breadcrumbs?: { title: string; href?: string }[];
    actions?: React.ReactNode;
}

export const Toolbar = ({
    children,
    className,
    title,
    breadcrumbs,
    actions,
    ...rest
}: ToolbarProps) => {

    const { toggle } = useSidebar();
    return (
        <div
            className={cn(
                'bg-gray-100 z-10 flex items-center sticky top-0 h-16 md:pr-4 md:pl-0 px-4',
                className,
            )}
            {...rest}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    <div className="md:hidden">
                        <Button onClick={toggle} size="large" icon={<MenuOutlined />} type="text" />
                    </div>
                    <div>
                        {breadcrumbs && (
                            <Breadcrumb items={breadcrumbs} className="mb-1" />
                        )}
                        {title && (
                            <Typography.Title level={4} className="!mb-0">
                                {title}
                            </Typography.Title>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {actions}
                    {children}
                </div>
            </div>
        </div>
    )
}
