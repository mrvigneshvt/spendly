import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, type ThemeColors } from './colors';

type ThemeKind = 'dark' | 'light';

interface ThemeContextValue {
  theme: ThemeKind;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (t: ThemeKind) => void;
}

const STORAGE_KEY = 'spendly_theme';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKind>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setThemeState(saved);
        }
      })
      .catch(() => {
        // ignore read errors; default to dark
      })
      .finally(() => setLoaded(true));
  }, []);

  const persistAndSet = useCallback((t: ThemeKind) => {
    setThemeState(t);
    AsyncStorage.setItem(STORAGE_KEY, t).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    persistAndSet(theme === 'dark' ? 'light' : 'dark');
  }, [theme, persistAndSet]);

  const colors = theme === 'dark' ? darkColors : lightColors;

  // Don't render children until theme is loaded to avoid flash
  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme: persistAndSet }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
