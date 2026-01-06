import { Form } from 'antd'
import cn from 'classnames'
import { Button } from 'antd'
import { useSidebar } from '@web/src/hooks/navigation/sidebar.hook'

export const Toolbar = ({
    children,
    className,
    ...rest
}: React.HTMLAttributes<HTMLDivElement>) => {
    const { toggle } = useSidebar();
    return (
        <div
            className={cn(
                'bg-red-500 z-10 flex items-center sticky top-0 h-16 md:pr-4 md:pl-0 px-4',
                className,
            )}
            {...rest}
        >
            <Form layout="inline">
                <Form.Item>
                    <Button type="text" onClick={toggle}>
                        Menu
                    </Button>
                </Form.Item>
            </Form>
            {children}
        </div>
    )
}
