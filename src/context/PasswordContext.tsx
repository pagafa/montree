
'use client';
import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface PasswordContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  changePassword: (currentPasswordAttempt: string, newPassword: string) => { success: boolean; message: string };
}

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

const SITE_PASSWORD_KEY = 'site_effective_password';
const DEFAULT_SITE_PASSWORD = "firebase"; // The original hardcoded password

export function PasswordProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [effectivePassword, setEffectivePassword] = useState(DEFAULT_SITE_PASSWORD);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPassword = localStorage.getItem(SITE_PASSWORD_KEY);
      if (storedPassword) {
        setEffectivePassword(storedPassword);
      } else {
        // If no password in local storage, set the default one
        localStorage.setItem(SITE_PASSWORD_KEY, DEFAULT_SITE_PASSWORD);
        setEffectivePassword(DEFAULT_SITE_PASSWORD);
      }

      const storedAuthState = localStorage.getItem('site_authenticated');
      if (storedAuthState === 'true') {
        // Re-check if they are authenticated with the current effective password,
        // this is a light re-validation. A full app might force re-login.
        // For simplicity here, we trust the flag if the password context is loaded.
        setIsAuthenticated(true);
      }
    }
  }, []);

  const login = useCallback((passwordAttempt: string) => {
    if (passwordAttempt === effectivePassword) {
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
  }, [effectivePassword]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('site_authenticated');
    }
  }, []);

  const changePassword = useCallback((currentPasswordAttempt: string, newPassword: string) => {
    if (currentPasswordAttempt !== effectivePassword) {
      return { success: false, message: "Current password incorrect." };
    }
    if (!newPassword || newPassword.length < 6) { // Basic validation
        return { success: false, message: "New password must be at least 6 characters."}
    }
    setEffectivePassword(newPassword);
    if (typeof window !== 'undefined') {
      localStorage.setItem(SITE_PASSWORD_KEY, newPassword);
    }
    // Optionally, re-authenticate or force logout here. For now, just update.
    return { success: true, message: "Password updated successfully. You may need to log in again if your session expires." };
  }, [effectivePassword]);


  return (
    <PasswordContext.Provider value={{ isAuthenticated, login, logout, changePassword }}>
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
