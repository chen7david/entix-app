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

export const CenteredSpin: React.FC<SpinProps> = (props) => (
    <CenteredView>
        <Spin size="large" {...props} />
    </CenteredView>
);
