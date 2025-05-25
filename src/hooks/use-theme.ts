
"use client"

import type { DisplayConfig } from '@/types';
import { useState, useEffect, useCallback } from 'react';

export function useTheme(): [DisplayConfig['theme'], (theme: DisplayConfig['theme']) => void] {
  const [theme, setThemeState] = useState<DisplayConfig['theme']>('system');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as DisplayConfig['theme'] | null;
    if (storedTheme) {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemPrefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const setTheme = useCallback((newTheme: DisplayConfig['theme']) => {
    setThemeState(newTheme);
  }, []);


  // Listener for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);


  return [theme, setTheme];
}
