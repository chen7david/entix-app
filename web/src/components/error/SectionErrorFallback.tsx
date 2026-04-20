import { Button, Result, theme } from "antd";
import type { FallbackProps } from "react-error-boundary";

const { useToken } = theme;

/**
 * Fallback for nested {@link RouteErrorBoundary}: keeps chrome (sidebars, toolbar) visible.
 */
export function SectionErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    const isDevelopment = import.meta.env.DEV;
    const { token } = useToken();

    const isError = error instanceof Error;
    const errorMessage = isError ? error.message : "An unknown error occurred";
    const errorStack = isError ? error.stack : undefined;

    return (
        <div className="flex flex-1 min-h-[min(50vh,28rem)] w-full items-center justify-center p-4">
            <Result
                status="error"
                title="This section couldn’t load"
                subTitle="Something went wrong in this view. You can try again or use the navigation to go elsewhere."
                extra={[
                    <Button type="primary" key="retry" onClick={resetErrorBoundary}>
                        Try again
                    </Button>,
                ]}
            >
                {isDevelopment && (
                    <div
                        className="mt-4 p-4 rounded-lg text-left max-w-2xl mx-auto"
                        style={{
                            backgroundColor: token.colorBgContainer,
                            border: `1px solid ${token.colorBorderSecondary}`,
                        }}
                    >
                        <p className="font-semibold text-red-600 mb-2">
                            Error details (development only)
                        </p>
                        <pre className="text-xs overflow-auto">
                            <code>{errorMessage}</code>
                        </pre>
                        {errorStack && (
                            <pre className="text-xs overflow-auto mt-2 text-gray-500">
                                <code>{errorStack}</code>
                            </pre>
                        )}
                    </div>
                )}
            </Result>
        </div>
    );
}
