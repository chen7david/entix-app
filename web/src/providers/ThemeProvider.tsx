import React from 'react';
import { ConfigProvider } from 'antd';
import { getThemeConfig } from '../theme/tokens';
import { useUserPreferences } from '@web/src/hooks/auth/useUserPreferences';

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { theme } = useUserPreferences();
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <ConfigProvider theme={getThemeConfig(isDark)}>
            {children}
        </ConfigProvider>
    );
};
