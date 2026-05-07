import React, { useEffect, useState, useMemo, useRef } from "react";

import Swal from "sweetalert2";
import { ApiService } from "../../../../../services/ApiService";
import { useSweetAlert } from "../../../context/SweetAlertContext";

// --- Types ---
type LoginTypeItem = {
  LoginTypeId: number;
  LoginType: string;
  Status: string;
  TotalCount?: number;
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

// --- Reusable Toggle Component ---
const ToggleSwitch = ({
  checked,
  onChange,
  size = "md",
  colorClass = "bg-primary-500",
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
        className={`${sizeClasses} bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:bg-white after:border-gray-300 dark:after:border-gray-500 after:border after:rounded-full after:transition-all after:shadow-sm ${
          checked ? colorClass : ""
        } transition-colors duration-300`}
      ></div>
    </label>
  );
};

const ManageLoginType: React.FC = () => {
  const { universalService } = ApiService();
  const { ShowSuccessAlert } = useSweetAlert();

  // Assuming standard context IDs
  const companyId = 1;
  const entryBy = 1;

  // --- State ---
  const [loginTypes, setLoginTypes] = useState<LoginTypeItem[]>([]);
  const [selectedLoginTypeId, setSelectedLoginTypeId] = useState<number | "">(
    "",
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const [forms, setForms] = useState<FormItem[]>([]);
  const [permissions, setPermissions] = useState<Record<number, string>>({});

  // Loading States
  const [loadingLoginTypes, setLoadingLoginTypes] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blockingId, setBlockingId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"insert" | "update">("insert");
  const [editLoginTypeId, setEditLoginTypeId] = useState<number>(0);
  const [loginTypeInput, setLoginTypeInput] = useState("");
  const [savingModal, setSavingModal] = useState(false);

  // --- Click Outside for Dropdown ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    loadLoginTypes();
  }, []);

  const loadLoginTypes = async () => {
    setLoadingLoginTypes(true);
    try {
      const res = await universalService({
        procName: "LoginTypes",
        Para: JSON.stringify({ ActionMode: "selectAll", CompanyId: companyId }),
      });
      const data = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      setLoginTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLoginTypes(false);
    }
  };

  // --- Main Logic ---
  const handleSelectLoginType = (id: number) => {
    setSelectedLoginTypeId(id);
    setIsDropdownOpen(false);
    loadCategories(id);
  };

  const loadCategories = async (ltId: number, silent = false) => {
    if (!silent) {
      setSelectedCategory(null);
      setCategories([]);
      setForms([]);
      setPermissions({});
      setLoadingCategories(true);
      setCategorySearch("");
    }
    try {
      const res = await universalService({
        procName: "LoginTypes",
        Para: JSON.stringify({
          ActionMode: "Categories",
          LoginTypeId: ltId,
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
    if (!selectedLoginTypeId) return;
    setSelectedCategory(category);
    setForms([]);
    setPermissions({});
    setLoadingForms(true);
    try {
      const res = await universalService({
        procName: "LoginTypes",
        Para: JSON.stringify({
          ActionMode: "forms",
          LoginTypeId: selectedLoginTypeId,
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

  // --- Actions ---
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
    if (!selectedLoginTypeId) return;
    setSaving(true);
    const payload: Record<string, string> = {};
    Object.keys(permissions).forEach((fid) => {
      payload[`form_${fid}`] = permissions[Number(fid)];
    });

    if (Object.keys(payload).length === 0) {
      Swal.fire("Notice", "No permissions to save.", "info");
      setSaving(false);
      return;
    }

    try {
      const res = await universalService({
        procName: "LoginTypes",
        Para: JSON.stringify({
          ActionMode: "AssignForms",
          LoginTypeId: selectedLoginTypeId,
          Permissions: encodeURIComponent(JSON.stringify(payload)),
          EntryBy: entryBy,
        }),
      });
      const msg =
        res?.data?.[0]?.msg ||
        res?.[0]?.msg ||
        "Permissions updated successfully!";

      await Swal.fire({
        title: "Success",
        text: msg,
        icon: "success",
        confirmButtonColor: "#6366F1",
      });

      if (selectedLoginTypeId)
        await loadCategories(Number(selectedLoginTypeId), true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!currentLoginType) return;
    const isCurrentlyActive = currentLoginType.Status === "Active";
    const actionText = isCurrentlyActive ? "Block" : "Unblock";
    const newStatus = isCurrentlyActive ? "Blocked" : "Active";

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to ${actionText.toLowerCase()} this Login Type?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: `Yes, ${actionText} it!`,
    });

    if (result.isConfirmed) {
      setBlockingId(Number(selectedLoginTypeId));

      try {
        await universalService({
          procName: "LoginTypes",
          Para: JSON.stringify({
            ActionMode: "blockLoginType",
            LoginTypeId: selectedLoginTypeId,
            Status: newStatus,
            EntryBy: entryBy,
          }),
        });

        await loadLoginTypes();

        Swal.fire("Success!", `${actionText}ed successfully.`, "success");
      } catch (err) {
        console.error(err);
      } finally {
        setBlockingId(null);
      }
    }
  };

  // --- Modal Logic ---
  const openModalForAdd = () => {
    setModalAction("insert");
    setLoginTypeInput("");
    setEditLoginTypeId(0);
    setIsModalOpen(true);
  };

  const openModalForEdit = (lt: LoginTypeItem) => {
    setModalAction("update");
    setLoginTypeInput(lt.LoginType);
    setEditLoginTypeId(lt.LoginTypeId);
    setIsModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!loginTypeInput.trim()) {
      Swal.fire("Error", "Login Type name is required", "error");
      return;
    }
    setSavingModal(true);
    try {
      const res = await universalService({
        procName: "LoginTypes",
        Para: JSON.stringify({
          ActionMode: modalAction,
          LoginTypeId: editLoginTypeId,
          CompanyId: companyId,
          LoginType: loginTypeInput,
          EntryBy: entryBy,
        }),
      });

      const statusCode = res?.data?.[0]?.StatusCode || res?.[0]?.StatusCode;
      const msg = res?.data?.[0]?.msg || res?.[0]?.msg;

      if (statusCode === "0") {
        Swal.fire("Warning", msg || "Already exists", "warning");
      } else {
        Swal.fire("Success", msg || "Saved successfully", "success");
        setLoginTypeInput("");
        if (modalAction === "insert") {
          setModalAction("insert");
        }
        await loadLoginTypes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingModal(false);
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

  const currentLoginType = loginTypes.find(
    (lt) => lt.LoginTypeId === selectedLoginTypeId,
  );

  const breadcrumbPath = useMemo(() => {
    if (!currentLoginType) return "";
    let path = currentLoginType.LoginType;
    if (selectedCategory) {
      if (selectedCategory.ParentCategoryName) {
        path += ` > ${selectedCategory.ParentCategoryName}`;
      }
      path += ` > ${selectedCategory.FormCategoryName}`;
    }
    return path;
  }, [currentLoginType, selectedCategory]);

  return (
    <div className="mb-[25px] space-y-5 dark:text-gray-100 relative">
      {/* --- HEADER SECTION --- */}
      <div className="bg-white dark:bg-[#0c1427] px-4 md:px-6 py-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#172036]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col text-center sm:text-left">
            <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
              <span className="w-2 h-6 bg-primary-500 rounded-full inline-block"></span>
              Manage Login Types
            </div>
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure permissions and manage custom roles.
            </div>
          </div>

          <div className="flex justify-center sm:justify-end gap-3">
            <button
              onClick={openModalForAdd}
              className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <i className="material-symbols-outlined text-[20px]">add</i>
              <span className="hidden sm:inline">Add Role</span>
            </button>
            <button
              onClick={savePermissions}
              disabled={!selectedCategory || saving}
              className="min-w-[160px] px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-sm font-semibold rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></span>
                </div>
              ) : (
                <i className="material-symbols-outlined text-[20px]">save</i>
              )}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- TOP GRID: SELECTION & PROFILE --- */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col">
          <div className="bg-white dark:bg-[#0c1427] rounded-xl shadow-sm border border-gray-200 dark:border-[#172036] p-5 h-full relative z-20">
            <div className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <i className="material-symbols-outlined text-sm">
                admin_panel_settings
              </i>
              Select Login Type
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                  isDropdownOpen
                    ? "border-primary-500 ring-2 ring-primary-500/10 bg-white dark:bg-gray-800"
                    : "border-gray-200 dark:border-[#172036] hover:border-primary-400 bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {loadingLoginTypes ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      Loading...
                    </div>
                  ) : currentLoginType ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                        <span className="font-bold">
                          {currentLoginType.LoginType.charAt(0)}
                        </span>
                      </div>
                      <span className="font-bold text-sm text-gray-800 dark:text-white truncate">
                        {currentLoginType.LoginType}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      Choose a role...
                    </span>
                  )}
                </div>
                <i
                  className={`material-symbols-outlined text-gray-400 dark:text-gray-500 text-[20px] transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180 text-primary-500" : ""
                  }`}
                >
                  expand_more
                </i>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-3 bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-[#172036] rounded-2xl shadow-2xl z-20 max-h-[360px] overflow-y-auto animate-in fade-in zoom-in duration-150 custom-scrollbar">
                  <div className="p-2 space-y-1">
                    {loginTypes.map((lt) => {
                      const isSelected = selectedLoginTypeId === lt.LoginTypeId;
                      return (
                        <div
                          key={lt.LoginTypeId}
                          onClick={() => handleSelectLoginType(lt.LoginTypeId)}
                          className={`group relative flex flex-col gap-1 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-[#15203c] ${
                            isSelected
                              ? "bg-primary-50 dark:bg-gray-800/80 border border-primary-200 dark:border-gray-700"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-primary-500"></span>
                          )}
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-primary-50 dark:group-hover:bg-gray-700"
                              }`}
                            >
                              <span className="font-bold text-sm uppercase">
                                {lt.LoginType.charAt(0)}
                              </span>
                            </div>
                            <div className="flex flex-col overflow-hidden ">
                              <span
                                className={`text-sm font-semibold truncate ${
                                  isSelected
                                    ? "text-primary-700 dark:text-white"
                                    : "text-gray-800 dark:text-gray-200"
                                }`}
                              >
                                {lt.LoginType}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                Status: {lt.Status}
                              </span>
                            </div>
                            {isSelected && (
                              <span className="ml-auto w-2 h-2 rounded-full bg-primary-500"></span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-8 lg:col-span-9">
          {currentLoginType ? (
            <div className="h-full bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-[#172036] rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
              <div className="w-14 h-14 rounded-full border-2 border-primary-100 bg-primary-50 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 text-primary-600 font-bold text-2xl uppercase">
                {currentLoginType.LoginType.charAt(0)}
              </div>

              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                    {currentLoginType.LoginType}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      currentLoginType.Status === "Active"
                        ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                    }`}
                  >
                    {currentLoginType.Status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                  <button
                    onClick={handleBlockToggle}
                    disabled={blockingId === currentLoginType.LoginTypeId}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all ${
                      currentLoginType.Status === "Active"
                        ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:hover:bg-red-900/40"
                        : "bg-green-50 text-green-600 border-green-100 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/40"
                    }`}
                  >
                    {blockingId === currentLoginType.LoginTypeId ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <i className="material-symbols-outlined text-[16px]">
                        {currentLoginType.Status === "Active"
                          ? "lock"
                          : "lock_open"}
                      </i>
                    )}{" "}
                    {currentLoginType.Status === "Active"
                      ? "Block Role"
                      : "Unblock Role"}
                  </button>
                </div>
              </div>

              {breadcrumbPath && (
                <div className="hidden lg:block border-l pl-6 border-gray-200 dark:border-gray-700 h-12">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                    Editing Access For
                  </span>
                  <div className="font-semibold text-gray-700 dark:text-gray-200 text-sm mt-1 truncate max-w-[250px]">
                    {breadcrumbPath}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[100px] flex items-center justify-center bg-white dark:bg-[#0c1427] rounded-xl border border-gray-200 dark:border-[#172036] text-gray-400 text-sm">
              Select a Login Type to view details.
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN SPLIT LAYOUT --- */}
      <div className="flex flex-col lg:flex-row lg:h-[650px] h-auto bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-[#172036] rounded-xl overflow-hidden shadow-sm">
        {/* LEFT SIDEBAR: Categories */}
        <div className="w-full lg:w-[320px] h-[300px] lg:h-auto bg-white dark:bg-[#0c1427] border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-[#172036] flex flex-col">
          <div className="p-4 border-b pb-5 border-gray-200 dark:border-[#172036]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search category..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                disabled={!selectedLoginTypeId}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all disabled:opacity-60"
              />
              <i className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-[18px]">
                search
              </i>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-[#0f1623]">
            {loadingCategories ? (
              <div className="h-40 flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></span>
                </div>
              </div>
            ) : !selectedLoginTypeId ? (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                Select a Login Type to view categories.
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedCategories).length > 0 ? (
                  Object.entries(groupedCategories).map(([parent, subs]) => (
                    <div key={parent} className="mb-2">
                      {parent && parent !== "null" && (
                        <div className="px-4 py-2 text-[11px] font-bold text-primary-500 border-b border-gray-200 dark:border-[#172036] uppercase tracking-wider flex items-center gap-2">
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
                                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800 shadow-sm"
                                : "hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm border border-transparent text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded flex items-center justify-center text-[16px] ${
                                  isSelected
                                    ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
                                    : "bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-700"
                                }`}
                              >
                                <i className="material-symbols-outlined">
                                  {c.Icon || "folder"}
                                </i>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold">
                                  {c.FormCategoryName}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {c.AssignedForms} forms assigned
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <i className="material-symbols-outlined text-primary-500 dark:text-primary-400 text-[18px]">
                                chevron_right
                              </i>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                    No categories found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CONTENT: Forms Grid */}
        <div className="flex-1 lg:h-auto h-[500px] bg-gray-50/50 dark:bg-[#0f1623] relative flex flex-col">
          {selectedCategory && (
            <div className="px-6 py-3 bg-white dark:bg-[#0c1427] border-b border-gray-200 dark:border-[#172036] flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center text-white shadow-md">
                  <i className="material-symbols-outlined text-[20px]">
                    {selectedCategory.Icon || "dns"}
                  </i>
                </div>
                <div>
                  <div className="text-base font-bold text-gray-800 dark:text-white leading-tight">
                    {selectedCategory.FormCategoryName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Manage individual form permissions below
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {!selectedCategory ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-5 animate-in zoom-in duration-300">
                  <i className="material-symbols-outlined text-[40px]">
                    touch_app
                  </i>
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Select a Category
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                  Choose a category from the sidebar to view forms.
                </div>
              </div>
            ) : loadingForms ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></span>
                </div>
                <span className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-4">
                  Loading Forms...
                </span>
              </div>
            ) : forms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center mb-5 animate-in zoom-in duration-300">
                  <i className="material-symbols-outlined text-[40px]">
                    folder_off
                  </i>
                </div>
                <div className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  No Forms Available
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                  This category currently has no forms assigned.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {forms.map((f) => {
                  const allowed = f.ActionList
                    ? f.ActionList.split(",")
                        .map((a) => a.trim())
                        .filter(Boolean)
                    : [];
                  const assigned = permissions[f.FormId]
                    ? permissions[f.FormId]
                        .split(",")
                        .map((a) => a.trim())
                        .filter(Boolean)
                    : [];
                  const isAll = assigned.length > 0;

                  return (
                    <div
                      key={f.FormId}
                      className="bg-white dark:bg-[#0c1427] rounded-xl border border-gray-200 dark:border-[#172036] shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-[#172036] flex items-center justify-between bg-gray-50/50 dark:bg-[#0f1623]">
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
                            colorClass="bg-purple-600"
                            size="md"
                          />
                        </div>
                      </div>

                      <div className="p-4 flex-1">
                        {allowed.length > 0 ? (
                          <div className="space-y-1">
                            {allowed.map((a) => {
                              const isChecked = assigned.includes(a);
                              return (
                                <div
                                  key={a}
                                  className="flex items-center justify-between py-2.5 border-b border-dashed border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 rounded transition-colors"
                                >
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                                    {a}
                                  </span>
                                  <ToggleSwitch
                                    checked={isChecked}
                                    onChange={() => toggleAction(f.FormId, a)}
                                    colorClass="bg-sky-500"
                                    size="sm"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 rounded-lg dark:bg-gray-800 dark:border-gray-700 border border-dashed border-gray-200">
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

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1427] border border-gray-200 dark:border-[#172036] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-[#172036] flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {modalAction === "insert"
                  ? "Add New Login Type"
                  : "Edit Login Type"}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <i className="material-symbols-outlined">close</i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Login Type Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    placeholder="Enter Role Name (e.g., Manager)"
                    value={loginTypeInput}
                    onChange={(e) => setLoginTypeInput(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSaveModal}
                    disabled={savingModal}
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold shadow-md flex items-center gap-2 transition-all"
                  >
                    {savingModal && (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"></span>
                      </div>
                    )}
                    {modalAction === "insert" ? "Save Role" : "Update Role"}
                  </button>
                </div>
              </div>

              {/* Quick Listing Table Inside Modal (Mimicking original functionality) */}
              <div className="mt-8 border-t border-gray-100 dark:border-[#172036] pt-6">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Existing Roles
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-[#172036] overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-[#172036] uppercase text-xs font-bold text-gray-500">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Login Type</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#172036]">
                      {loginTypes.map((lt) => (
                        <tr
                          key={lt.LoginTypeId}
                          className="hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-medium">
                            {lt.LoginTypeId}
                          </td>
                          <td className="px-4 py-2.5">{lt.LoginType}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${lt.Status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                            >
                              {lt.Status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => openModalForEdit(lt)}
                              className="text-primary-500 hover:text-primary-700 p-1 bg-primary-50 dark:bg-primary-900/20 rounded"
                            >
                              <i className="material-symbols-outlined text-[16px] block">
                                edit
                              </i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {loginTypes.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-4 text-gray-400"
                          >
                            No Login Types Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLoginType;
