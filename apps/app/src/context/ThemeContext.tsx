import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'system' | 'light' | 'dark' | 'oled';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export interface ThemeProviderProps {
  children: ReactNode;
}

const applyThemeClass = (theme: Theme): void => {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark', 'theme-oled');

  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(isDark ? 'theme-dark' : 'theme-light');
  } else {
    root.classList.add(`theme-${theme}`);
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('formulaflash_theme');
    if (stored === 'system' || stored === 'light' || stored === 'dark' || stored === 'oled') {
      return stored as Theme;
    }
    return 'system';
  });

  const setTheme = (newTheme: Theme): void => {
    setThemeState(newTheme);
    localStorage.setItem('formulaflash_theme', newTheme);
  };

  useEffect(() => {
    applyThemeClass(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (): void => applyThemeClass('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
