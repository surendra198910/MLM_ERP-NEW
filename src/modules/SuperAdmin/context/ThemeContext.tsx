import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiService } from "../../../services/ApiService";

export interface PanelSettings {
  SidebarColor: string;
  TextColor: string;
  HoverColor: string;
  SidebarHeader: string;
  Logo?: string;
}

interface ThemeContextType {
  theme: PanelSettings;
  refreshTheme: () => Promise<void>;
  setTheme: (theme: PanelSettings) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const defaultTheme: PanelSettings = {
  SidebarColor: "#1E293B",
  TextColor: "#FFFFFF",
  HoverColor: "#3e3f42",
  SidebarHeader: "Sysfo Super Admin",
  Logo: "logo-icon.svg",
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { universalService } = ApiService();
  const [theme, setThemeState] = useState<PanelSettings>(defaultTheme);

  // 🔹 Load from localStorage instantly
  useEffect(() => {
    const stored = localStorage.getItem("PanelSetting");
    if (stored) setThemeState(JSON.parse(stored));
  }, []);

  // 🔹 Fetch latest from API
  const refreshTheme = async () => {
    try {
      const res = await universalService({
        procName: "USP_PanelSetting",
        Para: JSON.stringify({ ActionMode: "GET_GLOBAL" }),
      });

      const data = res?.data?.[0] || res?.[0];
      if (!data) return;

      localStorage.setItem("PanelSetting", JSON.stringify(data));
      setThemeState(data);
    } catch (err) {
      console.error("Theme refresh failed", err);
    }
  };

  const setTheme = (t: PanelSettings) => {
    localStorage.setItem("PanelSetting", JSON.stringify(t));
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, refreshTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
