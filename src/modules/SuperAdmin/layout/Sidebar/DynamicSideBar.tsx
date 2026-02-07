import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Settings,
  Users,
  Building2,
  ShoppingCart,
  FileSearch,
  UserCircle,
  Circle,
  ArrowRight,
} from "lucide-react";
import { ApiService } from "../../../../services/ApiService";
import SidebarSkeleton from "./SidebarSkeleton";

/* --------------------------------------------
 ICON REGISTRY
 (Specific Colors for Icons, independent of Text Color)
--------------------------------------------- */
const iconMap: Record<string, React.ReactNode> = {
  Dashboard: <LayoutDashboard size={18} className="text-cyan-500" />,
  Master: <Settings size={18} className="text-orange-500" />,
  Employee: <Users size={18} className="text-green-500" />,
  Clients: <UserCircle size={18} className="text-blue-500" />,
  Company: <Building2 size={18} className="text-purple-500" />,
  "Product/Service": <ShoppingCart size={18} className="text-yellow-500" />,
  Reports: <FileSearch size={18} className="text-pink-500" />,
  Default: <LayoutDashboard size={18} className="text-gray-400" />,
};

/* --------------------------------------------
 DOT ICON FOR SUB CATEGORIES
--------------------------------------------- */
const DotIcon = <Circle size={4} fill="currentColor" className="opacity-70" />;

/* --------------------------------------------
 TYPES
--------------------------------------------- */
interface RawMenuItem {
  FormId: number;
  FormCategoryId: number;
  ParentCategoryId: number | null;
  FormCategoryName: string;
  ParentCategoryName: string | null;
  FormDisplayName: string;
  FormNameWithExt: string;
  Icon: string | null;
  ShowInMenu: boolean;
}

interface PanelSettings {
  SidebarColor: string;
  TextColor: string;
  HoverColor: string;
  SidebarHeader: string;
  Logo?: string;
}

/* --------------------------------------------
 HELPERS
--------------------------------------------- */
const slug = (text: string) => text.trim().replace(/\s+/g, "-").toLowerCase();

const normalizeParent = (name: string) =>
  name.toLowerCase() === "master" ? "" : slug(name);

const makePath = (parent: string, form: string) =>
  parent ? `/superadmin/${parent}/${form}` : `/superadmin/${form}`;

/* --------------------------------------------
 MASTER CATEGORY CONSTANT
--------------------------------------------- */
const MASTER_CATEGORY_ID = 1;
const MASTER_CATEGORY_NAME = "Master";

