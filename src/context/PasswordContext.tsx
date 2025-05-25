
'use client';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface PasswordContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

// !!! IMPORTANT: In a real application, this password should NOT be hardcoded in the client-side code.
// It should be fetched from a secure environment variable on the server if possible,
// or a more robust authentication mechanism should be used.
// For this prototype, we are keeping it simple.
const SITE_PASSWORD = "firebase";

export function PasswordProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Attempt to load auth state from localStorage for session persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuthState = localStorage.getItem('site_authenticated');
      if (storedAuthState === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const login = useCallback((password: string) => {
    if (password === SITE_PASSWORD) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('site_authenticated', 'true');
      }
      return true;
    }
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
        localStorage.removeItem('site_authenticated');
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('site_authenticated');
    }
  }, []);

  return (
    <PasswordContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </PasswordContext.Provider>
  );
}

export function usePassword() {
  const context = useContext(PasswordContext);
  if (context === undefined) {
    throw new Error('usePassword must be used within a PasswordProvider');
  }
  return context;
}
