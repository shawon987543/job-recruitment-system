"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

type AdminThemeContextType = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(
  undefined
);

const STORAGE_KEY = "admin-settings-theme";

function applyTheme(mode: ThemeMode) {
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const isDark =
    mode === "dark" || (mode === "system" && systemPrefersDark);

  document.documentElement.dataset.adminTheme = isDark ? "dark" : "light";
}

export default function AdminThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    if (
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeModeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    applyTheme(themeMode);

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const handleSystemThemeChange = () => {
      if (themeMode === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setThemeModeState(mode);
  }, []);

  return (
    <AdminThemeContext.Provider value={{ themeMode, setThemeMode }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);

  if (!context) {
    throw new Error(
      "useAdminTheme must be used inside AdminThemeProvider"
    );
  }

  return context;
}
