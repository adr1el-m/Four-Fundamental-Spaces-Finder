'use client';

import * as React from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<'dark' | 'light'>('light');

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey) as Theme | null;
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setTheme(stored);
      }
    } catch {}
  }, [storageKey]);

  React.useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => {
        const systemTheme: 'dark' | 'light' = media.matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
        root.classList.add(systemTheme);
      };
      apply();

      const onChange = () => apply();
      media.addEventListener?.('change', onChange);
      media.addListener?.(onChange);

      return () => {
        media.removeEventListener?.('change', onChange);
        media.removeListener?.(onChange);
      };
    }

    setResolvedTheme(theme);
    root.classList.add(theme);
  }, [theme]);
 
  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      try {
        window.localStorage.setItem(storageKey, theme);
      } catch {}
      setTheme(theme);
    },
  };


  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
