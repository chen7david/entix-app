import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button, Result, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // Here you would typically log to an error reporting service
    }

    private handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <Result
                        status="500"
                        title="Something went wrong"
                        subTitle={
                            <div className="flex flex-col gap-2 max-w-md mx-auto">
                                <Text type="secondary">
                                    An unexpected error occurred. Our team has been notified.
                                </Text>
                                {import.meta.env.DEV && this.state.error && (
                                    <Paragraph className="text-left bg-gray-100 p-4 rounded-md overflow-auto max-h-48 mt-4 font-mono text-xs text-red-500">
                                        {this.state.error.toString()}
                                    </Paragraph>
                                )}
                            </div>
                        }
                        extra={
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={this.handleReload}
                                size="large"
                            >
                                Reload Page
                            </Button>
                        }
                    />
                </div>
            );
        }

        return this.props.children;
    }
}