/* --------------------------------------------
 COMPONENT
--------------------------------------------- */
const DynamicSideBar: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState<RawMenuItem[]>([]);
  const [openState, setOpenState] = useState<Record<string, boolean>>({});

  const { universalService } = ApiService();
  const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL; // ✅ Get Env Variable

  // 1. Fetch LocalStorage Data
  const activeModuleId = Number(localStorage.getItem("ActiveModuleId")) || null;
  const employee = JSON.parse(localStorage.getItem("EmployeeDetails") || "{}");
  const employeeId = employee.EmployeeId;

  // 2. Default Settings fallback
  const defaultSettings: PanelSettings = {
    SidebarColor: "#1E293B",
    TextColor: "#FFFFFF",
    HoverColor: "#3e3f42",
    SidebarHeader: "Sysfo Super Admin",
    Logo: "logo-icon.svg", // Default logo fallback
  };

  const [panelSettings, setPanelSettings] =
    useState<PanelSettings>(defaultSettings);

  const isDarkMode = document.documentElement.classList.contains("dark");

  useEffect(() => {
    const onThemeUpdate = () => {
      const stored = localStorage.getItem("PanelSetting");
      if (stored) {
        setPanelSettings(JSON.parse(stored));
      }
    };

    window.addEventListener("panel-theme-updated", onThemeUpdate);

    return () => {
      window.removeEventListener("panel-theme-updated", onThemeUpdate);
    };
  }, []);

  /* --------------------------------------------
   FETCH MENU
  --------------------------------------------- */
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await universalService({
          procName: "MenuItems",
          Para: JSON.stringify({
            EmployeeId: employeeId,
            ActionMode: "admin",
            ModuleId: 10005,
          }),
        });

        const rows = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.recordset)
            ? res.data.recordset
            : Array.isArray(res)
              ? res
              : [];

        setMenuData(rows);
      } catch (err) {
        console.error("Sidebar Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [activeModuleId]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("PanelSetting");
    if (storedTheme) {
      setPanelSettings(JSON.parse(storedTheme));
    }
  }, []);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await universalService({
          procName: "PanelSetting",
          Para: JSON.stringify({ ActionMode: "GET_ACTIVE_THEME" }),
        });

        const data = res?.data?.[0] || res?.[0];
        if (!data) return;

        localStorage.setItem("PanelSetting", JSON.stringify(data));
        setPanelSettings(data);
      } catch (err) {
        console.error("Theme sync failed", err);
      }
    };

    fetchTheme();
  }, []);

  /* --------------------------------------------
   BUILD TREE STRUCTURE
  --------------------------------------------- */
  const menuTree = useMemo(() => {
    if (!Array.isArray(menuData)) return [];

    const map = new Map<number, any>();

    /* STEP 1: CREATE CATEGORY NODES */
    menuData.forEach((row) => {
      if (!map.has(row.FormCategoryId)) {
        map.set(row.FormCategoryId, {
          FormCategoryId: row.FormCategoryId,
          FormCategoryName: row.FormCategoryName,
          ParentCategoryId: row.ParentCategoryId,
          ParentCategoryName: row.ParentCategoryName,
          Icon: row.Icon,
          Forms: [],
          Children: [],
        });
      }

      if (
        row.ShowInMenu &&
        !(
          row.FormDisplayName?.trim().toLowerCase() ===
            row.FormCategoryName?.trim().toLowerCase() &&
          row.ParentCategoryId !== MASTER_CATEGORY_ID
        )
      ) {
        map.get(row.FormCategoryId).Forms.push({
          FormId: row.FormId,
          FormDisplayName: row.FormDisplayName,
          FormNameWithExt: row.FormNameWithExt,
        });
      }
    });

    /* STEP 2: INJECT MASTER IF REQUIRED */
    const hasMasterChildren = Array.from(map.values()).some(
      (x) => x.ParentCategoryId === MASTER_CATEGORY_ID,
    );

    if (hasMasterChildren && !map.has(MASTER_CATEGORY_ID)) {
      map.set(MASTER_CATEGORY_ID, {
        FormCategoryId: MASTER_CATEGORY_ID,
        FormCategoryName: MASTER_CATEGORY_NAME,
        ParentCategoryId: null,
        Icon: "settings",
        Forms: [],
        Children: [],
      });
    }

    /* STEP 3: BUILD TREE RELATIONSHIP */
    map.forEach((item) => {
      if (
        item.ParentCategoryId &&
        map.has(item.ParentCategoryId) &&
        item.ParentCategoryId !== item.FormCategoryId
      ) {
        map.get(item.ParentCategoryId).Children.push(item);
      }
    });

    /* STEP 4: RETURN ROOT NODES (SORTED) */
    const roots = Array.from(map.values()).filter(
      (x) =>
        !x.ParentCategoryId ||
        x.ParentCategoryId === 0 ||
        x.ParentCategoryId === x.FormCategoryId,
    );

    roots.sort((a, b) => a.FormCategoryId - b.FormCategoryId);

    const sortTree = (nodes: any[]) => {
      nodes.sort((a, b) => a.FormCategoryId - b.FormCategoryId);
      nodes.forEach((n) => sortTree(n.Children));
    };

    roots.forEach((r) => sortTree(r.Children));

    return roots;
  }, [menuData]);

  /* --------------------------------------------
   TOGGLE
  --------------------------------------------- */
  const toggle = (key: string) => {
    setOpenState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* --------------------------------------------
   RECURSIVE MENU RENDERER
  --------------------------------------------- */
  const RenderMenu = ({ item, parentPath = "" }: any) => {
    const current = normalizeParent(item.FormCategoryName);
    const fullPath = parentPath ? `${parentPath}/${current}` : current;

    return (
      <div className="ml-6 mt-1 space-y-1">
        {/* FORMS ONLY */}
        {item.Forms.map((f: any) => (
          <Link
            key={f.FormId}
            to={makePath(
              fullPath,
              slug(f.FormNameWithExt || f.FormDisplayName),
            )}
            className="text-primary-sidebar-text dark:text-gray-100 flex items-center py-2 px-3 rounded-md text-sm transition-colors hover:bg-primary-sidebar-bg-hover dark:hover:bg-gray-800"
            // Apply text color directly here to ensure icons inside don't get forced to this color if handled separately
            // className="text-primary-sidebar-text dark:text-gray-100"
          >
            {/* Arrow inherits text color */}
            <ArrowRight size={12} className="mr-2 opacity-60" />
            <span className="truncate">{f.FormDisplayName}</span>
          </Link>
        ))}

        {/* CHILD CATEGORIES (For Deep Nesting) */}
        {item.Children.map((child: any) => {
          const childKey = `${child.FormCategoryId}`;
          const isOpen = openState[childKey];

          return (
            <div key={childKey}>
              <div
                className="text-primary-sidebar-text dark:text-gray-100 flex justify-between items-center cursor-pointer px-2 py-2 rounded-md transition-colors hover:bg-primary-sidebar-bg-hover dark:hover:bg-gray-800
"
                onClick={() => toggle(childKey)}
                // className="text-primary-sidebar-text dark:text-gray-100"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-primary-sidebar-text dark:text-gray-100">
                    {DotIcon}
                  </span>
                  <span className="text-sm truncate">
                    {child.FormCategoryName}
                  </span>
                </div>

                {(child.Children.length > 0 || child.Forms.length > 0) &&
                  (isOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  ))}
              </div>

              {isOpen && <RenderMenu item={child} parentPath={fullPath} />}
            </div>
          );
        })}
      </div>
    );
  };

  /* --------------------------------------------
   MAIN RENDER
  --------------------------------------------- */
  // Determine Logo URL
  const logoUrl = panelSettings.Logo
    ? IMAGE_PREVIEW_URL
      ? `${IMAGE_PREVIEW_URL}${panelSettings.Logo}`
      : panelSettings.Logo
    : "/images/logo-icon.svg";

  return (
    <div
      className="
    sidebar-area fixed z-[7] top-0 w-[270px] h-screen transition-all shadow-lg flex flex-col
    bg-primary-sidebar-bg text-primary-sidebar-text
    dark:bg-[#0c1427]  dark:text-gray-100
  "
      style={
        !isDarkMode
          ? ({
              "--sidebar-bg": panelSettings.SidebarColor,
              "--sidebar-text": panelSettings.TextColor,
              "--sidebar-hover": panelSettings.HoverColor,
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* LOGO AREA - Corrected to use VITE_IMAGE_PREVIEW_URL */}
      <div
        className="logo shrink-0 border-b px-6 py-4 flex items-center gap-3 h-[64px]"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <Link to="/superadmin" className="flex items-center gap-3 w-full">
          <img
            src={logoUrl}
            alt="logo"
            className="w-8 h-8 object-contain rounded-full"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).src = "/images/logo-icon.svg";
            }}
          />
          <span
            className="font-bold text-lg leading-tight truncate text-primary-sidebar-text dark:text-gray-100"
            // className="text-primary-sidebar-text dark:text-gray-100"
          >
            {panelSettings.SidebarHeader}
          </span>
        </Link>
      </div>

      {/* MENU AREA */}
      <div className="flex-1 pt-4 px-4 pb-28 overflow-y-auto sidebar-custom-scrollbar">
        {loading ? (
          <SidebarSkeleton />
        ) : (
          <>
            {/* <span 
              className="block font-medium uppercase mb-3 text-xs opacity-60 tracking-wider"
              className="text-primary-sidebar-text dark:text-gray-100"

            >
              MAIN MENU
            </span> */}

            <ul className="space-y-2">
              {menuTree.map((cat: any) => {
                // SPECIAL CASE: DASHBOARD
                if (cat.FormCategoryName === "Dashboard") {
                  return (
                    <li key={cat.FormCategoryId}>
                      <Link
                        to="/superadmin"
                        className="flex items-center gap-3 px-2 py-2 rounded-md transition-colors hover:bg-primary-sidebar-bg-hover dark:hover:bg-gray-800
"
                      >
                        {/* Icon retains its own color from iconMap */}
                        <span className="shrink-0">{iconMap.Dashboard}</span>
                        {/* Text forced to theme color */}
                        <span
                          className="font-medium text-sm text-primary-sidebar-text dark:text-gray-100"
                          // className="text-primary-sidebar-text dark:text-gray-100"
                        >
                          Dashboard
                        </span>
                      </Link>
                    </li>
                  );
                }

                const key = `${cat.FormCategoryId}`;
                const isOpen = openState[key];
                const icon = iconMap[cat.FormCategoryName] || iconMap.Default;

                return (
                  <li key={key}>
                    <div
                      className="flex justify-between items-center cursor-pointer px-2 py-2 rounded-md transition-colors hover:bg-primary-sidebar-bg-hover dark:hover:bg-gray-800
"
                      onClick={() =>
                        cat.FormCategoryName !== "Dashboard" && toggle(key)
                      }
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Icon Container - Preserves specific colors */}
                        <span className="shrink-0">{icon}</span>
                        {/* Text Container - Uses dynamic theme color */}
                        <span
                          className="font-medium text-sm truncate text-primary-sidebar-text dark:text-gray-100"
                          // className="text-primary-sidebar-text dark:text-gray-100"
                        >
                          {cat.FormCategoryName}
                        </span>
                      </div>

                      {/* Chevron uses theme color */}
                      <span className="text-primary-sidebar-text dark:text-gray-100">
                        {isOpen ? (
                          <ChevronUp size={17} />
                        ) : (
                          <ChevronDown size={17} />
                        )}
                      </span>
                    </div>

                    {isOpen && <RenderMenu item={cat} parentPath="" />}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default DynamicSideBar;
