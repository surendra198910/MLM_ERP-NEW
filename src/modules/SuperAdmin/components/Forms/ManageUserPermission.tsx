import React, { useEffect, useState, useMemo, useRef } from "react";
import { ApiService } from "../../../../services/ApiService";
import { useSweetAlert } from "../../context/SweetAlertContext";
import SpinnerLoader from "../../../../components/UIElements/Spinner/DefaultSpinner";
import { useParams } from "react-router-dom";

// --- Types ---
type Module = {
  ModuleID: number;
  ModuleTitle: string;
  ModuleIcon: string;
  IsActive: boolean;
};

type Category = {
  FormCategoryId: number;
  FormCategoryName: string;
  ParentCategoryName: string | null;
  AssignedForms: number;
  TotalForms: number;
  Icon?: string;
  IconColor?: string;
};

type FormItem = {
  FormId: number;
  FormDisplayName: string;
  ActionList: string;
  Action: string;
};

type UserProfile = {
  Name: string;
  DesignationName: string;
  DepartmentName: string;
  ProfilePic: string;
  EmailId: string;
  ContactNo: string;
  EmployeeCode: string;
  Status: string;
};

// --- Reusable Toggle Component ---
const ToggleSwitch = ({
  checked,
  onChange,
  size = "md",
  colorClass = "bg-primary-500", // Default color
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
  colorClass?: string;
}) => {
  const sizeClasses =
    size === "sm"
      ? "w-9 h-5 after:h-4 after:w-4 after:top-[2px] after:left-[2px]"
      : "w-11 h-6 after:h-5 after:w-5 after:top-[2px] after:left-[2px]";

  return (
    <label className="relative inline-flex items-center cursor-pointer group">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div
        className={`${sizeClasses} bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:bg-white after:border-gray-300 after:border after:rounded-full after:transition-all after:shadow-sm ${
          checked ? colorClass : ""
        } transition-colors duration-300`}
      ></div>
    </label>
  );
};

// --- Icon Helper ---
const getModuleIcon = (iconName: string) => {
  const map: Record<string, string> = {
    Users: "group",
    Package: "inventory_2",
    Hotel: "hotel",
    Layers: "layers",
    Briefcase: "work",
    ShoppingCart: "shopping_cart",
    BookOpen: "menu_book",
    ListChecks: "checklist",
    ClipboardList: "assignment",
    Calculator: "calculate",
    Link2: "link",
    KeyRound: "vpn_key",
    Scissors: "content_cut",
    PenTool: "draw",
    Settings: "settings",
  };
  return map[iconName] || "grid_view";
};

