import React, { createContext, useState, useEffect, useContext } from "react";

// --- Types ---
interface Employee {
  FirstName: string;
  EmailId: string;
  CompanyId: string;
  ActiveModuleId: string;
  CurrencyName?: string;
  CurrencyCode?: string;
  Rate?: number;
  [key: string]: any;
}

interface PanelSetting {
  SidebarColor?: string;
  TextColor?: string;
  FooterData?: string;
  Logo?: string;
  HoverColor?: string;
  SidebarHeader?: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  userProfile: Employee | null;
  panelSetting: PanelSetting | null;
  login: (employee: Employee, token: string, panelSettingData?: PanelSetting) => void;
  logout: () => void;
  updateUserProfile: (updatedProfile: Employee) => void;
  updatePanelSetting: (updatedPanel: PanelSetting) => void;
}

// --- Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<Employee | null>(null);
  const [panelSetting, setPanelSetting] = useState<PanelSetting | null>(null);

  // Load token and user profile on app mount
  useEffect(() => {
    const token = localStorage.getItem("authtoken");
    const storedProfile: Employee | null = JSON.parse(
      localStorage.getItem("EmployeeDetails") || "null"
    );
    const storedPanel: PanelSetting | null = JSON.parse(
      localStorage.getItem("PanelSetting") || "null"
    );

    if (token) setIsAuthenticated(true);
    if (storedProfile) setUserProfile(storedProfile);
    if (storedPanel) setPanelSetting(storedPanel);
    setLoading(false);
  }, []);

  // Login — mirrors what SignInForm saves on success
  const login = (employee: Employee, token: string, panelSettingData?: PanelSetting): void => {
    localStorage.setItem("authtoken", token);
    localStorage.setItem("EmployeeDetails", JSON.stringify(employee));
    localStorage.setItem("FullName", employee.FirstName || "");
    localStorage.setItem("EmailId", employee.EmailId || "");
    localStorage.setItem("CompanyId", employee.CompanyId || "");
    localStorage.setItem("ActiveModuleId", employee.ActiveModuleId || "");

    if (panelSettingData) {
      localStorage.setItem("PanelSetting", JSON.stringify(panelSettingData));
      localStorage.setItem("SidebarColor", panelSettingData.SidebarColor || "");
      localStorage.setItem("TextColor", panelSettingData.TextColor || "");
      localStorage.setItem("FooterData", panelSettingData.FooterData || "");
      localStorage.setItem("PanelLogo", panelSettingData.Logo || "");
      localStorage.setItem("HoverColor", panelSettingData.HoverColor || "");
      localStorage.setItem("SidebarHeader", panelSettingData.SidebarHeader || "");
      setPanelSetting(panelSettingData);
    }

    setIsAuthenticated(true);
    setUserProfile(employee);
  };

  // Logout — clears everything saved at login
  const logout = (): void => {
    const keys: string[] = [
      "authtoken",
      "EmployeeDetails",
      "FullName",
      "EmailId",
      "CompanyId",
      "ActiveModuleId",
      "PanelSetting",
      "SidebarColor",
      "TextColor",
      "FooterData",
      "PanelLogo",
      "HoverColor",
      "SidebarHeader",
    ];
    keys.forEach((key) => localStorage.removeItem(key));

    setIsAuthenticated(false);
    setUserProfile(null);
    setPanelSetting(null);
  };

  // Update employee profile (e.g. after profile edit)
  const updateUserProfile = (updatedProfile: Employee): void => {
    setUserProfile(updatedProfile);
    localStorage.setItem("EmployeeDetails", JSON.stringify(updatedProfile));
    localStorage.setItem("FullName", updatedProfile.FirstName || "");
    localStorage.setItem("EmailId", updatedProfile.EmailId || "");
  };

  // Update panel/theme settings independently
  const updatePanelSetting = (updatedPanel: PanelSetting): void => {
    setPanelSetting(updatedPanel);
    localStorage.setItem("PanelSetting", JSON.stringify(updatedPanel));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        login,
        logout,
        userProfile,
        panelSetting,
        updateUserProfile,
        updatePanelSetting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook ---
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};