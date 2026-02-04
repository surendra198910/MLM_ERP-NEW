import React, { useEffect, useRef, useState } from "react";
import IconsPopUpPage from "../../components/Icons/IconsPopUpPage"; // adjust path as needed
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ApiService } from "../../../../services/ApiService";
import ColorPickerPopup from "../../components/Colors/ColorPickerPopup";
import { useSweetAlert } from "../../context/SweetAlertContext";
import ColumnSelector from "../ColumnSelector/ColumnSelector";
import SpinnerLoader from "../../../../components/UIElements/Spinner/DefaultSpinner";
import * as XLSX from "xlsx"; // Excel Export
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableSkeleton from "./TableSkeleton";
import { SmartActions } from "../Security/SmartAction";
import { useSmartyScanner } from "../../../../core/smarty/useSmartyScanner";

type Task = {
  FormCategoryId: number;
  FormCategoryName: string;
  ParentCategoryName: string;
  ModuleTitle: string;
};

const ToDoList: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [parentCategories, setParentCategories] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [openIconPopup, setOpenIconPopup] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("");
  const { universalService } = ApiService();
  const [saving, setSaving] = useState(false);
  const { ShowConfirmAlert, ShowSuccessAlert } = useSweetAlert();
  const [showTable, setShowTable] = useState(false);
  const [filterColumn, setFilterColumn] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const permissionsLoadedRef = useRef(false);
  const permissionsLoadingRef = useRef(false);
  const [smartyReady, setSmartyReady] = useState(false);

  const smartyScanReady = permissionsLoadedRef.current && (showTable || open);

  useSmartyScanner("FormCategories", [
    smartyScanReady,
    showTable,
    open,
    filterColumn,
  ]);

  const CURRENT_FORM_ID = 6;

  const canExport =
    SmartActions.canSearch(CURRENT_FORM_ID) ||
    SmartActions.canAdvancedSearch(CURRENT_FORM_ID);

  const totalPages =
    totalCount > 0 && itemsPerPage > 0
      ? Math.ceil(totalCount / itemsPerPage)
      : 1;

  const [tableLoading, setTableLoading] = useState(false);
  const [hasVisitedTable, setHasVisitedTable] = useState(false);

  const NO_FILTER = "__NONE__";
  const [columnsReady, setColumnsReady] = useState(false);
  const SKELETON_COLUMNS = 6;

  const getCellValue = (row: any, columnName: string) => row[columnName] ?? "-";

  const fetchExportData = async () => {
    const filters = getFilterPayload(filterColumn, searchQuery);

    const payload = {
      procName: "FormCategory",
      Para: JSON.stringify({
        ActionMode: "Export",
        ...filters,
        SortColumn: sortColumn,
        SortDir: sortDirection,
      }),
    };

    const response = await universalService(payload);
    const apiRes = response?.data || response;

    return Array.isArray(apiRes) ? apiRes : [];
  };

  const applySearch = () => {
    if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;

    if (!hasVisitedTable) {
      setHasVisitedTable(true);
      setShowTable(true);
      setCurrentPage(1);
      return;
    }

    setSearchQuery(searchInput.trim());
    setCurrentPage(1);
  };

  const exportCSV = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const displayedColumns = visibleColumns
      .filter((c) => c.IsVisible == 1)
      .sort((a, b) => a.DisplayOrder - b.DisplayOrder);

    const header = displayedColumns.map((c) => c.DisplayName).join(",");

    const rows = data.map((item) =>
      displayedColumns
        .map((col) => `"${getCellValue(item, col.ColumnName)}"`)
        .join(",")
    );

    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "form_categories.csv";
    a.click();
  };

  const exportExcel = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const rows = data.map((item) =>
      visibleColumns.reduce((obj, col) => {
        obj[col.DisplayName] = getCellValue(item, col.ColumnName);
        return obj;
      }, {})
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Form Categories");
    XLSX.writeFile(workbook, "form_categories.xlsx");
  };

  const exportPDF = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const doc = new jsPDF();
    const tableColumn = visibleColumns.map((c) => c.DisplayName);

    const tableRows = data.map((item) =>
      visibleColumns.map((col) => getCellValue(item, col.ColumnName))
    );

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save("form_categories.pdf");
  };

  const [iconColor, setIconColor] = useState("#1976d2"); // default color
  const [openColorPopup, setOpenColorPopup] = useState(false);
  const iconColorRef = useRef<(color: string) => void>(() => {});
  const [sortColumn, setSortColumn] = useState("FormCategoryId");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [visibleColumns, setVisibleColumns] = useState<any[]>([]);

  // const fetchVisibleColumns = async () => {
  //   try {
  //     const saved = localStorage.getItem("EmployeeDetails");
  //     const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

  //     const payload = {
  //       procName: "UniversalColumnSelector",
  //       Para: JSON.stringify({
  //         EmployeeId: employeeId,
  //         USPName: "USP_FormCategory",
  //         ActionMode: "List", // ✅ MUST MATCH LIST
  //         Mode: "Get", // optional, default anyway
  //       }),
  //     };

  //     await new Promise((res) => setTimeout(res, 400)); // 👈 ADD THIS
  //     const response = await universalService(payload);

  //     const cols = Array.isArray(response.data) ? response.data : response;

  //     setVisibleColumns(
  //       cols
  //         .filter((c) => c.IsVisible == 1)
  //         .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
  //     );
  //   } catch (err) {
  //     console.log("Column Fetch Error:", err);
  //   }
  // };

  const fetchVisibleColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

    const payload = {
      procName: "UniversalColumnSelector",
      Para: JSON.stringify({
        EmployeeId: employeeId,
        USPName: "USP_FormCategory",
        ActionMode: "List",
        Mode: "Get",
      }),
    };

    const response = await universalService(payload);
    const cols = response?.data ?? response;

    if (Array.isArray(cols)) {
      setVisibleColumns(
        cols
          .map((c) => ({
            ...c,
            IsVisible:
              c.IsVisible === true || c.IsVisible === 1 || c.IsVisible === "1",
            IsHidden:
              c.IsHidden === false || c.IsHidden === 0 || c.IsHidden === "0",
          }))
          .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
      );

      // ✅ MARK COLUMNS AS READY
      setColumnsReady(true);
    }
  };

  const displayedColumns = React.useMemo(() => {
    return visibleColumns
      .filter((c) => c.IsVisible && c.IsHidden)
      .sort((a, b) => a.DisplayOrder - b.DisplayOrder);
  }, [visibleColumns]);

  const handleDelete = async (id) => {
    const confirm = await ShowConfirmAlert(
      "Are you sure?",
      "Do you really want to delete this category?"
    );

    if (!confirm) return;

    try {
      const payload = {
        procName: "FormCategory",
        Para: JSON.stringify({
          ActionMode: "Delete",
          EditId: Number(id),
          EntryBy: 1,
        }),
      };

      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response;

      if (res?.StatusCode === "1" || res?.StatusCode === 1) {
        ShowSuccessAlert("Deleted Successfully");

        // ✅ FORCE REFRESH
        setCurrentPage(1);
        setShowTable(true);
        setHasVisitedTable(true);
        setSearchQuery("");
        await fetchTableData();
      } else {
        console.error("Delete failed:", res);
        ShowSuccessAlert("Unable to delete category");
      }
    } catch (err) {
      console.log("Delete Error:", err);
    }
  };

  const fetchTableData = async () => {
    try {
      setTableLoading(true);
      setTasks([]);

      const filters = getFilterPayload(filterColumn, searchQuery);

      const payload = {
        procName: "FormCategory",
        Para: JSON.stringify({
          ActionMode: "List",
          Start: (currentPage - 1) * itemsPerPage,
          Length: itemsPerPage,

          // SearchTerm: searchQuery || "",

          ...filters, // ⭐ THIS LINE

          SortColumn: sortColumn,
          SortDir: sortDirection,
        }),
      };

      await new Promise((res) => setTimeout(res, 400)); // 👈 ADD THIS
      const response = await universalService(payload);

      const apiRes = response?.data || response;

      if (!Array.isArray(apiRes)) return;

      if (apiRes.length > 0) {
        setTotalCount(apiRes[0].TotalRecords);
      }

      const formatted = apiRes.map((item) => ({
        FormCategoryId: item.FormCategoryId,
        FormCategoryName: item.FormCategoryName,
        ParentCategoryName: item.ParentCategoryName,
        ModuleTitle: item.ModuleTitle,

        // ✅ ICONS
        FormCategoryIcon: item.FormCategoryIcon,
        ParentCategoryIcon: item.ParentCategoryIcon,

        // ✅ ICON COLORS
        FormCategoryIconColor: item.FormCategoryIconColor,
        ParentCategoryIconColor: item.ParentCategoryIconColor,
      }));

      setTasks(formatted);
    } catch (error) {
      console.error("Menu Error:", error);
    } finally {
      setTableLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const fetchModules = async () => {
    try {
      const payload = {
        procName: "Modules",
        Para: JSON.stringify({ Action: "GetModules" }),
      };

      await new Promise((res) => setTimeout(res, 400)); // 👈 ADD THIS
      const response = await universalService(payload);

      const res = response.data ? response.data : response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (!apiRes?.ModuleList) return;

      const moduleArray = JSON.parse(apiRes.ModuleList);

      const formattedModules = moduleArray.map((m) => ({
        id: m.ModuleID,
        name: m.ModuleTitle,
      }));

      setModules(formattedModules);
    } catch (error) {
      console.log("Module fetch error:", error);
    }
  };
  const fetchEditData = async (id: number) => {
    try {
      // Guard: ensure id is provided
      if (!id) {
        console.error("fetchEditData called without id:", id);
        alert("Unable to load category data: missing id.");
        return;
      }
      // 🔁 close modal if already open
      setOpen(false);

      const payload = {
        procName: "FormCategory",
        Para: JSON.stringify({
          ActionMode: "Select",
          EditId: Number(id),
        }),
      };

      const response = await universalService(payload);
      // ✅ normalize response safely
      const data = Array.isArray(response) ? response[0] : response;

      // ❗ CRITICAL GUARD
      if (!data || !data.FormCategoryId) {
        console.error("Edit data not found:", response);
        alert("Unable to load category data. Please try again.");
        return;
      }

      const editObj = {
        id: data.FormCategoryId,
        ModuleId: data.ModuleId,
        ParentCategoryId: data.ParentCategoryId ?? "",
        title: data.FormCategoryName,
        IconName: data.Icon ?? "",
        IconColor: data.IconColor ?? "#1976d2",
      };

      // ✅ update all states
      setEditData(editObj);
      setIsEdit(true);
      setSelectedModule(editObj.ModuleId);
      setSelectedIcon(editObj.IconName);
      setIconColor(editObj.IconColor);

      // ✅ reopen modal (force remount)
      setTimeout(() => setOpen(true), 0);
    } catch (err) {
      console.error("Edit fetch failed:", err);
      alert("Something went wrong while loading data.");
    }
  };

  const openAddModal = () => {
    if (!SmartActions.canAdd(CURRENT_FORM_ID)) return;

    setIsEdit(false);
    setEditData(null);
    setSelectedIcon("");
    setIconColor("#1976d2");
    setSelectedModule("");
    setParentCategories([]);
    setOpen(true);
  };

  const fetchParentCategories = async (moduleId) => {
    try {
      const payload = {
        procName: "Modules",
        Para: JSON.stringify({
          Action: "GetParentCategoryByModuleID",
          ModuleID: moduleId,
        }),
      };

      await new Promise((res) => setTimeout(res, 400)); // 👈 ADD THIS
      const response = await universalService(payload);

      const res = response?.data ? response.data : response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (!apiRes?.FormCategoryList) {
        setParentCategories([]);
        return;
      }

      const parsed = JSON.parse(apiRes.FormCategoryList);

      const formatted = parsed.map((c) => ({
        id: c.FormCategoryId,
        name: c.FormCategoryName,
      }));

      setParentCategories(formatted);
    } catch (error) {
      console.log("Parent category fetch error:", error);
    }
  };

  const formSchema = Yup.object().shape({
    ModuleId: Yup.string().required("Module is required"),
    // ParentCategoryId: Yup.string().required("Parent Category is required"),
    CategoryName: Yup.string().required("Category Name is required"),
    // IconName: Yup.string().required("Icon is required"),
  });

  const displayedTasks = tasks; // backend already paginating

  const fetchFormPermissions = async () => {
    // 🚫 Prevent duplicate calls
    if (permissionsLoadedRef.current || permissionsLoadingRef.current) return;

    permissionsLoadingRef.current = true;

    try {
      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

      const payload = {
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "Forms",
          FormCategoryId: 5,
          EmployeeId: employeeId,
        }),
      };

      const response = await universalService(payload);
      const data = response?.data ?? response;

      if (Array.isArray(data)) {
        SmartActions.load(data);
        permissionsLoadedRef.current = true; // ✅ mark done
        setSmartyReady(true);
      }
    } finally {
      permissionsLoadingRef.current = false;
    }
  };

  useEffect(() => {
    fetchFormPermissions();
  }, []);

  useEffect(() => {
    fetchModules();
  }, []);
  useEffect(() => {
    if (isEdit && editData && modules.length > 0) {
      setSelectedModule(editData.ModuleId);
    }
  }, [modules]);

  useEffect(() => {
    if (isEdit && editData) {
      setSelectedModule(editData.ModuleId);
      setSelectedIcon(editData.IconName);
    }
  }, [editData]);
  useEffect(() => {
    if (!selectedModule) return;
    fetchParentCategories(selectedModule);
  }, [selectedModule]);
  useEffect(() => {
    if (isEdit && editData && parentCategories.length > 0) {
      setSelectedModule(editData.ModuleId);
    }
  }, [parentCategories]);

  // useEffect(() => {
  //   if (isEdit && editData && parentCategories.length > 0) {
  //     // Autofill parent category for Formik
  //     setEditData((prev) => ({
  //       ...prev,
  //       ParentCategoryId: editData.ParentCategoryId
  //     }));
  //   }
  // }, [parentCategories]);
  // 1) When clicking edit → set module, icon, parentCategoryId
  useEffect(() => {
    if (isEdit && editData) {
      setSelectedModule(editData.ModuleId);
      setSelectedIcon(editData.IconName);
      setIconColor(editData.IconColor || "#1976d2");
    }
  }, [editData]);

  // 2) After parent categories load → Formik will auto-fill ParentCategoryId automatically
  useEffect(() => {
    if (isEdit && editData && parentCategories.length > 0) {
      // nothing to update here — Formik already gets ParentCategoryId from initialValues
    }
  }, [parentCategories]);

  useEffect(() => {
    if (isEdit && editData?.IconColor) {
      setIconColor(editData.IconColor);
    }
  }, [editData]);

  useEffect(() => {
    if (!showTable || !hasVisitedTable) return;

    fetchTableData();
  }, [currentPage, itemsPerPage, searchQuery, sortColumn, sortDirection]);

  const renderColumnValue = (row: any, columnName: string) => {
    // ✅ CATEGORY NAME + ICON
    if (columnName === "FormCategoryName") {
      return (
        <div className="flex items-center gap-2">
          {row.FormCategoryIcon && (
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: row.FormCategoryIconColor || "#666" }}
            >
              {row.FormCategoryIcon}
            </span>
          )}
          <span>{row.FormCategoryName}</span>
        </div>
      );
    }

    // ✅ PARENT CATEGORY NAME + ICON
    if (columnName === "ParentCategoryName") {
      if (!row.ParentCategoryName) return "-";

      return (
        <div className="flex items-center gap-2">
          {row.ParentCategoryIcon && (
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: row.ParentCategoryIconColor || "#666" }}
            >
              {row.ParentCategoryIcon}
            </span>
          )}
          <span>{row.ParentCategoryName}</span>
        </div>
      );
    }

    // ✅ DEFAULT BEHAVIOR
    const value = row[columnName];
    if (value === true || value === 1) return "Yes";
    if (value === false || value === 0) return "No";

    return value ?? "-";
  };

  const handleSort = (column) => {
    if (!visibleColumns.some((c) => c.ColumnName === column)) return;

    setCurrentPage(1);

    if (sortColumn === column) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortColumn(column);
      setSortDirection("ASC");
    }
  };

  const getFilterPayload = (filter: string, value: string) => {
    if (!filter || !value) return {};

    return {
      FormCategoryNameFilter: filter === "FormCategoryName" ? value : null,
      ParentCategoryNameFilter: filter === "ParentCategoryName" ? value : null,
      ModuleTitleFilter: filter === "ModuleTitle" ? value : null,
    };
  };

  useEffect(() => {
    if (!visibleColumns.some((c) => c.ColumnName === sortColumn)) {
      setSortColumn("FormCategoryId");
      setSortDirection("DESC");
    }
  }, [visibleColumns]);

  useEffect(() => {
    if (!showTable) return;

    const loadInitialTable = async () => {
      setColumnsReady(false);

      // 🔐 ENSURE PERMISSIONS ARE LOADED FIRST
      if (!permissionsLoadedRef.current) {
        await fetchFormPermissions();
      }

      // 📄 Load table data
      await fetchTableData();

      // 🧩 Load column preferences
      await fetchVisibleColumns();

      setColumnsReady(true);
    };

    loadInitialTable();
  }, [showTable]);

  return (
    <>
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200">
          <div className="trezo-card-title">
            <h5 className="!mb-0">Manage Form Categories</h5>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
            {/* RIGHT GROUP: Filters + Search + Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
              {/* FILTER DROPDOWN */}
              <div className="relative group w-full sm:w-[220px]">
                {/* Tooltip */}
                <div
                  className="
        absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100
        transition-opacity whitespace-nowrap
      "
                >
                  Search By Field
                  <div
                    className="
        absolute top-full left-1/2 -translate-x-1/2
        border-4 border-transparent border-t-black
      "
                  />
                </div>

                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <i className="material-symbols-outlined text-[10px] text-gray-500 dark:text-gray-300">
                    filter_list
                  </i>
                </span>

                <select
                  value={filterColumn}
                  onChange={(e) => {
                    if (!SmartActions.canAdvancedSearch(CURRENT_FORM_ID))
                      return;
                    const value = e.target.value;

                    if (value === NO_FILTER) {
                      setFilterColumn("");
                      setSearchInput("");
                      setSearchQuery("");
                      setCurrentPage(1);
                      return;
                    }

                    setFilterColumn(value);
                    setSearchInput("");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  //               className="w-full h-[35px] text-xs rounded-md pl-[38px] pr-[14px] bg-gray-50
                  // text-black dark:bg-[#15203c] dark:text-white border dark:border-[#172036]
                  // outline-none hover:bg-gray-100 dark:hover:bg-[#1b2946] focus:border-primary-500 appearance-none"

                  className={`w-full h-[35px] text-xs rounded-md
    ${
      SmartActions.canAdvancedSearch(CURRENT_FORM_ID)
        ? "w-full h-[35px] text-xs rounded-md pl-[38px] pr-[14px] bg-gray-50 text-black dark:bg-[#15203c] dark:text-white border dark:border-[#172036]outline-none hover:bg-gray-100 dark:hover:bg-[#1b2946] focus:border-primary-500 appearance-none"
        : "w-full h-[35px] text-xs rounded-md pl-[38px] pr-[14px]  dark:bg-[#15203c] dark:text-white border dark:border-[#172036]outline-none hover:bg-gray-100 dark:hover:bg-[#1b2946] focus:border-primary-500 appearance-none bg-gray-100 text-gray-400"
    }`}
                >
                  <option value={NO_FILTER}>Select Filter Option</option>
                  <option value="FormCategoryName">Form Category Name</option>
                  <option value="ParentCategoryName">Parent Category</option>
                  <option value="ModuleTitle">Module Name</option>
                </select>

                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <i className="material-symbols-outlined text-[18px] text-gray-600 dark:text-gray-300">
                    expand_more
                  </i>
                </span>
              </div>

              {/* SEARCH INPUT */}
              <form className="relative group w-full sm:w-[220px]">
                {/* Tooltip */}
                <div
                  className="
        absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100
        transition-opacity whitespace-nowrap
      "
                >
                  Enter Criteria
                  <div
                    className="
        absolute top-full left-1/2 -translate-x-1/2
        border-4 border-transparent border-t-black
      "
                  />
                </div>

                <label className="absolute left-[13px] top-1/2 -translate-y-1/2 text-black dark:text-white">
                  <i className="material-symbols-outlined !text-[20px]">
                    search
                  </i>
                </label>

                <input
                  type="text"
                  placeholder={
                    SmartActions.canSearch(CURRENT_FORM_ID)
                      ? "Enter Criteria....."
                      : "You do not have permission to search"
                  }
                  value={searchInput}
                  disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                  onChange={(e) => {
                    if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                    setSearchInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applySearch();
                    }
                  }}
                  className={`h-[36px] text-xs rounded-md w-full block pl-[38px] pr-[13px]
    ${
      SmartActions.canSearch(CURRENT_FORM_ID)
        ? "bg-gray-50 border border-gray-50 text-black"
        : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
    }`}
                />
              </form>

              {/* BUTTONS */}
              <div className="flex items-center gap-2">
                {/* SEARCH BUTTON */}
                <div className="relative group">
                  {SmartActions.canSearch(CURRENT_FORM_ID) ? (
                    <button
                      type="button"
                      onClick={applySearch}
                      smarty-action="search"
                      className="w-[34px] h-[34px] flex items-center justify-center
      border border-primary-500 text-primary-500 rounded-md
      hover:bg-primary-500 hover:text-white transition-all"
                    >
                      <i className="material-symbols-outlined text-[20px]">
                        search
                      </i>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-[34px] h-[34px] flex items-center justify-center
      border border-gray-300 text-gray-300 rounded-md cursor-not-allowed"
                    >
                      <i className="material-symbols-outlined text-[20px]">
                        search
                      </i>
                    </button>
                  )}

                  {/* Tooltip */}
                  <div
                    className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 
      bg-black text-white text-xs px-2 py-1 rounded opacity-0
      group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    Search
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 
      border-4 border-transparent border-t-black"
                    ></div>
                  </div>
                </div>

                {filterColumn && (
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterColumn("");
                        setSearchInput("");
                        setSearchQuery("");
                        setCurrentPage(1);

                        if (showTable) {
                          fetchTableData();
                        }
                      }}
                      className="
        w-[34px] h-[34px]
        flex items-center justify-center
        border border-gray-400 text-gray-600
        rounded-md
        hover:bg-gray-200
        transition-all
      "
                    >
                      <i className="material-symbols-outlined text-[20px]">
                        refresh
                      </i>
                    </button>

                    {/* TOOLTIP */}
                    <div
                      className="
        absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100
        transition-opacity whitespace-nowrap
      "
                    >
                      Reset Filter
                      <div
                        className="
          absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black
        "
                      />
                    </div>
                  </div>
                )}

                {/* COLUMN SELECTOR BUTTON */}
                <div className="relative group" smarty-action="manage-columns">
                  {SmartActions.canManageColumns(CURRENT_FORM_ID) ? (
                    <ColumnSelector
                      procName="USP_FormCategory"
                      onApply={() => {
                        fetchVisibleColumns();
                        setCurrentPage(1);
                      }}
                    />
                  ) : (
                    <button
                      disabled
                      className="w-[34px] h-[34px] flex items-center justify-center
      border border-gray-300 text-gray-300 rounded-md cursor-not-allowed"
                    >
                      <i className="material-symbols-outlined text-[20px]">
                        view_column
                      </i>
                    </button>
                  )}

                  {/* Tooltip */}
                  <div
                    className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 
    bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 
    transition-opacity whitespace-nowrap"
                  >
                    Choose Columns
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 
      border-4 border-transparent border-t-black"
                    ></div>
                  </div>
                </div>

                {/* ADD BUTTON */}
                <div className="relative group" smarty-action="add">
                  {SmartActions.canAdd(CURRENT_FORM_ID) ? (
                    <button
                      type="button"
                      smarty-action="add"
                      onClick={openAddModal}
                      className="w-[34px] h-[34px] ml-[7px] flex items-center justify-center
      border border-primary-500 text-primary-500 rounded-md
      hover:bg-primary-500 hover:text-white transition-all"
                    >
                      <i className="material-symbols-outlined text-[20px]">
                        add
                      </i>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-[34px] h-[34px] ml-[7px] flex items-center justify-center
      border border-gray-300 text-gray-300 rounded-md cursor-not-allowed"
                    >
                      <i className="material-symbols-outlined text-[20px]">
                        add
                      </i>
                    </button>
                  )}

                  {/* Tooltip */}
                  <div
                    className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 
      bg-black text-white text-xs px-2 py-1 rounded opacity-0
      group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    Add Category
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 
      border-4 border-transparent border-t-black"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!showTable && (
          <div
            className="w-full bg-white dark:bg-[#0c1427] rounded-md border border-gray-200 
                dark:border-[#172036] p-10 flex flex-col md:flex-row 
                items-center md:items-start justify-center md:gap-x-80 min-h-[450px] "
          >
            {/* LEFT SECTION */}
            <div className="md:max-w-md md:px-3 px-0 py-14">
              <h1 className="text-3xl font-semibold text-black dark:text-white mb-4">
                Manage Forms Categories
              </h1>

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-[15px]">
                Search Form Categories data by <br />
                using above filters to edit, delete etc.
                <br />
                OR <br />
                Click below to add New Form Category.
              </p>

              {SmartActions.canAdd(CURRENT_FORM_ID) ? (
                <button
                  type="button"
                  onClick={openAddModal}
                  smarty-action="add"
                  className="px-[26.5px] py-[12px] rounded-md bg-primary-500 text-white hover:bg-primary-400"
                >
                  Add Form Category
                </button>
              ) : (
                <button
                  disabled
                  className="px-[26.5px] py-[12px] rounded-md bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  Add Form Category
                </button>
              )}
            </div>

            {/* RIGHT ILLUSTRATION */}
            <div className="hidden md:flex">
              <img
                src="https://img.icons8.com/fluency/512/search-property.png"
                alt="Illustration"
                className="w-[320px] opacity-100 select-none"
              />
            </div>
          </div>
        )}

        {showTable && (
          <div className="trezo-card-content -mx-[20px] md:-mx-[25px]">
            {tableLoading || !columnsReady ? (
              <div className="table-responsive overflow-x-auto">
                <TableSkeleton
                  rows={itemsPerPage > 10 ? 10 : itemsPerPage}
                  columns={
                    visibleColumns.length > 0
                      ? visibleColumns.length + 1
                      : SKELETON_COLUMNS
                  }
                  showExportSkeleton
                  showPageSizeSkeleton
                />
              </div>
            ) : (
              <>
                {" "}
                {/* EXPORT BUTTON BAR */}
                <div className="flex justify-between items-center px-7 py-2 mb-2">
                  {/* PAGE SIZE SELECT */}
                  <div className="relative group">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="
        h-8 w-[120px] px-3 pr-7
        text-xs font-semibold
        text-gray-600 dark:text-gray-300
        bg-transparent
        border border-gray-300 dark:border-gray-600
        rounded-md
        cursor-pointer
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-all
        appearance-none
      "
                    >
                      <option value="10">10 / page</option>
                      <option value="25">25 / page</option>
                      <option value="50">50 / page</option>
                      <option value="100">100 / page</option>
                    </select>

                    {/* DROPDOWN ICON */}
                    <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                      <i className="material-symbols-outlined text-[18px] text-gray-500">
                        expand_more
                      </i>
                    </span>

                    {/* TOOLTIP */}
                    <div
                      className="
        absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100
        transition-opacity whitespace-nowrap
      "
                    >
                      Items per page
                      <div
                        className="
          absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black
        "
                      />
                    </div>
                  </div>

                  {/* EXPORT BUTTONS */}
                  <div
                    className="flex items-center gap-2 leading-none"
                    smarty-action="export"
                  >
                    {/* PDF */}
                    <div className="relative group">
                      <button
                        type="button"
                        disabled={!canExport}
                        onClick={exportPDF}
                        className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-500
          border border-primary-500
          rounded-md
          hover:bg-primary-500 hover:text-white
          transition-all
          dark:hover:bg-gray-800 dark:hover:border-gray-600
        "
                      >
                        PDF
                      </button>

                      <div
                        className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      >
                        Export PDF
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black"
                        />
                      </div>
                    </div>

                    {/* EXCEL */}
                    <div className="relative group">
                      <button
                        type="button"
                        disabled={!canExport}
                        onClick={exportExcel}
                        className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-500
          border border-primary-500
          rounded-md
          hover:bg-primary-500 hover:text-white
          transition-all
          dark:hover:bg-gray-800 dark:hover:border-gray-600
        "
                      >
                        Excel
                      </button>

                      <div
                        className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      >
                        Export Excel
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black"
                        />
                      </div>
                    </div>

                    {/* CSV */}
                    <div className="relative group">
                      <button
                        type="button"
                        disabled={!canExport}
                        onClick={exportCSV}
                        className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-500
          border border-primary-500
          rounded-md
          hover:bg-primary-500 hover:text-white
          transition-all
          dark:hover:bg-gray-800 dark:hover:border-gray-600
        "
                      >
                        CSV
                      </button>

                      <div
                        className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      >
                        Export CSV
                        <div
                          className="absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="table-responsive overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-black dark:text-white">
                      <tr>
                        {displayedColumns.map((col) => (
                          <th
                            key={col.ColumnName}
                            onClick={() => handleSort(col.ColumnName)}
                            className={`
    font-medium ltr:text-left rtl:text-right px-[20px] py-[11px]
    whitespace-nowrap cursor-pointer transition-colors
    ${
      sortColumn === col.ColumnName
        ? "bg-primary-100 dark:bg-[#1e2a4a]"
        : "bg-primary-50 dark:bg-[#15203c]"
    }
  `}
                          >
                            <div className="flex items-center gap-1 group">
                              <span className="group-hover:text-primary-600 transition-colors">
                                {col.DisplayName}
                              </span>

                              <i
                                className={`
        material-symbols-outlined text-sm transition-all
        ${
          sortColumn === col.ColumnName
            ? "text-primary-600 dark:text-primary-400 opacity-100"
            : "text-gray-400 dark:text-gray-500 opacity-40"
        }
      `}
                              >
                                {sortDirection === "ASC"
                                  ? "arrow_drop_up"
                                  : "arrow_drop_down"}
                              </i>
                            </div>
                          </th>
                        ))}
                        <th className="px-[20px] py-[11px] text-left bg-primary-50 dark:bg-[#15203c]">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="text-black dark:text-white">
                      {displayedTasks.map((task: any) => (
                        <tr key={task.FormCategoryId}>
                          {displayedColumns.map((col) => (
                            <td
                              key={col.ColumnName}
                              className="px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]"
                            >
                              {renderColumnValue(task, col.ColumnName)}
                            </td>
                          ))}

                          <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]">
                            <div className="flex items-center gap-[9px]">
                              {/* Edit */}
                              {SmartActions.canEdit(CURRENT_FORM_ID) ? (
                                <button
                                  smarty-action="edit"
                                  onClick={() =>
                                    fetchEditData(task.FormCategoryId)
                                  }
                                  className="text-gray-500 hover:text-primary-500"
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    edit
                                  </i>
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="text-gray-300 cursor-not-allowed"
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    edit
                                  </i>
                                </button>
                              )}

                              {/* Delete */}
                              {SmartActions.canDelete(CURRENT_FORM_ID) ? (
                                <button
                                  smarty-action="delete"
                                  onClick={() =>
                                    handleDelete(task.FormCategoryId)
                                  }
                                  className="text-danger-500 hover:text-danger-700"
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    delete
                                  </i>
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="text-gray-300 cursor-not-allowed"
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    delete
                                  </i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-[20px] md:px-[25px] pt-[12px] md:pt-[14px] sm:flex sm:items-center justify-between">
                  {/* Items per page */}
                  {/* <div className="trezo-card-subtitle w-full sm:w-auto mt-[10px] sm:mt-0">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="w-[120px] h-[35px] rounded-md bg-gray-50 dark:bg-[#15203c]
              text-xs px-3 text-black dark:text-white border dark:border-[#172036]"
                    >
                      <option value="10">10 / page</option>
                      <option value="25">25 / page</option>
                      <option value="50">50 / page</option>
                      <option value="100">100 / page</option>
                    </select>
                  </div> */}

                  <p className="!mb-0 !text-sm">
                    Showing {displayedTasks.length} of {totalCount} results
                  </p>

                  {/* Page numbers */}
                  <ol className="mt-[10px] sm:mt-0 space-x-1">
                    <li className="inline-block">
                      <button
                        type="button"
                        className="w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <span className="opacity-0">0</span>
                        <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
                          chevron_left
                        </i>
                      </button>
                    </li>

                    {/* Page Numbers */}
                    {totalPages > 0 &&
                      [...Array(totalPages)].map((_, index) => (
                        <li className="inline-block" key={index}>
                          <button
                            onClick={() => handlePageChange(index + 1)}
                            className={`w-[31px] h-[31px] block rounded-md border 
                    ${
                      currentPage === index + 1
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-gray-100 dark:border-[#172036]"
                    }
                  `}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}

                    {/* Right Arrow */}
                    <li className="inline-block">
                      <button
                        type="button"
                        className="w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <span className="opacity-0">0</span>
                        <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
                          chevron_right
                        </i>
                      </button>
                    </li>
                  </ol>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add New Form Category Modal */}
        <Dialog
          open={open && SmartActions.canAdd(CURRENT_FORM_ID)}
          onClose={() => setOpen(false)}
          className="relative z-10"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
          />

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <DialogPanel
                transition
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200
data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-[550px]
data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
              >
                <div className="trezo-card w-full bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
                  {/* Header */}
                  <div
                    className="trezo-card-header bg-gray-50 dark:bg-[#15203c] mb-[20px] md:mb-[25px]
flex items-center justify-between -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px]
p-[20px] md:p-[25px] rounded-t-md"
                  >
                    <div className="trezo-card-title">
                      <h5 className="!mb-0">
                        {isEdit ? "Edit Form Category" : "Add Form Category"}
                      </h5>
                    </div>
                    <button
                      type="button"
                      className="text-[23px] transition-all leading-none text-black dark:text-white hover:text-primary-500"
                      onClick={() => setOpen(false)}
                    >
                      <i className="ri-close-fill"></i>
                    </button>
                  </div>

                  {/* Formik */}
                  <Formik
                    initialValues={{
                      ModuleId: editData ? editData.ModuleId : "",
                      ParentCategoryId: editData
                        ? editData.ParentCategoryId
                        : "",
                      CategoryName: editData ? editData.title : "",
                      IconName: editData ? editData.IconName : "",
                      IconColor: editData ? editData.IconColor : "#1976d2",
                    }}
                    enableReinitialize
                    validationSchema={formSchema}
                    onSubmit={async (values, { resetForm }) => {
                      try {
                        setSaving(true);

                        const payload = {
                          procName: "FormCategory",
                          Para: JSON.stringify({
                            ActionMode: isEdit ? "Update" : "Insert",
                            EditId:
                              isEdit && editData ? Number(editData.id) : 0,
                            ModuleId: values.ModuleId,
                            ParentCategoryId: values.ParentCategoryId || 0,
                            FormCategoryName: values.CategoryName,
                            Icon: values.IconName,
                            IconColor: values.IconColor,
                            EntryBy: 1,
                          }),
                        };

                        await new Promise((res) => setTimeout(res, 400)); // 👈 ADD THIS
                        const response = await universalService(payload);
                        const res = Array.isArray(response)
                          ? response[0]
                          : response;

                        if (res?.StatusCode === "1") {
                          ShowSuccessAlert(
                            isEdit
                              ? "Category Updated Successfully!"
                              : "Category Added Successfully!"
                          );

                          setOpen(false);
                          setCurrentPage(1); // go to first page
                          setSearchQuery(""); // clear search
                          setFilterColumn("FormCategoryName"); // reset filter
                          await fetchTableData();
                        }
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {({ values, setFieldValue }) => {
                      // assign Formik setter to ref (SAFE)
                      iconColorRef.current = (color: string) => {
                        setFieldValue("IconColor", color);
                      };
                      return (
                        <Form className="space-y-5">
                          {/* ICON POPUP */}
                          <IconsPopUpPage
                            open={openIconPopup}
                            setOpen={setOpenIconPopup}
                            onSelectIcon={(icon) => {
                              setSelectedIcon(icon); // ✅ update preview icon
                              setFieldValue("IconName", icon); // ✅ update Formik field
                            }}
                          />
                          {/* Module */}
                          <div>
                            <label className="mb-[10px] text-black dark:text-white font-medium block">
                              Select Module:
                              <span className="text-red-500">*</span>
                            </label>
                            <Field
                              as="select"
                              name="ModuleId"
                              value={values.ModuleId} // ⭐ THIS FIXES AUTOFILL
                              onChange={(e) => {
                                const value = e.target.value;
                                setFieldValue("ModuleId", value);
                                setSelectedModule(value);
                              }}
                              className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0
cursor-pointer transition-all focus:border-primary-500"
                            >
                              <option value="">Select Module</option>

                              {modules.map((mod) => (
                                <option key={mod.id} value={mod.id}>
                                  {mod.name}
                                </option>
                              ))}
                            </Field>
                            <ErrorMessage
                              name="ModuleId"
                              component="p"
                              className="text-red-500 text-sm"
                            />
                          </div>

                          {/* Parent Category */}
                          <div>
                            <label className="mb-[10px] text-black dark:text-white font-medium block">
                              Parent Category:
                            </label>

                            <Field
                              as="select"
                              name="ParentCategoryId"
                              value={values.ParentCategoryId}
                              className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0
cursor-pointer transition-all focus:border-primary-500"
                            >
                              <option value="">Select Parent Category</option>

                              {/* Show loading if module selected but data not loaded yet */}
                              {selectedModule &&
                                parentCategories.length === 0 && (
                                  <option disabled>
                                    No Parent Category Found
                                  </option>
                                )}

                              {/* Mapped categories */}
                              {parentCategories.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </Field>
                            <ErrorMessage
                              name="ParentCategoryId"
                              component="p"
                              className="text-red-500 text-sm"
                            />
                          </div>

                          {/* Category Name */}
                          <div>
                            <label className="mb-[10px] text-black dark:text-white font-medium block">
                              Category Name:
                              <span className="text-red-500">*</span>
                            </label>
                            <Field
                              type="text"
                              name="CategoryName"
                              placeholder="Enter category name"
                              className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0
transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400
focus:border-primary-500"
                            />
                            <ErrorMessage
                              name="CategoryName"
                              component="p"
                              className="text-red-500 text-sm"
                            />
                          </div>

                          {/* Category Icon */}
                          {/* <div>
                          <label className="mb-[10px] text-black dark:text-white font-medium block">
                            Category Icon:
                          </label>

                          <div className="flex items-center">
                            
                            <div
                              className="h-[55px] w-[55px] rounded-l-md border border-gray-200
dark:border-[#172036] flex items-center justify-center bg-white dark:bg-[#0c1427]"
                            >
                              <span className="material-symbols-outlined text-primary-500 text-2xl">
                                {selectedIcon}
                              </span>
                            </div>

                            <Field
                              name="IconName"
                              placeholder="Select icon"
                              className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
dark:border-[#172036] bg:white dark:bg-[#0c1427] px-[17px] block w-full outline-0
transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400
focus:border-primary-500"
                            />

                            <button
                              type="button"
                              className="h-[55px] px-[20px] min-w-[120px] bg-primary-500 text-white rounded-r-md hover:bg-primary-400"
                              onClick={() => setOpenIconPopup(true)}
                            >
                              Select Icon
                            </button>
                          </div>

                          <ErrorMessage
                            name="IconName"
                            component="p"
                            className="text-red-500 text-sm"
                          />
                        </div> */}
                          {/* Category Icon Color */}
                          <div className="mb-4">
                            <label className="mb-[10px] text-black dark:text-white font-medium block">
                              Select Icon & Color:
                            </label>

                            {/* MAIN WRAPPER */}
                            <div
                              className="
      flex flex-col sm:flex-row
      items-stretch
      border border-gray-300 dark:border-[#172036]
      rounded-md bg-white dark:bg-[#0c1427]
      overflow-hidden
      w-full
      min-h-[50px]
    "
                            >
                              {/* ICON PREVIEW */}
                              <div
                                className="
        h-[50px] w-[60px]
        flex items-center justify-center
        border-b sm:border-b-0 sm:border-r
        border-gray-300 dark:border-[#172036]
        bg-white dark:bg-[#0c1427]
      "
                              >
                                <span
                                  className="material-symbols-outlined text-3xl"
                                  style={{ color: iconColor }}
                                >
                                  {selectedIcon || "star"}
                                </span>
                              </div>

                              {/* COLOR INPUT */}
                              <Field
                                name="IconColor"
                                value={values.IconColor}
                                onChange={(e) => {
                                  setFieldValue("IconColor", e.target.value);
                                  setIconColor(e.target.value);
                                }}
                                placeholder="#1976d2"
                                className="
        flex-1 px-4 h-[50px]
        bg-transparent
        text-black dark:text-white
        placeholder-gray-500 dark:placeholder-gray-400
        outline-none
      "
                              />

                              {/* ACTION BUTTONS */}
                              <div className="flex gap-2 sm:gap-0 sm:w-[200px] w-full px-2 sm:px-0 py-2 sm:py-0">
                                {/* Icon Button */}
                                <button
                                  type="button"
                                  onClick={() => setOpenIconPopup(true)}
                                  className="
          flex-1
          bg-primary-500 text-white
          py-2 sm:py-3
          rounded-md sm:rounded-none
          font-medium text-sm
          hover:bg-primary-400
          transition
        "
                                >
                                  Icon
                                </button>

                                {/* Color Button */}
                                <button
                                  type="button"
                                  onClick={() => setOpenColorPopup(true)}
                                  className="
          flex-1
          bg-primary-500 text-white
          py-2 sm:py-3
          rounded-md sm:rounded-none sm:rounded-r-md
          font-medium text-sm
          hover:bg-primary-400
          transition
        "
                                >
                                  Color
                                </button>
                              </div>
                            </div>

                            {/* ERROR MESSAGE */}
                            <ErrorMessage
                              name="IconColor"
                              component="p"
                              className="text-red-500 text-sm mt-1"
                            />
                          </div>

                          {/* Footer */}
                          <div className="text-right mt-[20px]">
                            <button
                              type="button"
                              className="mr-[15px] px-[26.5px] py-[12px] rounded-md bg-danger-500 text-white hover:bg-danger-400"
                              onClick={() => setOpen(false)}
                            >
                              Cancel
                            </button>

                            <button
                              type="submit"
                              disabled={saving}
                              className="px-[26.5px] py-[12px] rounded-md bg-primary-500 text-white hover:bg-primary-400"
                            >
                              {saving ? (
                                <div className="flex items-center gap-2">
                                  <div className="theme-loader"></div>
                                  <span>Processing...</span>
                                </div>
                              ) : isEdit ? (
                                "Update Category"
                              ) : (
                                "Add Category"
                              )}
                            </button>
                          </div>
                        </Form>
                      );
                    }}
                  </Formik>
                </div>
              </DialogPanel>
              {/* Popup inside Formik */}
            </div>
          </div>
        </Dialog>

        <ColorPickerPopup
          open={openColorPopup}
          setOpen={setOpenColorPopup}
          value={iconColor}
          onChange={(color) => {
            setIconColor(color);
            iconColorRef.current(color);
          }}
        />
      </div>
    </>
  );
};

export default ToDoList;
