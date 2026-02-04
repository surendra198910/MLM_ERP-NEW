import React, { useState } from "react";
import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { ApiService } from "../../../../services/ApiService";

/* ====================================================
   TYPES
==================================================== */
interface Tool {
  ModuleID: number;
  ModuleTitle: string;
  ModuleIcon: string;
  RouteURL: string;
}

/* ====================================================
   DYNAMIC ICON RESOLVER
==================================================== */
const getLucideIcon = (iconName?: string) =>
  (LucideIcons as any)[iconName || "LayoutDashboard"] ||
  LucideIcons.LayoutDashboard;

const CompanyTools: React.FC = () => {
  const { universalService } = ApiService();

  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  /* ====================================================
     FETCH TOOLS (ONLY ON FIRST CLICK)
==================================================== */
  const fetchTools = async () => {
    if (loaded || loading) return;

    try {
      setLoading(true);

      const res = await universalService({
        procName: "GetTools",
        Para: JSON.stringify({ ActionMode: "GetTools" }),
      });

      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      setTools(data);
      setLoaded(true);
    } catch (err) {
      console.error("CompanyTools API error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ====================================================
     UI
==================================================== */
  return (
    <div className="relative ltr:ml-[10px]">
      <Menu as="div" className="relative inline-block text-left">
        {/* ================= ICON + TOOLTIP ================= */}
        <div className="relative group inline-block">
          <MenuButton
            onClick={fetchTools}
            className="transition-all relative top-[2px] hover:text-primary-500"
          >
            <i className="material-symbols-outlined ml-3 !text-[22px] md:!text-[24px]">
              apps
            </i>
          </MenuButton>

          {/* TOOLTIP */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-[32px]
                       px-2 py-1 text-xs rounded
                       bg-gray-800 text-white
                       opacity-0 group-hover:opacity-100
                       transition-opacity
                       whitespace-nowrap
                       pointer-events-none"
          >
            Company tools

            {/* ARROW */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2
                         w-0 h-0
                         border-l-4 border-r-4 border-b-4
                         border-l-transparent
                         border-r-transparent
                         border-b-gray-800"
            />
          </div>
        </div>

        {/* ================= POPUP ================= */}
        <MenuItems
          transition
          className="
            bg-white dark:bg-[#0c1427]
            transition-all shadow-3xl dark:shadow-none
            pt-[20px] px-[10px] pb-[8px]
            absolute mt-[10px]
            w-[240px]
            z-[50]
            right-0
            rounded-md
            data-[closed]:scale-95
            data-[closed]:opacity-0
            data-[enter]:duration-100
            data-[leave]:duration-75
          "
        >
          {/* LOADING */}
          {loading && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* GRID */}
          {!loading && (
            <ul className="grid grid-cols-3 text-center gap-[5px]">
              {tools.map((tool) => {
                const Icon = getLucideIcon(tool.ModuleIcon);

                return (
                  <li key={tool.ModuleID}>
                    <Link
                      to={tool.RouteURL}
                      className="block text-xs mb-[15px]
                                 text-black dark:text-white
                                 transition-all hover:text-primary-500"
                    >
                      <Icon
                        size={24}
                        className="mx-auto mb-[6px] text-primary-500"
                      />
                      <span className="block truncate">
                        {tool.ModuleTitle}
                      </span>
                    </Link>
                  </li>
                );
              })}

              {!tools.length && !loading && (
                <li className="col-span-3 text-xs text-gray-500 py-4">
                  No tools available
                </li>
              )}
            </ul>
          )}
        </MenuItems>
      </Menu>
    </div>
  );
};

export default CompanyTools;
