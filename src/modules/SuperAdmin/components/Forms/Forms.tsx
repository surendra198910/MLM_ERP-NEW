import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ApiService } from "../../../../services/ApiService";
import { useSweetAlert } from "../../context/SweetAlertContext";
import ColumnSelector from "../ColumnSelector/ColumnSelector";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableSkeleton from "./TableSkeleton";
import { SmartActions } from "../Security/SmartAction";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import Pagination from "../../common/Pagination";
import { formatDate } from "../../../../utils/dateFormatter";
import AccessRestricted from "../../common/AccessRestricted";
import Loader from "../../common/Loader";

type Task = {
  FormId: number;
  ModuleId: number;
  FormCategoryId: number;

  ModuleTitle: string;
  FormCategoryName: string;
  FormDisplayName: string;
  FormNameWithExt: string;
  ActionList: string;
  HasEmailSending: boolean;
  ShowInMenu: boolean;
};

const FormSchema = Yup.object().shape({
  module: Yup.string().required("Module is required"),
  parentCategory: Yup.string().required("Parent category is required"),
  formDisplayName: Yup.string().required("Form display name is required"),
  // formName: Yup.string().required("Form name is required"),
  actionList: Yup.array().min(1, "At least one action is required"),
  emailSending: Yup.boolean(),
  showInMenu: Yup.boolean(),
});

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
  const [editData, setEditData] = useState<Task | null>(null);
  const { universalService } = ApiService();
  const [saving, setSaving] = useState(false);
  const { ShowConfirmAlert, ShowSuccessAlert } = useSweetAlert();
  const [showTable, setShowTable] = useState(false);
  const [filterColumn, setFilterColumn] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const [tableLoading, setTableLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState("FormId");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [columnsReady, setColumnsReady] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
const [hasPageAccess, setHasPageAccess] = useState(true);


  // 👉 Columns that should be treated as dates
  const DATE_COLUMNS = ["CreatedDate", "ModifiedDate"];

  const CURRENT_FORM_ID = 5;

  const NO_FILTER = "__NONE__";

  const ALLOWED_SORT_COLUMNS = [
    "FormId",
    "FormDisplayName",
    "FormCategoryName",
    "ModuleTitle",
    "FormNameWithExt",
    "ActionList",
    "HasEmailSending",
    "ShowInMenu",
  ];

  const getCellValue = (task: any, columnName: string) => {
    const value = task[columnName];

    // 🔥 Date formatting for exports
    if (DATE_COLUMNS.includes(columnName)) {
      return formatDate(value, "readable");
    }

    return value ?? "-";
  };

 const fetchFormPermissions = async () => {
  try {
    setPermissionsLoading(true);

    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

    const payload = {
      procName: "AssignForm",
      Para: JSON.stringify({
        ActionMode: "Forms",
        FormCategoryId: 5, // 👈 category for this page
        EmployeeId: employeeId,
      }),
    };

    const response = await universalService(payload);
    const data = response?.data ?? response;

    // ❌ Invalid or empty response → deny access
    if (!Array.isArray(data)) {
      setHasPageAccess(false);
      return;
    }

    // 🔍 Find permission for THIS form/page
    const pagePermission = data.find(
      (p) =>
        Number(p.FormId) === CURRENT_FORM_ID &&
        Number(p.FormCategoryId) === 5
    );

    // ❌ No permission OR empty Action
    if (
      !pagePermission ||
      !pagePermission.Action ||
      pagePermission.Action.trim() === ""
    ) {
      setHasPageAccess(false);
      return;
    }

    // ✅ Permission allowed → load SmartActions
    SmartActions.load(data);
    setHasPageAccess(true);
  } catch (error) {
    console.error("Form permission fetch failed:", error);
    setHasPageAccess(false);
  } finally {
    setPermissionsLoading(false);
  }
};
 

  const fetchExportData = async () => {
    const filters = getFilterPayload(filterColumn, searchQuery);
    const payload = {
      procName: "Forms",
      Para: JSON.stringify({
        ActionMode: "Export",
        ...filters,
        SortColumn: sortColumn,
        SortDir: sortDirection,
      }),
    };

    await new Promise((res) => setTimeout(res, 400));
    const response = await universalService(payload);
    const apiRes = response?.data || response;
    if (!Array.isArray(apiRes)) return [];

    return apiRes.map((item: any) => ({
      FormId: item.FormId,
      ModuleTitle: item.ModuleTitle,
      FormCategoryName: item.FormCategoryName,
      FormDisplayName: item.FormDisplayName,
      FormNameWithExt: item.FormNameWithExt,
      ActionList: item.ActionList,
      HasEmailSending: item.HasEmailSending,
      ShowInMenu: item.ShowInMenu,
    }));
  };

  const applySearch = () => {
    if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;

    setShowTable(true);
    setCurrentPage(1);

    setSearchQuery(searchInput.trim());

    setSearchTrigger((prev) => prev + 1);
  };

  const exportCSV = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const header = displayedColumns.map((c) => c.DisplayName).join(",");

    const rows = data.map((item: any) =>
      displayedColumns
        .map((col) => `"${getCellValue(item, col.ColumnName)}"`)
        .join(","),
    );

    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forms.csv";
    a.click();
  };

  const exportExcel = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const rows = data.map((item: any) =>
      displayedColumns.reduce((obj: any, col) => {
        obj[col.DisplayName] = getCellValue(item, col.ColumnName);
        return obj;
      }, {}),
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Form Categories");
    XLSX.writeFile(workbook, "forms.xlsx");
  };

  const exportPDF = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const doc = new jsPDF();
    const tableColumn = displayedColumns.map((c) => c.DisplayName);
    const tableRows = data.map((item: any) =>
      displayedColumns.map((col) => getCellValue(item, col.ColumnName)),
    );

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save("forms.pdf");
  };

  const printTable = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHeaders = displayedColumns
      .map((c) => `<th>${c.DisplayName}</th>`)
      .join("");

    const tableRows = data
      .map(
        (row: any) => `
        <tr>
          ${displayedColumns
            .map(
              (col) =>
                `<td>${col.ColumnName === "ActionList"
                  ? (row.ActionList ?? "-")
                  : getCellValue(row, col.ColumnName)
                }</td>`,
            )
            .join("")}
        </tr>
      `,
      )
      .join("");

    printWindow.document.write(`
    <html>
      <head>
        <title>Print Forms</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h2 {
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #1976d2;
            color: white;
          }
        </style>
      </head>
      <body>
        <h2>Forms</h2>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const fetchVisibleColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

    const payload = {
      procName: "UniversalColumnSelector",
      Para: JSON.stringify({
        EmployeeId: employeeId,
        USPName: "USP_Forms",
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
          .sort((a, b) => a.DisplayOrder - b.DisplayOrder),
      );

      setColumnsReady(true);
    }
  };

  const displayedColumns = React.useMemo(() => {
    return visibleColumns
      .filter((c) => c.IsVisible && c.IsHidden)
      .sort((a, b) => a.DisplayOrder - b.DisplayOrder);
  }, [visibleColumns]);

  const handleDelete = async (formId: number) => {
    const result = await ShowConfirmAlert("Are you sure?");
    if (!result) return;
    try {
      const payload = {
        procName: "Forms",
        Para: JSON.stringify({
          ActionMode: "Delete",
          EditId: Number(formId),
          EntryBy: 1,
        }),
      };

      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response;

      if (res?.StatusCode === "1" || res?.StatusCode === 1) {
        ShowSuccessAlert("Form deleted successfully");
        setCurrentPage(1);
        await fetchTableData();
      } else {
        console.error("Delete failed:", res);
        ShowSuccessAlert("Unable to delete form");
      }
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const fetchTableData = async () => {
    try {
      setTableLoading(true);
      setTasks([]);

      const filters = getFilterPayload(filterColumn, searchQuery);
      const payload = {
        procName: "Forms",
        Para: JSON.stringify({
          ActionMode: "List",
          Start: (currentPage - 1) * itemsPerPage,
          Length: itemsPerPage,
          ...filters,
          SortColumn: sortColumn,
          SortDir: sortDirection,
        }),
      };

      await new Promise((res) => setTimeout(res, 400));
      const response = await universalService(payload);
      const apiRes = response?.data || response;

      if (!Array.isArray(apiRes) || apiRes.length === 0) {
        setTasks([]);
        setTotalCount(0);
        return;
      }

      setTotalCount(apiRes[0].TotalRecords ?? 0);
      const formatted = apiRes.map((item: any) => ({
        FormId: item.FormId,
        ModuleId: item.ModuleId,
        FormCategoryId: item.FormCategoryId,
        ModuleTitle: item.ModuleTitle,
        FormCategoryName: item.FormCategoryName,
        FormDisplayName: item.FormDisplayName,
        FormNameWithExt: item.FormNameWithExt,
        ActionList: item.ActionList,
        HasEmailSending: item.HasEmailSending,
        ShowInMenu: item.ShowInMenu,
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

      await new Promise((res) => setTimeout(res, 400));
      const response = await universalService(payload);
      const res = response.data ? response.data : response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (!apiRes?.ModuleList) return;
      const moduleArray = JSON.parse(apiRes.ModuleList);
      const formattedModules = moduleArray.map((m: any) => ({
        id: m.ModuleID,
        name: m.ModuleTitle,
      }));
      setModules(formattedModules);
    } catch (error) {
      console.log("Module fetch error:", error);
    }
  };

  const fetchParentCategories = async (moduleId: string) => {
    try {
      const payload = {
        procName: "Modules",
        Para: JSON.stringify({
          Action: "GetParentCategoryByModuleID",
          ModuleID: moduleId,
        }),
      };

      await new Promise((res) => setTimeout(res, 400));
      const response = await universalService(payload);
      const res = response?.data ? response.data : response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (!apiRes?.FormCategoryList) {
        setParentCategories([]);
        return;
      }

      const parsed = JSON.parse(apiRes.FormCategoryList);
      const formatted = parsed.map((c: any) => ({
        id: c.FormCategoryId,
        name: c.FormCategoryName,
      }));
      setParentCategories(formatted);
    } catch (error) {
      console.log("Parent category fetch error:", error);
    }
  };

  const displayedTasks = tasks;

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (isEdit && editData?.ModuleId != null) {
      setSelectedModule(String(editData.ModuleId));
    }
  }, [isEdit, editData]);

  useEffect(() => {
    if (!selectedModule) return;
    fetchParentCategories(selectedModule);
  }, [selectedModule]);

  const renderColumnValue = (task: Task, columnName: string) => {
    const value = task[columnName as keyof Task];
    if (value === true || value === 1 || value === "1") return "Yes";
    if (value === false || value === 0 || value === "0") return "No";

    // 🔥 DATE HANDLING (CENTRALIZED)
    if (DATE_COLUMNS.includes(columnName)) {
      return formatDate(value as string, "readable");
    }

    return value ?? "-";
  };

  const handleSort = (column: string) => {
    if (
      !ALLOWED_SORT_COLUMNS.includes(column) ||
      !displayedColumns.some((c) => c.ColumnName === column)
    )
      return;

    setCurrentPage(1);
    if (sortColumn === column) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortColumn(column);
      setSortDirection("ASC");
    }
  };

  const getFilterPayload = (filter: string, value: string) => {
    if (!value) return {};
    switch (filter) {
      case "FormDisplayName":
        return { FormDisplayNameFilter: value };
      case "FormCategoryName":
        return { FormCategoryNameFilter: value };
      case "ModuleTitle":
        return { ModuleTitleFilter: value };
      default:
        return { SearchTerm: value };
    }
  };

  const renderActionList = (actions?: string) => {
    if (!actions) return "-";

    return (
      <div className="flex flex-wrap gap-1">
        {actions.split(",").map((action, index) => (
          <span
            key={index}
            className="px-2 py-[2px] text-xs font-semibold rounded-full
                     bg-primary-table-bg-hover text-primary-700
                     dark:bg-primary-900 dark:text-primary-300"
          >
            {action.trim()}
          </span>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (isEdit && editData?.ActionList) {
      setTags(editData.ActionList.split(","));
    }
  }, [isEdit, editData]);

  useEffect(() => {
    if (!displayedColumns.some((c) => c.ColumnName === sortColumn)) {
      setSortColumn("FormId");
      setSortDirection("DESC");
    }
  }, [displayedColumns]);

  useEffect(() => {
    if (!showTable) return;

    const loadInitialTable = async () => {
      await fetchTableData();
      await fetchVisibleColumns();
    };

    loadInitialTable();
  }, [showTable]);

  useEffect(() => {
    if (!showTable) return;
    fetchTableData();
  }, [
    currentPage,
    itemsPerPage,
    searchQuery,
    sortColumn,
    sortDirection,
    showTable,
    searchTrigger,
  ]);

  useEffect(() => {
    fetchFormPermissions();
  }, []);

  const skeletonColumns = React.useMemo(() => {
    // displayed columns + Action column
    if (displayedColumns.length > 0) {
      return displayedColumns.length + 1;
    }

    // fallback when columns not yet loaded
    return 6;
  }, [displayedColumns]);
if (permissionsLoading) {
  return <Loader />; // or your spinner
}

if (!hasPageAccess) {
  return <AccessRestricted />;
}

  return (
    <>
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        {/* Header and Filters */}
        <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
          <div className="trezo-card-title">
            <h5 className="!mb-0">Manage Forms</h5>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-[7px] w-full">
              {/* 1. Filter Dropdown */}
              <div className="relative">
                <PermissionAwareTooltip
                  allowed={SmartActions.canAdvancedSearch(CURRENT_FORM_ID)}
                  allowedText="Filter records"
                  deniedText="Permission required"
                >
                  <div className="relative w-full sm:w-[180px]">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                      <i className="material-symbols-outlined !text-[18px]">
                        filter_list
                      </i>
                    </span>
                    <select
                      disabled={
                        !SmartActions.canAdvancedSearch(CURRENT_FORM_ID)
                      }
                      value={filterColumn}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFilterColumn(value === NO_FILTER ? "" : value);
                        setSearchInput("");
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className={`w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border transition-all
            ${SmartActions.canAdvancedSearch(CURRENT_FORM_ID)
                          ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        }`}
                    >
                      <option value={NO_FILTER}>Select Filter Option</option>
                      <option value="FormDisplayName">Form Name</option>
                      <option value="FormCategoryName">Category Name</option>
                      <option value="ModuleTitle">Module Name</option>
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                      <i className="material-symbols-outlined !text-[18px]">
                        expand_more
                      </i>
                    </span>
                  </div>
                </PermissionAwareTooltip>
              </div>

              {/* 2. Search Input */}
              <div className="relative">
                <PermissionAwareTooltip
                  allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                  allowedText="Enter Criteria"
                  deniedText="Permission required"
                >
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                      <i className="material-symbols-outlined !text-[18px]">
                        search
                      </i>
                    </span>
                    <input
                      type="text"
                      value={searchInput}
                      disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                      placeholder="Enter Criteria..."
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applySearch()}
                      className={`h-[34px] w-full pl-8 pr-3 text-xs rounded-md outline-none border transition-all
            ${SmartActions.canSearch(CURRENT_FORM_ID)
                          ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </PermissionAwareTooltip>
              </div>

              {/* 3, 4, 5. Action Buttons Group */}
              <div className="flex items-center justify-end gap-[7px]">
                {/* Search Button */}
                <PermissionAwareTooltip
                  allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                  allowedText="Search"
                >
                  <button
                    type="button"
                    onClick={applySearch}
                    disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all disabled:opacity-50"
                  >
                    <i className="material-symbols-outlined text-[20px]">
                      search
                    </i>
                  </button>
                </PermissionAwareTooltip>

                {/* Column Selector - Remove its internal ml-[7px] to prevent double spacing */}
                <PermissionAwareTooltip
                  allowed={SmartActions.canManageColumns(CURRENT_FORM_ID)}
                  allowedText="Manage Columns"
                  deniedText="You do not have permission to manage columns"
                >
                  <div
                    className={`h-[34px] flex items-center ${SmartActions.canManageColumns(CURRENT_FORM_ID)
                        ? ""
                        : "pointer-events-none opacity-50"
                      }`}
                  >
                    <ColumnSelector
                      procName="USP_Forms"
                      onApply={fetchVisibleColumns}
                      disabled={!SmartActions.canManageColumns(CURRENT_FORM_ID)}
                    />
                  </div>
                </PermissionAwareTooltip>

                {/* Add Button */}
                <PermissionAwareTooltip
                  allowed={SmartActions.canAdd(CURRENT_FORM_ID)}
                  allowedText="Add New"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(true);
                      setIsEdit(false);
                    }}
                    disabled={!SmartActions.canAdd(CURRENT_FORM_ID)}
                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-white text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all disabled:opacity-50"
                  >
                    <i className="material-symbols-outlined text-[20px]">add</i>
                  </button>
                </PermissionAwareTooltip>

                {/* Refresh Button (Search Reset) */}
                {showTable && (filterColumn || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterColumn("");
                      setSearchInput("");
                      setSearchQuery("");
                      setCurrentPage(1);
                      fetchTableData();
                    }}
                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md 
               border border-gray-400 text-gray-500 
               hover:bg-gray-100 transition-all"
                  >
                    <i className="material-symbols-outlined text-[20px]">
                      refresh
                    </i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table or Placeholder */}
        {!showTable && (
          <div className="w-full bg-white dark:bg-[#0c1427] rounded-md border border-gray-200 dark:border-[#172036] p-10 flex flex-col md:flex-row items-center md:items-start justify-center md:gap-x-80 min-h-[450px]">
            <div className="md:max-w-md md:px-3 px-0 py-14">
              <h1 className="text-3xl font-semibold text-black dark:text-white mb-4">
                Manage <br /> Forms
              </h1>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-[15px]">
                Search Form data by <br />
                using above filters to edit, delete etc.
                <br />
                OR <br />
                Click below to add New Form.
              </p>
              <PermissionAwareTooltip
                allowed={SmartActions.canAdd(CURRENT_FORM_ID)}
                allowedText="Add New"
                deniedText="You do not have permission to add forms"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!SmartActions.canAdd(CURRENT_FORM_ID)) return;
                    setIsEdit(false);
                    setEditData(null);
                    setSelectedModule("");
                    setOpen(true);
                  }}
                  disabled={!SmartActions.canAdd(CURRENT_FORM_ID)}
                  className={`px-[26.5px] py-[12px] rounded-md transition-all
      ${SmartActions.canAdd(CURRENT_FORM_ID)
                      ? "bg-primary-button-bg text-white hover:bg-primary-button-bg-hover"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  Add Form
                </button>
              </PermissionAwareTooltip>
            </div>
            {/* RIGHT ILLUSTRATION */}
            <div className="hidden md:flex">
              <svg
                viewBox="0 0 512 512"
                className="w-[320px] h-auto opacity-100 select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Main Card Background - using primary-button-bg */}
                <rect
                  x="40"
                  y="80"
                  width="432"
                  height="340"
                  rx="30"
                  className="fill-primary-button-bg"
                />

                {/* Card Header - using primary-600 (darker) */}
                <path
                  d="M70 80H442C458.569 80 472 93.4315 472 110V130H40V110C40 93.4315 53.4315 80 70 80Z"
                  className="fill-primary-200"
                />

                {/* Content Lines/Items - also using primary-600 for contrast */}
                <g className="fill-primary-200">
                  <rect x="90" y="210" width="25" height="25" rx="6" />
                  <rect x="140" y="210" width="240" height="15" rx="7.5" />

                  <rect x="90" y="265" width="25" height="25" rx="6" />
                  <rect x="140" y="265" width="240" height="15" rx="7.5" />

                  <rect x="90" y="320" width="25" height="25" rx="6" />
                  <rect x="140" y="320" width="240" height="15" rx="7.5" />
                </g>

                {/* Magnifying Glass Handle - using primary-600 */}
                <rect
                  x="430"
                  y="420"
                  width="20"
                  height="80"
                  rx="5"
                  transform="rotate(-45 430 420)"
                  className="fill-primary-button-bg"
                />

                {/* Magnifying Glass Lens - using primary-50 (lightest) */}
                <circle
                  cx="380"
                  cy="380"
                  r="90"
                  className="fill-primary-50 stroke-primary-200"
                  strokeWidth="8"
                />
              </svg>
            </div>
          </div>
        )}

        {showTable && (
          <div className="trezo-card-content -mx-[20px] md:-mx-[25px]">
            {tableLoading || !columnsReady ? (
              <div className="table-responsive overflow-x-auto">
                <TableSkeleton
                  rows={itemsPerPage > 10 ? 10 : itemsPerPage}
                  columns={skeletonColumns}
                  showExportSkeleton
                  showPageSizeSkeleton
                />
              </div>
            ) : totalCount === 0 && tasks.length === 0 ? (
              <div className="flex flex-col md:flex-row items-center justify-center p-10 gap-10 min-h-[300px] animate-in fade-in zoom-in duration-300">
                <div className="text-center md:text-left max-w-md">
                  <h3 className="text-xl font-bold text-purple-600 mb-1">
                    Oops!
                  </h3>
                  <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">
                    No records found!
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Please adjust the data filter and search again.
                  </p>
                </div>
                {/* Placeholder Illustration */}
                <div className="flex-shrink-0">
                  <svg
                    viewBox="0 0 512 512"
                    className="w-[320px] h-auto select-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                  >
                    {/* Box Outline */}
                    <path
                      d="M96 220L256 300L416 220"
                      className="stroke-primary-button-bg"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Left Flap */}
                    <path
                      d="M96 220L150 160L256 200"
                      className="stroke-primary-button-bg"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Right Flap */}
                    <path
                      d="M416 220L362 160L256 200"
                      className="stroke-primary-button-bg"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Bottom Box */}
                    <path
                      d="M96 220V340C96 360 112 376 132 376H380C400 376 416 360 416 340V220"
                      className="stroke-primary-button-bg"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Inner Fill */}
                    <path
                      d="M150 220L256 260L362 220L256 190L150 220Z"
                      className="fill-primary-button-bg"
                    />

                    {/* Floating Motion Path */}
                    <path
                      d="M256 110C300 90 340 110 340 140C340 165 300 175 256 200"
                      className="stroke-primary-button-bg"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="12 14"
                    />

                    {/* Floating e */}
                    <circle
                      cx="256"
                      cy="90"
                      r="26"
                      className="stroke-primary-button-bg fill-primary-50"
                      strokeWidth="6"
                    />

                    <path
                      d="M245 92H268C268 78 245 78 245 92C245 106 268 106 268 92"
                      className="stroke-primary-600"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <>
                {/* Export Buttons */}
                <div className="flex justify-between items-center px-7 py-2 mb-2">
                  {/* Page Size Selector */}
                  <PermissionAwareTooltip
                    allowed={true}
                    allowedText="Items per page"
                  >
                    <div className="relative group">
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="h-8 w-[120px] px-3 pr-7 text-xs font-semibold
                 text-gray-600 dark:text-gray-300
                 bg-transparent border border-gray-300 dark:border-gray-600
                 rounded-md cursor-pointer
                 hover:bg-gray-100 dark:hover:bg-gray-800
                 transition-all appearance-none"
                      >
                        <option value="10">10 / page</option>
                        <option value="25">25 / page</option>
                        <option value="50">50 / page</option>
                        <option value="100">100 / page</option>
                      </select>

                      <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        <i className="material-symbols-outlined text-[18px] text-gray-500">
                          expand_more
                        </i>
                      </span>
                    </div>
                  </PermissionAwareTooltip>

                  <div className="flex items-center gap-2 leading-none">
                    {/* PDF */}
                    <PermissionAwareTooltip
                      allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                      allowedText="Export PDF"
                      deniedText="You do not have permission to export"
                    >
                      <button
                        type="button"
                        disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                        onClick={() => {
                          if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                          exportPDF();
                        }}
                        className={`h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase rounded-md transition-all
        ${SmartActions.canSearch(CURRENT_FORM_ID)
                            ? "text-primary-button-bg border border-primary-button-bg hover:bg-primary-button-bg hover:text-white"
                            : "text-gray-300 border border-gray-300 cursor-not-allowed"
                          }`}
                      >
                        PDF
                      </button>
                    </PermissionAwareTooltip>

                    {/* EXCEL */}
                    <PermissionAwareTooltip
                      allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                      allowedText="Export Excel"
                      deniedText="You do not have permission to export"
                    >
                      <button
                        type="button"
                        disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                        onClick={() => {
                          if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                          exportExcel();
                        }}
                        className={`h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase rounded-md transition-all
        ${SmartActions.canSearch(CURRENT_FORM_ID)
                            ? "text-primary-button-bg border border-primary-button-bg hover:bg-primary-button-bg hover:text-white"
                            : "text-gray-300 border border-gray-300 cursor-not-allowed"
                          }`}
                      >
                        Excel
                      </button>
                    </PermissionAwareTooltip>

                    {/* CSV */}
                    <PermissionAwareTooltip
                      allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                      allowedText="Export CSV"
                      deniedText="You do not have permission to export"
                    >
                      <button
                        type="button"
                        disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                        onClick={() => {
                          if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                          exportCSV();
                        }}
                        className={`h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase rounded-md transition-all
        ${SmartActions.canSearch(CURRENT_FORM_ID)
                            ? "text-primary-button-bg border border-primary-button-bg hover:bg-primary-button-bg hover:text-white"
                            : "text-gray-300 border border-gray-300 cursor-not-allowed"
                          }`}
                      >
                        CSV
                      </button>
                    </PermissionAwareTooltip>

                    {/* PRINT */}
                    <PermissionAwareTooltip
                      allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                      allowedText="Print"
                      deniedText="You do not have permission to print"
                    >
                      <button
                        type="button"
                        disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                        onClick={() => {
                          if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                          printTable();
                        }}
                        className={`h-8 px-3 inline-flex items-center justify-center
      text-xs font-semibold uppercase rounded-md transition-all
      ${SmartActions.canSearch(CURRENT_FORM_ID)
                            ? "text-primary-button-bg border border-primary-button-bg hover:bg-primary-button-bg hover:text-white"
                            : "text-gray-300 border border-gray-300 cursor-not-allowed"
                          }`}
                      >
                        PRINT
                      </button>
                    </PermissionAwareTooltip>
                  </div>
                </div>

                {/* Table */}
                <div className="table-responsive overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-black dark:text-white ">
                      <tr>
                        {displayedColumns.map((col) => (
                          <th
                            key={col.ColumnName}
                            onClick={() => handleSort(col.ColumnName)}
                            className={`font-medium ltr:text-left rtl:text-right px-[20px] py-[11px] whitespace-nowrap cursor-pointer transition-colors ${sortColumn === col.ColumnName
                                ? "bg-primary-table-bg-hover dark:bg-[#1e2a4a]"
                                : "bg-primary-table-bg dark:bg-[#15203c]"
                              }`}
                          >
                            <div className="flex items-center gap-1 group font-semibold">
                              <span className="transition-colors">
                                {col.DisplayName}
                              </span>
                              <i
                                className={`material-symbols-outlined text-sm transition-all ${sortColumn === col.ColumnName
                                    ? "text-gray-400 dark:text-primary-button-bg-hover opacity-100"
                                    : "text-gray-400 dark:text-gray-500 opacity-40"
                                  }`}
                              >
                                {sortDirection === "ASC"
                                  ? "arrow_drop_up"
                                  : "arrow_drop_down"}
                              </i>
                            </div>
                          </th>
                        ))}
                        <th className="px-[20px] py-[11px] text-left bg-primary-table-bg dark:bg-[#15203c]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-black dark:text-white">
                      {displayedTasks.map((task) => (
                        <tr key={task.FormId}>
                          {displayedColumns.map((col) => (
                            <td
                              key={`${task.FormId}_${col.ColumnName}`}
                              className="px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]"
                            >
                              {col.ColumnName === "ActionList"
                                ? renderActionList(task.ActionList)
                                : renderColumnValue(task, col.ColumnName)}
                            </td>
                          ))}

                          <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]">
                            <div className="flex items-center gap-[9px]">
                              {/* EDIT */}
                              <PermissionAwareTooltip
                                allowed={SmartActions.canEdit(CURRENT_FORM_ID)}
                                allowedText="Edit"
                                deniedText="You do not have permission to edit"
                              >
                                <button
                                  type="button"
                                  disabled={
                                    !SmartActions.canEdit(CURRENT_FORM_ID)
                                  }
                                  onClick={async () => {
                                    if (!SmartActions.canEdit(CURRENT_FORM_ID))
                                      return;

                                    const payload = {
                                      procName: "Forms",
                                      Para: JSON.stringify({
                                        ActionMode: "Select",
                                        EditId: task.FormId,
                                      }),
                                    };

                                    const response =
                                      await universalService(payload);
                                    const data = Array.isArray(response)
                                      ? response[0]
                                      : response;
                                    if (!data) return;

                                    setIsEdit(true);
                                    setEditData(data);
                                    setOpen(true);
                                  }}
                                  className={`leading-none
      ${SmartActions.canEdit(CURRENT_FORM_ID)
                                      ? "text-gray-500 hover:text-primary-button-bg"
                                      : "text-gray-300 cursor-not-allowed"
                                    }`}
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    edit
                                  </i>
                                </button>
                              </PermissionAwareTooltip>

                              {/* DELETE */}
                              <PermissionAwareTooltip
                                allowed={SmartActions.canDelete(
                                  CURRENT_FORM_ID,
                                )}
                                allowedText="Delete"
                                deniedText="You do not have permission to delete"
                              >
                                <button
                                  type="button"
                                  disabled={
                                    !SmartActions.canDelete(CURRENT_FORM_ID)
                                  }
                                  onClick={() => {
                                    if (
                                      !SmartActions.canDelete(CURRENT_FORM_ID)
                                    )
                                      return;
                                    handleDelete(task.FormId);
                                  }}
                                  className={`leading-none
      ${SmartActions.canDelete(CURRENT_FORM_ID)
                                      ? "text-danger-500 hover:text-danger-700"
                                      : "text-gray-300 cursor-not-allowed"
                                    }`}
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    delete
                                  </i>
                                </button>
                              </PermissionAwareTooltip>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {/* Add New Form Category Modal */}
      <Dialog open={open} onClose={setOpen} className="relative z-60">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0"
        />

        <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:my-8 sm:w-full sm:max-w-[550px]"
            >
              <div className="trezo-card w-full bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
                {/* HEADER */}
                <div
                  className="trezo-card-header bg-gray-50 dark:bg-[#15203c] mb-[20px] md:mb-[25px] 
          flex items-center justify-between -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px] 
          p-[20px] md:p-[25px] rounded-t-md"
                >
                  <div className="trezo-card-title">
                    <h5 className="!mb-0">
                      {isEdit ? "Edit Form" : "Add Form"}
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="text-[23px] text-black dark:text-white hover:text-primary-button-bg"
                    onClick={() => setOpen(false)}
                  >
                    <i className="ri-close-fill"></i>
                  </button>
                </div>

                {/* FORM START */}
                <Formik
                  enableReinitialize
                  initialValues={{
                    module: editData ? String(editData.ModuleId) : "",
                    parentCategory: editData
                      ? String(editData.FormCategoryId)
                      : "",
                    formDisplayName: editData?.FormDisplayName ?? "",
                    formName: editData?.FormNameWithExt ?? "",
                    emailSending: editData
                      ? Boolean(editData.HasEmailSending)
                      : false,
                    showInMenu: editData ? Boolean(editData.ShowInMenu) : false,
                    actionList: editData?.ActionList
                      ? editData.ActionList.split(",")
                      : [],
                  }}
                  validationSchema={FormSchema}
                  onSubmit={async (values, { setSubmitting }) => {
                    try {
                      const payload = {
                        procName: "Forms",
                        Para: JSON.stringify({
                          ActionMode: isEdit ? "Update" : "Insert",

                          ModuleId: values.module,
                          FormCategoryId: values.parentCategory,
                          FormDisplayName: values.formDisplayName,
                          FormNameWithExt: values.formName,
                          ActionList: values.actionList.join(","),
                          HasEmailSending: values.emailSending ? 1 : 0,
                          ShowInMenu: values.showInMenu ? 1 : 0,

                          // only for edit
                          ...(isEdit && { EditId: editData?.FormId }),
                        }),
                      };

                      const response = await universalService(payload);
                      const res = response?.data ?? response;

                      console.log("Form API Response:", res);

                      ShowSuccessAlert(
                        isEdit
                          ? "Form updated successfully"
                          : "Form added successfully",
                      );
                      // ✅ OPTIONAL: reload table data
                      await fetchTableData();

                      setOpen(false);
                      setIsEdit(false);
                      setEditData(null);
                      setTags([]);
                    } catch (error) {
                      console.error("Form insert/update error:", error);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {({ errors, touched, setFieldValue }) => (
                    <Form className="space-y-5">
                      {/* SELECT MODULE */}
                      <div>
                        <label className="mb-[10px] font-medium block">
                          Select Module: <span className="text-red-500">*</span>
                        </label>

                        <Field
                          as="select"
                          name="module"
                          onChange={(e) => {
                            setFieldValue("module", e.target.value);
                            setSelectedModule(e.target.value);
                          }}
                          className="h-[55px] rounded-md border px-[14px] w-full"
                        >
                          <option value="">Select Module</option>

                          {modules.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </Field>

                        {errors.module && touched.module && (
                          <p className="text-red-500 text-sm">
                            {errors.module}
                          </p>
                        )}
                      </div>

                      {/* SELECT PARENT CATEGORY */}
                      <div>
                        <label className="mb-[10px] font-medium block">
                          Parent Category:{" "}
                          <span className="text-red-500">*</span>
                        </label>

                        <Field
                          as="select"
                          name="parentCategory"
                          className="h-[55px] rounded-md border px-[14px] w-full"
                        >
                          <option value="">Select Parent Category</option>

                          {/* If module selected but no parents → show No Data */}
                          {selectedModule && parentCategories.length === 0 && (
                            <option disabled>No Parent Category Found</option>
                          )}

                          {parentCategories.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </Field>

                        {errors.parentCategory && touched.parentCategory && (
                          <p className="text-red-500 text-sm">
                            {errors.parentCategory}
                          </p>
                        )}
                      </div>

                      {/* FORM DISPLAY NAME */}
                      <div>
                        <label className="mb-[10px] font-medium block">
                          Form Display Name:
                          <span className="text-red-500">*</span>
                        </label>
                        <Field
                          name="formDisplayName"
                          className="h-[55px] rounded-md border px-[17px] w-full"
                          placeholder="Enter form display name"
                        />
                        {errors.formDisplayName && touched.formDisplayName && (
                          <p className="text-red-500 text-sm">
                            {errors.formDisplayName}
                          </p>
                        )}
                      </div>

                      {/* FORM NAME WITHOUT EXTENSION */}
                      <div>
                        <label className="mb-[10px] font-medium block">
                          Form Name Without Extension:
                        </label>
                        <div className="flex items-center">
                          <div className="h-[55px] w-[55px] flex items-center justify-center bg-white border rounded-l-md">
                            <i className="ri-tools-fill text-primary-button-bg text-xl"></i>
                          </div>

                          <Field
                            name="formName"
                            className="h-[55px] border px-[17px] w-full"
                            placeholder="Form name"
                          />

                          <button
                            type="button"
                            className="h-[55px] min-w-[130px] max-w-[250px] px-[15px] bg-primary-button-bg 
                 text-white rounded-r-md flex items-center justify-center 
                 whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
                          >
                            {"Fetch Action List"}
                          </button>
                        </div>

                        {errors.formName && touched.formName && (
                          <p className="text-red-500 text-sm">
                            {errors.formName}
                          </p>
                        )}
                      </div>

                      {/* ACTION LIST (TAGS) */}
                      <div>
                        <label className="mb-[10px] font-medium block">
                          Action List: <span className="text-red-500">*</span>
                        </label>

                        <div
                          className="flex flex-wrap items-center gap-2 border rounded-md p-2 min-h-[55px]"
                          onClick={() =>
                            document.getElementById("tagInput").focus()
                          }
                        >
                          {tags.map((tag, index) => (
                            <span
                              key={index}
                              className="flex items-center gap-1 bg-primary-table-bg-hover text-primary-700 px-3 py-1 rounded-full text-sm"
                            >
                              {tag}
                              <button
                                type="button"
                                className="hover:text-red-500"
                                onClick={() => {
                                  const updated = tags.filter(
                                    (_, i) => i !== index,
                                  );
                                  setTags(updated);
                                  setFieldValue("actionList", updated);
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}

                          <input
                            id="tagInput"
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === ",") {
                                e.preventDefault();
                                const t = tagInput.trim().replace(",", "");
                                if (t && !tags.includes(t)) {
                                  const updated = [...tags, t];
                                  setTags(updated);
                                  setFieldValue("actionList", updated);
                                }
                                setTagInput("");
                              }
                            }}
                            placeholder={
                              tags.length === 0 ? "add, edit, delete" : ""
                            }
                            className="outline-none flex-grow bg-transparent"
                          />
                        </div>

                        {errors.actionList && (
                          <p className="text-red-500 text-sm">
                            {Array.isArray(errors.actionList)
                              ? errors.actionList.join(", ")
                              : typeof errors.actionList === "object"
                                ? JSON.stringify(errors.actionList)
                                : errors.actionList}
                          </p>
                        )}
                      </div>

                      {/* TOGGLES */}
                      <div className="grid grid-cols-2 gap-[25px]">
                        {/* EMAIL SENDING */}
                        <div className="flex items-center justify-between pr-4">
                          <label className="font-medium">E-Mail Sending</label>

                          <Field name="emailSending">
                            {({ field }) => (
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={(e) =>
                                    field.onChange({
                                      target: {
                                        name: field.name,
                                        value: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-button-bg"></div>
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                              </label>
                            )}
                          </Field>
                        </div>

                        {/* SHOW IN MENU */}
                        <div className="flex items-center justify-between pr-4">
                          <label className="font-medium">Show In Menu</label>

                          <Field name="showInMenu">
                            {({ field }) => (
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={(e) =>
                                    field.onChange({
                                      target: {
                                        name: field.name,
                                        value: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-button-bg"></div>
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                              </label>
                            )}
                          </Field>
                        </div>
                      </div>

                      {/* FOOTER BUTTONS */}
                      <div className="mt-[20px] text-right">
                        <button
                          type="button"
                          className="rounded-md mr-[15px] px-[26.5px] py-[12px] bg-danger-500 hover:bg-danger-400 text-white"
                          onClick={() => setOpen(false)}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="px-[26.5px] py-[12px] bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded-md"
                        >
                          {isEdit ? "Update Form" : "Add Form"}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ToDoList;
