import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { ApiService } from "../../../../services/ApiService";
import SidebarSkeleton from "./SidebarSkeleton";


interface SidebarMenuProps {
  toggleActive: () => void;
}

const parentIcons: any = {
  Dashboard: <LayoutDashboard size={18} className="text-primary-500" />,
  Master: <Settings size={18} className="text-orange-500" />,
  Employee: <Users size={18} className="text-green-500" />,
  Clients: <UserCircle size={18} className="text-blue-500" />,
  Company: <Building2 size={18} className="text-purple-500" />,
  "Product/Service": <ShoppingCart size={18} className="text-yellow-500" />,
  Reports: <FileSearch size={18} className="text-pink-500" />,
  Default: <LayoutDashboard size={18} className="text-gray-500" />,
};

const SidebarMenu: React.FC<SidebarMenuProps> = ({ toggleActive }) => {
  const { pathname } = useLocation();
  const [menuList, setMenuList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  // ⭐ Separate toggle state for EACH menu item
  const [parentOpenState, setParentOpenState] = useState<
    Record<string, boolean>
  >({});
  const [childOpenState, setChildOpenState] = useState<Record<string, boolean>>(
    {}
  );

  const { universalService } = ApiService();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await universalService({
          procName: "GetMenuByModule",
          Para: JSON.stringify({}),
        });

        const res = response.data ? response.data : response;

        const combinedJson = res
          .map((row: any) => row["JSON_F52E2B61-18A1-11d1-B105-00805F49916B"])
          .join("");

        if (!combinedJson) return;

        const parsedMenu = JSON.parse(combinedJson);

        const cleaned = parsedMenu.map((item: any) => ({
          ...item,
          Forms: item.Forms ? JSON.parse(item.Forms) : [],
          Children: item.Children ? JSON.parse(item.Children) : [],
        }));

        setMenuList(cleaned);
       } catch (error) {
      console.error("Menu Error:", error);
    } finally {
      setLoading(false);   
    }
    };

    fetchMenu();
  }, []);

  // ⭐ Toggle Parent
  const toggleParent = (key: string) => {
    setParentOpenState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ⭐ Toggle Child
  const toggleChild = (key: string) => {
    setChildOpenState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const slug = (text: string) => text.trim().replace(/\s+/g, "-").toLowerCase();

  const makePath = (parent: string, form: string) =>
  parent
    ? `/superadmin/${parent}/${form}`
    : `/superadmin/${form}`;


  // If category is "Master", it should NOT appear in the URL
const normalizeParent = (name: string) =>
  name.trim().toLowerCase() === "master" ? "" : slug(name);


  const RenderMenu = ({ item, parentPath = "", level = 0 }: any) => {
    const key = `${item.FormCategoryId}-${item.FormCategoryName}`;

    const isOpen = childOpenState[key] || false;

    const current = normalizeParent(item.FormCategoryName);

const fullPath =
  parentPath && parentPath.length > 0
    ? `${parentPath}/${current}`
    : current;


    const hasSubMenu =
      (item.Children?.length || 0) > 0 || (item.Forms?.length || 0) > 0;

    return (
      <div className="mt-1">
        {/* Toggle */}
        <div
          onClick={() => hasSubMenu && toggleChild(key)}
          className={`flex justify-between items-center cursor-pointer px-2 py-2 
        ${level > 0 ? "ml-3" : ""}`}
        >
          <span>{item.FormCategoryName}</span>
          {hasSubMenu && (isOpen ? <ChevronUp /> : <ChevronDown />)}
        </div>

        {isOpen && (
          <div className="ml-5 space-y-1">
            {/* Forms */}
            {item.Forms?.map((form: any) => (
              <Link
                key={form.FormId}
              to={makePath(fullPath, slug(form.FormDisplayName))}
                className="block py-2 px-3 text-xs"
              >
                {form.FormDisplayName}
              </Link>
            ))}

            {/* Children Recursion */}
            {item.Children?.map((child: any) => (
              <RenderMenu
                key={child.FormCategoryId}
                item={child}
                parentPath={fullPath}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar-area bg-white dark:bg-[#0c1427] fixed z-[7] top-0 w-[270px] h-screen transition-all rounded-r-md shadow-lg">
      {/* Logo */}
      <div className="logo bg-white dark:bg-[#0c1427] border-b border-gray-100 dark:border-[#172036] px-6 py-4 flex items-center justify-between">
        <Link to="/superadmin" className="flex items-center">
          <img src="/images/logo-icon.svg" alt="logo" width={26} height={26} />
          <span className="font-bold text-black dark:text-white ml-3 text-lg">
            Sysfo Super Admin
          </span>
        </Link>
      </div>

      {/* Menu */}
      <div className="pt-4 px-4 pb-28 h-screen overflow-y-scroll sidebar-custom-scrollbar">
         {loading ? (
    <div className="flex justify-center items-center h-full">
      <SidebarSkeleton />  {/* ⭐ Your Loader Here */}
    </div>
  ) : (
    <>
        <span className="block font-medium uppercase text-gray-400 mb-3 text-xs">
          MAIN MENU
        </span>

        <ul className="space-y-2">
          {menuList.map((category) => {
            const parentKey = `${category.FormCategoryId}-${category.FormCategoryName}`;
            const isParentOpen = parentOpenState[parentKey];

            const hasForms = category.Forms.length > 0;
            const hasChildren = category.Children.length > 0;
            const hasDropdown = hasForms || hasChildren;

            const icon =
              parentIcons[category.FormCategoryName] || parentIcons.Default;
            const fullParent = normalizeParent(category.FormCategoryName);


            return (
              <li key={parentKey}>
                {/* Parent Item */}
                <div
                  className="flex justify-between items-center cursor-pointer px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#182235]"
                  onClick={() => hasDropdown && toggleParent(parentKey)}
                >
                  <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                      {category.FormCategoryName}
                    </span>
                  </div>

                  {hasDropdown &&
                    (isParentOpen ? (
                      <ChevronUp size={17} />
                    ) : (
                      <ChevronDown size={17} />
                    ))}
                </div>

                {/* Parent Dropdown */}
                {isParentOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    {/* Parent Forms */}
                    {category.Forms.map((form: any) => (
                      <Link
                        key={form.FormId}
                       to={makePath(normalizeParent(category.FormCategoryName), slug(form.FormDisplayName))}
                        className="block py-2 px-3 rounded-md text-sm hover:bg-primary-50 hover:text-primary-600"
                      >
                        {form.FormDisplayName}
                      </Link>
                    ))}

                    {/* Recursive Children */}
                    {category.Children.map((child: any) => (
                      <RenderMenu
                        key={child.FormCategoryId}
                        item={child}
                        parentPath={fullParent}
                        level={1}
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        </> )}
      </div>
    </div>
  );
};

export default SidebarMenu;
