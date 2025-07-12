import { createContext } from 'react';

export type ThemeContextType = {
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
