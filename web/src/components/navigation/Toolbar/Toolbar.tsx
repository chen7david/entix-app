import { Button, Form } from 'antd'
import cn from 'classnames'
import { MenuOutlined } from '@ant-design/icons';
import { useSidebar } from '@web/src/hooks/navigation/sidebar.hook';


export const Toolbar = ({
    children,
    className,
    ...rest
}: React.HTMLAttributes<HTMLDivElement>) => {

    const { toggle } = useSidebar();
    return (
        <div
            className={cn(
                'bg-red-500 z-10 flex items-center sticky top-0 h-14 md:pr-4 md:pl-0 px-4',
                className,
            )}
            {...rest}
        >
            <Form layout="inline">
                <div className="md:hidden">
                    <Form.Item>
                        <Button onClick={toggle} size="large" icon={<MenuOutlined />} type="text" />
                    </Form.Item>
                </div>
                {children}
            </Form>
        </div>
    )
}