const ManageUserPermission: React.FC = () => {
  const { universalService } = ApiService();
  const { ShowSuccessAlert } = useSweetAlert();
  const { employeeId } = useParams<{ employeeId: string }>();
  const empId = Number(employeeId);

  // --- State ---
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<number | "">("");
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [forms, setForms] = useState<FormItem[]>([]);
  const [permissions, setPermissions] = useState<Record<number, string>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- Click Outside ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsModuleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    const loadModules = async () => {
      setLoadingModules(true);
      try {
        const res = await universalService({
          procName: "Modules",
          Para: JSON.stringify({ Action: "GetAll" }),
        });
        const rows = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        if (rows[0]?.ModuleList) {
          const parsedModules: Module[] = JSON.parse(rows[0].ModuleList);
          setModules(parsedModules.filter((m) => m.IsActive));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingModules(false);
      }
    };

    const loadUserProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await universalService({
          procName: "Employee",
          Para: JSON.stringify({ ActionMode: "ProfileData", EditId: empId }),
        });
        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        if (data.length > 0) setUserProfile(data[0]);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    if (empId) loadUserProfile();
    loadModules();
  }, [empId]);

  // --- Logic ---
  const loadCategories = async (moduleId: number, silent = false) => {
    if (!silent) {
      setSelectedModule(moduleId);
      setSelectedCategory(null);
      setCategories([]);
      setForms([]);
      setPermissions({});
      setLoadingCategories(true);
      setIsModuleDropdownOpen(false);
      setCategorySearch("");
    }
    try {
      const res = await universalService({
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "Categories",
          EmployeeId: empId,
          ModuleId: moduleId,
        }),
      });
      const data = res?.data ?? res;
      if (Array.isArray(data)) {
        setCategories(data);
        if (silent && selectedCategory) {
          const updated = data.find(
            (c) => c.FormCategoryId === selectedCategory.FormCategoryId,
          );
          if (updated) setSelectedCategory(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadForms = async (category: Category) => {
    setSelectedCategory(category);
    setForms([]);
    setPermissions({});
    setLoadingForms(true);
    try {
      const res = await universalService({
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "forms",
          EmployeeId: empId,
          FormCategoryId: category.FormCategoryId,
        }),
      });
      const data = res?.data ?? res;
      if (Array.isArray(data)) {
        setForms(data);
        const state: Record<number, string> = {};
        data.forEach((f) => {
          state[f.FormId] = f.Action || "";
        });
        setPermissions(state);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingForms(false);
    }
  };

  // --- Filter and Group ---
  const groupedCategories = useMemo(() => {
    const filtered = categories.filter((c) =>
      c.FormCategoryName.toLowerCase().includes(categorySearch.toLowerCase()),
    );
    const groups: Record<string, Category[]> = {};
    filtered.forEach((cat) => {
      const parent = cat.ParentCategoryName || "General";
      if (!groups[parent]) groups[parent] = [];
      groups[parent].push(cat);
    });
    return groups;
  }, [categories, categorySearch]);

  const toggleAction = (formId: number, action: string) => {
    setPermissions((prev) => {
      const existing = prev[formId]?.split(",").filter(Boolean) || [];
      const updated = existing.includes(action)
        ? existing.filter((a) => a !== action)
        : [...existing, action];
      return { ...prev, [formId]: updated.join(",") };
    });
  };

  const toggleAllActions = (formId: number, actions: string[]) => {
    setPermissions((prev) => {
      const current = prev[formId]?.split(",").filter(Boolean) || [];
      const allEnabled = actions.every((a) => current.includes(a));
      return { ...prev, [formId]: allEnabled ? "" : actions.join(",") };
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    const payload: Record<string, string> = {};
    Object.keys(permissions).forEach((fid) => {
      payload[`action_${fid}`] = permissions[Number(fid)];
    });
    try {
      await universalService({
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "AssignForms",
          EmployeeId: empId,
          Permissions: encodeURIComponent(JSON.stringify(payload)),
          EntryBy: empId,
        }),
      });
      ShowSuccessAlert("Permissions updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 800);
      if (selectedModule) await loadCategories(Number(selectedModule), true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const currentModule = modules.find((m) => m.ModuleID === selectedModule);

  // --- Dynamic Breadcrumb ---
  const breadcrumbPath = useMemo(() => {
    if (!currentModule) return "";
    let path = currentModule.ModuleTitle;
    if (selectedCategory) {
      if (selectedCategory.ParentCategoryName) {
        path += ` > ${selectedCategory.ParentCategoryName}`;
      }
      path += ` > ${selectedCategory.FormCategoryName}`;
    }
    return path;
  }, [currentModule, selectedCategory]);

  // --- Render Components ---
  const EmptyState = ({
    message,
    icon,
    subtext,
    color = "bg-primary-100 text-primary-500",
  }: {
    message: string;
    icon: string;
    subtext?: string;
    color?: string;
  }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
      <div
        className={`w-20 h-20 ${color} rounded-full flex items-center justify-center mb-5 animate-in zoom-in duration-300`}
      >
        <i className="material-symbols-outlined text-[40px]">{icon}</i>
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
        {message}
      </h3>
      <p className="text-gray-500 text-sm max-w-sm">
        {subtext || "Select an option to proceed."}
      </p>
    </div>
  );

  return (
    <div className="mb-[25px] space-y-5">
      {/* --- HEADER SECTION --- */}
      <div className="bg-white dark:bg-[#0c1427] px-4 md:px-6 py-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#172036] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h5 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
            <span className="w-2 h-6 bg-primary-500 rounded-full inline-block"></span>
            Access Control
          </h5>
          <p className="text-xs md:text-sm text-gray-500 pl-0 sm:pl-4 mt-1">
            Configure detailed roles and permissions.
          </p>
        </div>
        <button
          onClick={savePermissions}
          disabled={!selectedCategory || saving}
          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <SpinnerLoader />
          ) : (
            <i className="material-symbols-outlined text-[20px]">save</i>
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* --- TOP GRID: SELECTION & PROFILE --- */}
      <div className="grid grid-cols-12 gap-5">
        {/* 1. Module Selector */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col">
          <div className="bg-white dark:bg-[#0c1427] rounded-xl shadow-sm border border-gray-200 dark:border-[#172036] p-5 h-full relative z-20">
            <label className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
              <i className="material-symbols-outlined text-sm">grid_view</i>
              Select Module
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  isModuleDropdownOpen
                    ? "border-primary-500 ring-2 ring-primary-500/10 bg-white dark:bg-[#15203c]"
                    : "border-gray-200 dark:border-[#172036] hover:border-primary-400 bg-gray-50 dark:bg-[#15203c]"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {loadingModules ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <SpinnerLoader /> Loading...
                    </div>
                  ) : currentModule ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                        <i className="material-symbols-outlined text-[18px]">
                          {getModuleIcon(currentModule.ModuleIcon)}
                        </i>
                      </div>
                      <span className="font-bold text-sm text-gray-800 dark:text-white truncate">
                        {currentModule.ModuleTitle}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 text-sm">
                      Choose a module...
                    </span>
                  )}
                </div>
                <i
                  className={`material-symbols-outlined text-gray-400 text-[20px] transition-transform duration-200 ${
                    isModuleDropdownOpen ? "rotate-180 text-primary-500" : ""
                  }`}
                >
                  expand_more
                </i>
              </button>

              {/* Module Dropdown List */}
              {isModuleDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-[#172036] rounded-xl shadow-xl z-50 max-h-[300px] overflow-y-auto custom-scrollbar">
                  <div className="p-2 grid grid-cols-1 gap-1">
                    {modules.map((m) => (
                      <div
                        key={m.ModuleID}
                        onClick={() => loadCategories(m.ModuleID)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border border-transparent ${
                          selectedModule === m.ModuleID
                            ? "bg-primary-50 text-primary-700 border-primary-100"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <i
                          className={`material-symbols-outlined text-[18px] ${
                            selectedModule === m.ModuleID
                              ? "text-primary-600"
                              : "text-gray-400"
                          }`}
                        >
                          {getModuleIcon(m.ModuleIcon)}
                        </i>
                        <span className="text-sm font-medium">
                          {m.ModuleTitle}
                        </span>
                        {selectedModule === m.ModuleID && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. User Profile Card */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          {loadingProfile ? (
            <div className="h-full min-h-[100px] flex items-center justify-center bg-white dark:bg-[#0c1427] rounded-xl border border-gray-200 dark:border-[#172036]">
              <SpinnerLoader />
            </div>
          ) : userProfile ? (
            <div className="h-full bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-[#172036] rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
              <div className="w-14 h-14 rounded-full border-2 border-primary-100 shadow-sm overflow-hidden flex-shrink-0">
                {userProfile.ProfilePic ? (
                  <img
                    src={`${import.meta.env.VITE_IMAGE_PREVIEW_URL}${
                      userProfile.ProfilePic
                    }`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-600 font-bold text-xl">
                    {userProfile.Name?.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                    {userProfile.Name}
                  </p>
                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                    {userProfile.EmployeeCode}
                  </span>
                </div>
                {/* <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-primary-600 font-medium mb-3">
                  <span>{userProfile.DesignationName}</span>
                  <span>{userProfile.DepartmentName}</span>
                </div> */}

                {/* --- CHIPS FOR EMAIL & PHONE --- */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
                    <i className="material-symbols-outlined text-[16px] text-blue-400">
                      mail
                    </i>
                    {userProfile.EmailId}
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
                    <i className="material-symbols-outlined text-[16px] text-green-400">
                      call
                    </i>
                    {userProfile.ContactNo}
                  </div>
                </div>
              </div>

              {breadcrumbPath && (
                <div className="hidden lg:block border-l pl-6 border-gray-200 h-12">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">
                    Editing Access For
                  </span>
                  <div className="font-semibold text-gray-700 text-sm mt-1 truncate max-w-[250px]">
                    {breadcrumbPath}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* --- MAIN SPLIT LAYOUT (RESPONSIVE) --- */}
      {/* Use flex-col for Mobile/Tablet, flex-row for Desktop */}
      <div className="flex flex-col lg:flex-row lg:h-[650px] h-auto bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-[#172036] rounded-xl overflow-hidden shadow-sm">
        {/* LEFT SIDEBAR: Categories */}
        {/* Fixed height on mobile so it doesn't take full screen, Auto height on desktop */}
        <div className="w-full lg:w-[320px] h-[300px] lg:h-auto bg-white border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-[#172036] flex flex-col">
          {/* Sidebar Header + Search */}
          <div className="p-4 border-b border-gray-200 dark:border-[#172036]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search category..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                disabled={!selectedModule}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all disabled:opacity-60"
              />
              <i className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                search
              </i>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
            {loadingCategories ? (
              <div className="h-40 flex items-center justify-center">
                <SpinnerLoader />
              </div>
            ) : !selectedModule ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Select a module to view categories.
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedCategories).length > 0 ? (
                  Object.entries(groupedCategories).map(([parent, subs]) => (
                    <div key={parent} className="mb-2">
                      {parent && parent !== "null" && (
                        <div className="px-4 py-2 text-[11px] font-bold text-primary-500 border-b border-gray-200 uppercase tracking-wider flex items-center gap-2">
                          <i className="material-symbols-outlined text-[14px]">
                            double_arrow
                          </i>
                          {parent}
                        </div>
                      )}
                      {subs.map((c) => {
                        const isSelected =
                          selectedCategory?.FormCategoryId === c.FormCategoryId;
                        return (
                          <div
                            key={c.FormCategoryId}
                            onClick={() => loadForms(c)}
                            className={`mx-3 mb-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${
                              isSelected
                                ? "bg-primary-50 text-primary-700 border border-primary-200 shadow-sm"
                                : "hover:bg-white hover:shadow-sm border border-transparent text-gray-600"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded flex items-center justify-center text-[16px] ${
                                  isSelected
                                    ? "bg-primary-100 text-primary-600"
                                    : "bg-white text-gray-400 border border-gray-100"
                                }`}
                              >
                                <i className="material-symbols-outlined">
                                  {c.Icon || "circle"}
                                </i>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold">
                                  {c.FormCategoryName}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {c.AssignedForms} forms assigned
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <i className="material-symbols-outlined text-primary-500 text-[18px]">
                                chevron_right
                              </i>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    No categories found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CONTENT: Forms Grid */}
        {/* On mobile, minimal height to show content. On desktop, flexible. */}
        <div className="flex-1 lg:h-auto h-[500px] bg-gray-50/50 dark:bg-[#0f1623] relative flex flex-col">
          {/* Header for Right Side */}
          {selectedCategory && (
            <div className="px-6 py-4 bg-white border-b border-gray-200 dark:border-[#172036] flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: selectedCategory.IconColor }}
                >
                  <i className="material-symbols-outlined text-[20px]">
                    {selectedCategory.Icon || "dns"}
                  </i>
                </div>
                <div>
                  <h6 className="text-base font-bold text-gray-800 dark:text-white leading-tight">
                    {selectedCategory.FormCategoryName}
                  </h6>
                  <p className="text-xs text-gray-500">
                    Manage individual form permissions below
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedCategory ? (
              <EmptyState
                message="Select a Category"
                icon="touch_app"
                subtext="Choose a category from the sidebar to view forms."
                color="bg-blue-100 text-blue-500"
              />
            ) : loadingForms ? (
              <div className="h-full flex flex-col items-center justify-center">
                <SpinnerLoader />
                <span className="text-gray-500 font-medium text-sm mt-4">
                  Loading Forms...
                </span>
              </div>
            ) : forms.length === 0 ? (
              <EmptyState
                message="No Forms Available"
                icon="folder_off"
                subtext="This category currently has no forms assigned."
                color="bg-orange-100 text-orange-500"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {forms.map((f) => {
                  const allowed = f.ActionList.split(",")
                    .map((a) => a.trim())
                    .filter(Boolean);
                  const assigned =
                    permissions[f.FormId]?.split(",").map((a) => a.trim()) ||
                    [];
                  const isAll =
                    allowed.length > 0 &&
                    allowed.every((a) => assigned.includes(a));

                  return (
                    <div
                      key={f.FormId}
                      className="bg-white dark:bg-[#0c1427] rounded-xl border border-gray-200 dark:border-[#172036] shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                    >
                      {/* Card Header with PURPLE Toggle */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-[#172036] flex items-center justify-between bg-gray-50/50">
                        <span
                          className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate pr-2"
                          title={f.FormDisplayName}
                        >
                          {f.FormDisplayName}
                        </span>
                        <div title="Toggle All">
                          <ToggleSwitch
                            checked={isAll}
                            onChange={() => toggleAllActions(f.FormId, allowed)}
                            colorClass="bg-purple-600" // ⭐ Main Toggle Color (Purple)
                            size="md"
                          />
                        </div>
                      </div>

                      {/* Permissions List with SKY BLUE Toggles */}
                      <div className="p-4 flex-1">
                        {allowed.length > 0 ? (
                          <div className="space-y-1">
                            {allowed.map((a) => {
                              const isChecked = assigned.includes(a);
                              return (
                                <div
                                  key={a}
                                  className="flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded transition-colors"
                                >
                                  <span className="text-sm font-medium text-gray-600 capitalize">
                                    {a}
                                  </span>
                                  {/* --- FIX: Sub-Toggle Design & Color --- */}
                                  <ToggleSwitch
                                    checked={isChecked}
                                    onChange={() => toggleAction(f.FormId, a)}
                                    colorClass="bg-sky-500" // ⭐ Sub Toggle Color (Sky Blue)
                                    size="sm"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <i className="material-symbols-outlined text-[20px] mb-1">
                              lock
                            </i>
                            <span className="text-xs font-bold uppercase">
                              Read Only
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUserPermission;
