import { useContext } from 'react';
import { ThemeContext, type ThemeContextType } from '../contexts/theme.context';

/**
 * Hook to access theme context
 * @returns Theme context with themeMode and toggleTheme
 * @throws Error if used outside of ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
