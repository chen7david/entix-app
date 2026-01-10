import React from 'react';
import { ConfigProvider } from 'antd';
import { themeConfig } from '../theme/config';

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    return (
        <ConfigProvider theme={themeConfig}>
            {children}
        </ConfigProvider>
    );
};
