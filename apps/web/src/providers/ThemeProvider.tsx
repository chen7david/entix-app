import { useEffect, useState, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { getStoredTheme, setStoredTheme, themeConfig } from '@config/theme.config';
import { ThemeContext, type ThemeContextType } from '../contexts/theme.context';

type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * ThemeProvider component that manages theme state and persistence
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => getStoredTheme());

  useEffect(() => {
    // Apply theme on mount and when it changes
    setStoredTheme(themeMode);

    // Update body class for theme-aware styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeMode}`);
  }, [themeMode]);

  const toggleTheme = (): void => {
    setThemeMode((prev: 'light' | 'dark') => (prev === 'light' ? 'dark' : 'light'));
  };

  const contextValue: ThemeContextType = {
    themeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={themeConfig[themeMode]} componentSize="middle">
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
