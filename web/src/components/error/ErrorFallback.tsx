import { Button, Result } from 'antd';
import type { FallbackProps } from 'react-error-boundary';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    const isDevelopment = import.meta.env.DEV;

    // Type guard to check if error is an Error instance
    const isError = error instanceof Error;
    const errorMessage = isError ? error.message : 'An unknown error occurred';
    const errorStack = isError ? error.stack : undefined;

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Result
                status="error"
                title="Something went wrong"
                subTitle="We're sorry, but something unexpected happened. Please try again."
                extra={[
                    <Button type="primary" key="retry" onClick={resetErrorBoundary}>
                        Try Again
                    </Button>,
                ]}
            >
                {isDevelopment && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                        <p className="font-semibold text-red-600 mb-2">Error Details (Development Only):</p>
                        <pre className="text-xs overflow-auto max-w-2xl">
                            <code>{errorMessage}</code>
                        </pre>
                        {errorStack && (
                            <pre className="text-xs overflow-auto max-w-2xl mt-2 text-gray-600">
                                <code>{errorStack}</code>
                            </pre>
                        )}
                    </div>
                )}
            </Result>
        </div>
    );
}
