import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggle: () => {}, setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark'); // default dark; resolved on mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Resolve stored preference or system preference
    let stored = null;
    try { stored = localStorage.getItem('cp_theme'); } catch { /* */ }
    const preferred = stored
      || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    apply(preferred);
    setThemeState(preferred);
    setMounted(true);
  }, []);

  function apply(t) {
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    // Smooth transition on theme change (not on first paint)
    root.style.setProperty('--theme-transition', 'all 0.3s ease');
    setTimeout(() => root.style.removeProperty('--theme-transition'), 350);
  }

  const setTheme = useCallback((t) => {
    apply(t);
    setThemeState(t);
    try { localStorage.setItem('cp_theme', t); } catch { /* */ }
  }, []);

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem('cp_theme', next); } catch { /* */ }
      return next;
    });
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);