import type { ResultProps, SpinProps } from "antd";
import { Result, Spin } from "antd";
import type React from "react";

export const CenteredView: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex justify-center items-center h-screen w-full bg-[var(--bg-base)] text-[var(--text-base)] transition-colors duration-200">
        {children}
    </div>
);

export const CenteredResult: React.FC<ResultProps> = (props) => (
    <CenteredView>
        <Result {...props} />
    </CenteredView>
);

/** Centered loading indicator using AntD Spin. */
// AntD Spin tip requires nested content outside fullscreen mode.
export const CenteredSpin: React.FC<SpinProps & { children?: React.ReactNode }> = ({
    children,
    ...props
}) => (
    <CenteredView>
        <Spin size="large" {...props}>
            {/* React 19 compatibility */}
            {children || <div style={{ padding: 50 }} />}
        </Spin>
    </CenteredView>
);
