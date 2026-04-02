import type { ResultProps, SpinProps } from "antd";
import { Result, Spin } from "antd";
import type React from "react";

export const CenteredView: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex justify-center items-center h-screen w-full">{children}</div>
);

export const CenteredResult: React.FC<ResultProps> = (props) => (
    <CenteredView>
        <Result {...props} />
    </CenteredView>
);

/**
 * CenteredSpin provides a loading indicator that is perfectly centered within a full-screen view.
 *
 * @note
 * The {children || <div style={{ padding: 50 }} />} pattern is used because Ant Design's
 * Spin with a 'tip' property now requires a nested structure (children) when not in
 * fullscreen mode. This suppresses the "tip only work in nest or fullscreen pattern"
 * warning in React 19 / AntD 6.
 */
export const CenteredSpin: React.FC<SpinProps & { children?: React.ReactNode }> = ({
    children,
    ...props
}) => (
    <CenteredView>
        <Spin size="large" {...props}>
            {children || <div style={{ padding: 50 }} />}
        </Spin>
    </CenteredView>
);
