import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ApiService } from "../../services/ApiService";

import {
  Users,
  Package,
  Hotel,
  Layers,
  Briefcase,
  ClipboardList,
  ShoppingCart,
  BookOpen,
  ListChecks,
  Calculator,
  Link2,
  KeyRound,
  Scissors,
  PenTool,
} from "lucide-react";
import LandingPageSkeletonLoading from "./LandingPageSkeletonLoading";

/* ICON MAP (matches DB values) */
const iconMap = {
  Users,
  Package,
  Hotel,
  Layers,
  Briefcase,
  ClipboardList,
  ShoppingCart,
  BookOpen,
  ListChecks,
  Calculator,
  Link2,
  KeyRound,
  Scissors,
  PenTool,
};

/* COLOR MAPS */
const colorMap = {
  blue: "text-blue-500",
  green: "text-green-500",
  red: "text-red-500",
  yellow: "text-yellow-500",
  purple: "text-purple-500",
  cyan: "text-cyan-500",
  orange: "text-orange-500",
  pink: "text-pink-500",
  teal: "text-teal-500",
};

const bgMap = {
  blue: "bg-blue-100",
  green: "bg-green-100",
  red: "bg-red-100",
  yellow: "bg-yellow-100",
  purple: "bg-purple-100",
  cyan: "bg-cyan-100",
  orange: "bg-orange-100",
  pink: "bg-pink-100",
  teal: "bg-teal-100",
};

const colorKeys = [
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "orange",
  "teal",
  "cyan",
  "pink",
];

const ServicesPage = () => {
  const navigate = useNavigate();

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingTools, setLoadingTools] = useState(true);

  const [services, setServices] = useState([]);
  const [tools, setTools] = useState([]);
  const { universalService } = ApiService();
  const token = localStorage.getItem("authtoken");

  /* FETCH MODULES */
  useEffect(() => {
  const fetchModules = async () => {
    try {
      setLoadingServices(true);

      const payload = {
        procName: "Modules",
        Para: JSON.stringify({ Action: "GetAll" }),
      };

      const response = await universalService(payload);
      const res = response.data ? response.data : response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (!apiRes?.ModuleList) return;

      const moduleArray = JSON.parse(apiRes.ModuleList);

      const formattedModules = moduleArray.map((m, index) => {
        const color = colorKeys[index % colorKeys.length];
        return {
          title: m.ModuleTitle,
          description: m.ModuleDescription,
          path: m.RouteURL,
          icon: iconMap[m.ModuleIcon] || Layers,
          color,
        };
      });

      setServices(formattedModules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServices(false);
    }
  };

  fetchModules();
}, []);


  /* FETCH TOOLS */
  useEffect(() => {
  const fetchTools = async () => {
    try {
      setLoadingTools(true);

      const payload = {
        procName: "Tools",
        Para: JSON.stringify({ Action: "GetAll" }),
      };

      const response = await universalService(payload);
      const res = response.data ? response.data : response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (!apiRes?.ToolList) return;

      const toolArray = JSON.parse(apiRes.ToolList);

      const formattedTools = toolArray.map((t, index) => ({
        title: t.ToolTitle,
        description: t.ToolDescription,
        path: t.RouteURL,
        icon: iconMap[t.ToolIcon] || Calculator,
        color: t.Color || colorKeys[index % colorKeys.length],
      }));

      setTools(formattedTools);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTools(false);
    }
  };

  fetchTools();
}, []);
if (loadingServices || loadingTools) {
  return <LandingPageSkeletonLoading />;
}


  return (
    <div className="p-0 min-h-screen dark:bg-gray-900 mb-8">
      {/* HEADER */}
      <div className="w-full py-0 px-2 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Welcome Back, {localStorage.getItem("FullName") || "User"} 👋
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
          Choose a module to get started
        </p>
      </div>

      {/* MODULES GRID */}
      <div className="grid grid-cols-8 gap-4 max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 place-items-center">
        {services.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="
                relative w-full max-w-[170px] h-[170px] p-3 rounded-xl 
                bg-white dark:bg-gray-800 shadow-sm 
                hover:shadow-lg hover:-translate-y-1 transition-all
                flex flex-col items-center text-center justify-center
                group overflow-hidden
              "
            >
              <div className="flex flex-col items-center justify-center group-hover:opacity-0 transition-all duration-200">
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 ${
                    bgMap[item.color]
                  }`}
                >
                  <Icon size={26} className={`${colorMap[item.color]}`} />
                </div>

                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {item.title}
                </h4>

                <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/95 dark:bg-gray-900/95 flex flex-col items-center justify-center text-center p-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {item.title}
                </h4>

                <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-3">
                  {item.description}
                </p>

                <button
                  onClick={() => navigate(item.path)}
                  className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all"
                >
                  Activate Service
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* TOOLS SECTION */}
      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-10 mb-3 px-2">
        Tools <hr className="border-gray-200" />
      </h4>

      {/* TOOLS GRID */}
      <div className="grid grid-cols-10 gap-4 max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 place-items-center">
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(tool.path)}
              className="
                w-full max-w-[130px] h-[124px] p-3 rounded-xl 
                bg-white dark:bg-gray-800 shadow-sm 
                hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer
                flex flex-col items-center text-center
              "
            >
              <div
                className={`w-10 h-10 mb-6 mt-3 flex items-center justify-center rounded-full ${
                  bgMap[tool.color]
                }`}
              >
                <Icon size={20} className={`${colorMap[tool.color]}`} />
              </div>

              <div className="mt-2 flex items-center justify-center h-6">
                <h6 className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {tool.title}
                </h6>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesPage;
