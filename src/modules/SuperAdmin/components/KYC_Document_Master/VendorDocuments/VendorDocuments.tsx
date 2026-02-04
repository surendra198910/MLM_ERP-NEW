import React, { useEffect, useRef, useState } from "react";
import IconsPopUpPage from "../../../components/Icons/IconsPopUpPage"; // adjust path as needed
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ApiService } from "../../../../../services/ApiService";
import ColorPickerPopup from "../../../components/Colors/ColorPickerPopup";
import { useSweetAlert } from "../../../context/SweetAlertContext";
import ColumnSelector from "../../ColumnSelector/ColumnSelector";
import * as XLSX from "xlsx"; // Excel Export
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableSkeleton from "../../Forms/TableSkeleton";
import { SmartActions } from "../../Security/SmartAction";
import PermissionAwareTooltip from "../../Tooltip/PermissionAwareTooltip";
import Pagination from "../../../common/Pagination";
import { formatDate } from "../../../../../utils/dateFormatter";
import Loader from "../../../common/Loader";
import AccessRestricted from "../../../common/AccessRestricted";
// import { SmartyActionStoreInstance } from "../../SmrtyAction/SmartyActionStore";
// import { scanSmartyActions } from "../../SmrtyAction/SmartyActionScanner";

type Task = {
  DocumentId: number;
  DocumentName: string;
  IsAttachment: string; // "Yes" | "No"
  EntryDate: string | null;
  ModifiedDate: string | null;
  EntryBy: number | null;
  ModifiedBy: number | null;
};

const ToDoList: React.FC = () => {
  const CURRENT_FORM_ID = 94;
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
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [editLoading, setEditLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
const [hasPageAccess, setHasPageAccess] = useState(true);


  const totalPages =
    totalCount > 0 && itemsPerPage > 0
      ? Math.ceil(totalCount / itemsPerPage)
      : 1;

  const [tableLoading, setTableLoading] = useState(false);
  const [hasVisitedTable, setHasVisitedTable] = useState(false);

  const NO_FILTER = "__NONE__";
  const [columnsReady, setColumnsReady] = useState(false);
  const SKELETON_COLUMNS = 6;

  const getCellValue = (row: any, columnName: string) => {
    const value = row[columnName];

    if (DATE_COLUMNS.includes(columnName)) {
      return formatDate(value, "readable");
    }

    return value ?? "-";
  };

  const fetchExportData = async () => {
    const filters = getFilterPayload(filterColumn, searchQuery);

    const payload = {
      procName: "VendorDocumentsMaster",
      Para: JSON.stringify({
        ActionMode: "Export",
        CompanyId: 1,
        EntryBy: 1,

        Start: (currentPage - 1) * itemsPerPage,
        Length: itemsPerPage,

        SortColumn: sortColumn,
        SortDir: sortDirection,

        SearchTerm: searchQuery || "", // ✅ REQUIRED
      }),
    };

    const response = await universalService(payload);
    const apiRes = response?.data || response;

    return Array.isArray(apiRes) ? apiRes : [];
  };
  const applySearch = () => {
    if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;

    setShowTable(true);
    setHasVisitedTable(true); // ✅ ADD THIS
    setCurrentPage(1);
    setSearchQuery(searchInput.trim());
    setSearchTrigger((prev) => prev + 1);
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
        .join(","),
    );

    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Vendor_documents.csv";
    a.click();
  };

  const exportExcel = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const rows = data.map((item) =>
      visibleColumns.reduce((obj, col) => {
        obj[col.DisplayName] = getCellValue(item, col.ColumnName);
        return obj;
      }, {}),
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendor Documents");
    XLSX.writeFile(workbook, "Vendor_documents.xlsx");
  };

  const exportPDF = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const doc = new jsPDF();
    const tableColumn = visibleColumns.map((c) => c.DisplayName);

    const tableRows = data.map((item) =>
      visibleColumns.map((col) => getCellValue(item, col.ColumnName)),
    );

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save("Vendor_documents.pdf");
  };

  const [iconColor, setIconColor] = useState("#1976d2"); // default color
  const [openColorPopup, setOpenColorPopup] = useState(false);
  const iconColorRef = useRef<(color: string) => void>(() => {});
  const [sortColumn, setSortColumn] = useState("DocumentId");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
  // 👇 Columns that should be formatted as dates
  const DATE_COLUMNS = ["EntryDate", "ModifiedDate"];

  const fetchVisibleColumns = async () => {
    try {
      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

      const payload = {
        procName: "UniversalColumnSelector",
        Para: JSON.stringify({
          EmployeeId: employeeId,
          USPName: "USP_VendorDocumentsMaster", // ✅ FIXED
          ActionMode: "List",
          Mode: "Get",
        }),
      };

      await new Promise((res) => setTimeout(res, 400)); // 👈 ADD THIS
      const response = await universalService(payload);

      const cols = Array.isArray(response.data) ? response.data : response;

      setVisibleColumns(
        cols
          .filter(
            (c) => c.IsVisible == 1 && c.ColumnName !== "DocumentId", // 🚫 HIDE DOCUMENT ID
          )
          .sort((a, b) => a.DisplayOrder - b.DisplayOrder),
      );
    } catch (err) {
      console.log("Column Fetch Error:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await ShowConfirmAlert(
      "Are you sure?",
      "Do you really want to delete this category?",
    );

    if (!confirm) return;

    try {
      const payload = {
        procName: "VendorDocumentsMaster",
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
      setDataLoaded(false);

      const payload = {
        procName: "VendorDocumentsMaster", // ✅ FIX
        Para: JSON.stringify({
          ActionMode: "List",
          CompanyId: 1,
          EntryBy: 1,

          Start: (currentPage - 1) * itemsPerPage,
          Length: itemsPerPage,

          SortColumn: sortColumn,
          SortDir: sortDirection,

          SearchTerm: searchQuery || "",
        }),
      };

      const response = await universalService(payload);
      const apiRes = response?.data || response;

      if (!Array.isArray(apiRes)) {
        console.error("Invalid API response:", apiRes);
        return;
      }

      setTotalCount(apiRes[0]?.TotalRecords ?? 0);

      setTasks(
        apiRes.map((row) => ({
          DocumentId: row.DocumentId,
          DocumentName: row.DocumentName,
          IsAttachment: row.IsAttachment,
          EntryDate: row.EntryDate,
          ModifiedDate: row.ModifiedDate,
          EntryBy: row.EntryBy,
          ModifiedBy: row.ModifiedBy,
        })),
      );
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setTableLoading(false);
      setDataLoaded(true);
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
    if (!id) return;

    try {
      // ✅ open modal immediately
      setOpen(true);
      setIsEdit(true);
      setEditData(null);
      setEditLoading(true); // 🔥 START LOADER

      const payload = {
        procName: "VendorDocumentsMaster",
        Para: JSON.stringify({
          ActionMode: "Select",
          EditId: Number(id),
          CompanyId: 1,
        }),
      };

      const response = await universalService(payload);
      const data = Array.isArray(response) ? response[0] : response;

      if (!data || !data.DocumentId) {
        throw new Error("Edit data not found");
      }

      setEditData({
        id: data.DocumentId,
        DocumentName: data.DocumentName,
        IsAttachment: Boolean(data.IsAttachment),
      });
    } catch (err) {
      console.error("Edit fetch failed:", err);
    } finally {
      setEditLoading(false); // 🔥 STOP LOADER
    }
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
    DocumentName: Yup.string().required("Document name is required"),
  });

  const displayedTasks = tasks; // backend already paginating
 const fetchDocumentPermissions = async () => {
  try {
    setPermissionsLoading(true);

    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

    const payload = {
      procName: "AssignForm",
      Para: JSON.stringify({
        ActionMode: "Forms",
        FormCategoryId: 26, // 👈 category for this page
        EmployeeId: employeeId,
      }),
    };

    const response = await universalService(payload);
    const data = response?.data ?? response;

    // ❌ Invalid / empty response → deny access
    if (!Array.isArray(data)) {
      setHasPageAccess(false);
      return;
    }

    // 🔍 Find permission for THIS page
    const pagePermission = data.find(
      (p) =>
        Number(p.FormId) === CURRENT_FORM_ID &&
        Number(p.FormCategoryId) === 26
    );

    // ❌ No permission OR empty Action → block page
    if (
      !pagePermission ||
      !pagePermission.Action ||
      pagePermission.Action.trim() === ""
    ) {
      setHasPageAccess(false);
      return;
    }

    // ✅ Permission OK → enable actions
    SmartActions.load(data);
    setHasPageAccess(true);
  } catch (error) {
    console.error("Document permission fetch failed:", error);
    setHasPageAccess(false);
  } finally {
    setPermissionsLoading(false);
  }
};

  const handlePrint = async () => {
    // ✅ 1. Get EXPORT data from backend
    const data = await fetchExportData();
    if (!data.length) return;

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    // ✅ 2. Build headers from visible columns
    const tableHeaders = visibleColumns
      .map((col) => `<th>${col.DisplayName}</th>`)
      .join("");

    // ✅ 3. Build rows from EXPORT data
    const tableRows = data
      .map(
        (row) => `
      <tr>
        ${visibleColumns
          .map((col) => {
            let value = row[col.ColumnName];

            // format date → YYYY-MM-DD
            if (DATE_COLUMNS.includes(col.ColumnName)) {
              value = formatDate(value, "readable");
            }

            return `<td>${value ?? "-"}</td>`;
          })
          .join("")}
      </tr>
    `,
      )
      .join("");

    // ✅ 4. Write clean print HTML
    printWindow.document.write(`
    <html>
      <head>
        <title>Vendor Documents</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h2 {
            text-align: center;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            font-size: 12px;
            text-align: left;
          }
          th {
            background: #f3f4f6;
          }
          @page {
            margin: 15mm;
          }
        </style>
      </head>
      <body>
        <h2>Vendor Documents</h2>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

    printWindow.document.close();
  };

  useEffect(() => {
    fetchDocumentPermissions();
  }, []);
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     const actions = scanSmartyActions();
  //     SmartyActionStoreInstance.set("VendorDocuments", actions);
  //     console.log("🧠 Vendor Document Actions:", actions);
  //   }, 300);

  //   return () => clearTimeout(timer);
  // }, []);

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
  }, [
    currentPage,
    itemsPerPage,
    searchQuery,
    sortColumn,
    sortDirection,
    searchTrigger,
  ]);

  const renderColumnValue = (row: any, columnName: string) => {
    const value = row[columnName];

    if (DATE_COLUMNS.includes(columnName)) {
      return formatDate(value, "readable");
    }

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
      SearchTerm: value,
    };
  };

  useEffect(() => {
    if (!visibleColumns.some((c) => c.ColumnName === sortColumn)) {
      setSortColumn("DocumentId");
      setSortDirection("DESC");
    }
  }, [visibleColumns]);

  useEffect(() => {
    if (!showTable) return;

    const loadInitialTable = async () => {
      setColumnsReady(false);

      // 1️⃣ Load table data (creates registry)
      await fetchTableData();

      // 2️⃣ Load columns
      await fetchVisibleColumns();

      setColumnsReady(true);
    };

    loadInitialTable();
  }, [showTable, searchTrigger]);
if (permissionsLoading) return <Loader />;

if (!hasPageAccess) return <AccessRestricted />;

  return (
    <>
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
          <div className="trezo-card-title">
            <h5 className="!mb-0">Manage Vendor Documents</h5>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
            {/* RIGHT GROUP: Filters + Search + Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
              {/* 1. Filter Dropdown */}
              <div className="relative">
                <PermissionAwareTooltip
                  allowed={SmartActions.canAdvancedSearch(CURRENT_FORM_ID)}
                  allowedText="Search by"
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
            ${
              SmartActions.canAdvancedSearch(CURRENT_FORM_ID)
                ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            }`}
                    >
                      <option value={NO_FILTER}>Select Filter Option</option>
                      <option value="DocumentName">Vendor Document Name</option>
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
            ${
              SmartActions.canSearch(CURRENT_FORM_ID)
                ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            }`}
                    />
                  </div>
                </PermissionAwareTooltip>
              </div>

              {/* BUTTONS */}
              <div className="flex items-center gap-2">
                {/* SEARCH BUTTON */}
                <div className="relative group">
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
                </div>

                {/* {filterColumn && (
                  <PermissionAwareTooltip
                    allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                    allowedText="Reset filter"
                    deniedText="Permission required"
                  >
                    <button
                      type="button"
                      disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                      onClick={() => {
                        setFilterColumn("");
                        setSearchInput("");
                        setSearchQuery("");
                        setCurrentPage(1);
                        fetchTableData();
                      }}
                      className={`w-[34px] h-[34px] flex items-center justify-center rounded-md
        ${
          SmartActions.canSearch(CURRENT_FORM_ID)
            ? "border-gray-400 text-gray-600 hover:bg-gray-200"
            : "border-gray-300 text-gray-300 cursor-not-allowed"
        }`}
                    >
                      <i className="material-symbols-outlined text-[20px]">
                        refresh
                      </i>
                    </button>
                  </PermissionAwareTooltip>
                )} */}

                {/* COLUMN SELECTOR BUTTON */}
                <div className="relative group">
                  <PermissionAwareTooltip
                    allowed={SmartActions.canManageColumns(CURRENT_FORM_ID)}
                    allowedText="Manage Columns"
                    deniedText="You do not have permission to manage columns"
                  >
                    <div
                      className={`h-[34px] flex items-center ${
                        SmartActions.canManageColumns(CURRENT_FORM_ID)
                          ? ""
                          : "pointer-events-none opacity-50"
                      }`}
                    >
                      <ColumnSelector
                        procName="USP_VendorDocumentsMaster"
                        onApply={fetchVisibleColumns}
                        disabled={
                          !SmartActions.canManageColumns(CURRENT_FORM_ID)
                        }
                      />
                    </div>
                  </PermissionAwareTooltip>
                </div>

                {/* ADD BUTTON */}
                <div className="relative group">
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
                      <i className="material-symbols-outlined text-[20px]">
                        add
                      </i>
                    </button>
                  </PermissionAwareTooltip>
                </div>
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

        {!showTable && (
          <div
            className="w-full bg-white dark:bg-[#0c1427] rounded-md border border-gray-200 
                dark:border-[#172036] p-10 flex flex-col md:flex-row 
                items-center md:items-start justify-center md:gap-x-80 min-h-[450px]"
          >
            {/* LEFT SECTION */}
            <div className="md:max-w-md md:px-3 px-0 py-14">
              <h1 className="text-3xl font-semibold text-black dark:text-white mb-4">
                Manage Vendor Documents
              </h1>

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-[15px]">
                Search Documents data by <br />
                using above filters to edit, delete etc.
                <br />
                OR <br />
                Click Below to add New Vendor Document
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
      ${
        SmartActions.canAdd(CURRENT_FORM_ID)
          ? "bg-primary-button-bg text-white hover:bg-primary-button-bg-hover"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
                >
                  Add Vendor Document
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

                {/* Card Header - using primary-button-bg (darker) */}
                <path
                  d="M70 80H442C458.569 80 472 93.4315 472 110V130H40V110C40 93.4315 53.4315 80 70 80Z"
                  className="fill-primary-200"
                />

                {/* Content Lines/Items - also using primary-button-bg for contrast */}
                <g className="fill-primary-200">
                  <rect x="90" y="210" width="25" height="25" rx="6" />
                  <rect x="140" y="210" width="240" height="15" rx="7.5" />

                  <rect x="90" y="265" width="25" height="25" rx="6" />
                  <rect x="140" y="265" width="240" height="15" rx="7.5" />

                  <rect x="90" y="320" width="25" height="25" rx="6" />
                  <rect x="140" y="320" width="240" height="15" rx="7.5" />
                </g>

                {/* Magnifying Glass Handle - using primary-button-bg */}
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
                  columns={
                    visibleColumns.length > 0
                      ? visibleColumns.length + 1
                      : SKELETON_COLUMNS
                  }
                  showExportSkeleton
                  showPageSizeSkeleton
                />
              </div>
            ) : dataLoaded && tasks.length === 0 ? (
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
      className="stroke-primary-button-bg"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </svg>
                </div>
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
                        setHasVisitedTable(true);
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
                  <div className="flex items-center gap-2 leading-none">
                    {/* PDF */}
                    <div className="relative group">
                      <PermissionAwareTooltip
                        allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                        deniedText="Export permission required"
                      >
                        <button
                          type="button"
                          onClick={exportPDF}
                          className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-button-bg
          border border-primary-button-bg
          rounded-md
          hover:bg-primary-button-bg hover:text-white
          transition-all
          dark:hover:bg-gray-800 dark:hover:border-gray-600
        "
                        >
                          PDF
                        </button>
                      </PermissionAwareTooltip>

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
                        onClick={exportExcel}
                        className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-button-bg
          border border-primary-button-bg
          rounded-md
          hover:bg-primary-button-bg hover:text-white
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
                        onClick={exportCSV}
                        className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-button-bg
          border border-primary-button-bg
          rounded-md
          hover:bg-primary-button-bg hover:text-white
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

                    {/* Print */}
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={handlePrint}
                        className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-button-bg
          border border-primary-button-bg
          rounded-md
          hover:bg-primary-button-bg hover:text-white
          transition-all
          dark:hover:bg-gray-800 dark:hover:border-gray-600
        "
                      >
                        Print
                      </button>

                      <div
                        className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      >
                        Print
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
                        {visibleColumns.map((col) => (
                          <th
                            key={col.ColumnName}
                            onClick={() => handleSort(col.ColumnName)}
                            className={`
    font-medium ltr:text-left rtl:text-right px-[20px] py-[11px]
    whitespace-nowrap cursor-pointer transition-colors
    ${
      sortColumn === col.ColumnName
        ? "bg-primary-table-bg-hover dark:bg-[#1e2a4a]"
        : "bg-primary-table-bg dark:bg-[#15203c]"
    }
  `}
                          >
                            <div className="flex items-center gap-1 group font-semibold">
                              <span className="transition-colors">
                                {col.DisplayName}
                              </span>

                              <i
                                className={`
        material-symbols-outlined text-sm transition-all
        ${
          sortColumn === col.ColumnName
            ? "text-primary-button-bg dark:text-primary-button-bg-hover opacity-100"
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
                        <th className="px-[20px] py-[11px] text-left bg-primary-table-bg dark:bg-[#15203c]">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="text-black dark:text-white">
                      {displayedTasks.map((task: any) => (
                        <tr key={task.DocumentId}>
                          {visibleColumns.map((col) => (
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
                              <PermissionAwareTooltip
                                allowed={SmartActions.canEdit(CURRENT_FORM_ID)}
                                allowedText="Edit "
                                deniedText="No edit permission"
                              >
                                <button
                                  type="button"
                                  disabled={
                                    !SmartActions.canEdit(CURRENT_FORM_ID)
                                  }
                                  onClick={() => {
                                    if (!SmartActions.canEdit(CURRENT_FORM_ID))
                                      return;
                                    fetchEditData(task.DocumentId);
                                  }}
                                  className={
                                    SmartActions.canEdit(CURRENT_FORM_ID)
                                      ? "text-gray-500 hover:text-primary-button-bg"
                                      : "text-gray-300 cursor-not-allowed"
                                  }
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    edit
                                  </i>
                                </button>
                              </PermissionAwareTooltip>

                              {/* Delete */}
                              <PermissionAwareTooltip
                                allowed={SmartActions.canDelete(
                                  CURRENT_FORM_ID,
                                )}
                                allowedText="Delete "
                                deniedText="No delete permission"
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
                                    handleDelete(task.DocumentId);
                                  }}
                                  className={
                                    SmartActions.canDelete(CURRENT_FORM_ID)
                                      ? "text-danger-500 hover:text-danger-700"
                                      : "text-gray-300 cursor-not-allowed"
                                  }
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

        {/* Add New Form Category Modal */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          className="relative z-60"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
          />

          <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
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
                        {isEdit
                          ? "Edit Vendor Document"
                          : "Add New Vendor Document"}
                      </h5>
                    </div>
                    <button
                      type="button"
                      className="text-[23px] transition-all leading-none text-black dark:text-white hover:text-primary-button-bg"
                      onClick={() => setOpen(false)}
                    >
                      <i className="ri-close-fill"></i>
                    </button>
                  </div>

                  {/* Formik */}
                  {/* BODY */}
                  {editLoading ? (
                    <div className="flex items-center justify-center min-h-[280px]">
                      <div className="flex flex-col items-center gap-3">
                        <div className="theme-loader"></div>
                        <p className="text-sm text-gray-500">
                          Loading document...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Formik
                      initialValues={{
                        DocumentName: editData?.DocumentName || "",
                        IsAttachment: editData?.IsAttachment ?? false,
                      }}
                      enableReinitialize
                      validationSchema={formSchema}
                      onSubmit={async (values, { resetForm }) => {
                        try {
                          setSaving(true);

                          const payload = {
                            procName: "VendorDocumentsMaster",
                            Para: JSON.stringify({
                              DocumentName: values.DocumentName,
                              IsAttachment: values.IsAttachment,
                              ActionMode: isEdit ? "update" : "insert",
                              EditId:
                                isEdit && editData ? Number(editData.id) : 0,

                              CompanyId: 1,
                              EntryBy: 1,
                            }),
                          };

                          const response = await universalService(payload);
                          const res = Array.isArray(response)
                            ? response[0]
                            : response;

                          if (res?.StatusCode === "1") {
                            ShowSuccessAlert(
                              isEdit
                                ? "Vendor Document Updated Successfully"
                                : "Vendor Document Added Successfully",
                            );

                            setOpen(false);
                            setIsEdit(false);
                            resetForm();
                            fetchTableData();
                          }
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      {({ setFieldValue }) => {
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

                            {/* Category Name */}
                            <div>
                              <label className="mb-[10px] text-black dark:text-white font-medium block">
                                Vendor Document Name:
                                <span className="text-red-500">*</span>
                              </label>
                              <Field
                                type="text"
                                name="DocumentName"
                                placeholder="Enter Vendor Document Name"
                                className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0
transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400
focus:border-primary-button-bg"
                              />
                              <ErrorMessage
                                name="DocumentName"
                                component="p"
                                className="text-red-500 text-sm"
                              />
                            </div>

                            {/* TOGGLES */}
                            <div className="grid grid-cols-2 gap-[25px] mb-6">
                              <div className="flex items-center justify-between pr-4">
                                <label className="font-medium">
                                  Is Attachment:
                                </label>

                                <Field name="IsAttachment">
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
                            <hr className="border-0 border-t border-gray-200 dark:border-gray-700 my-4 mt-10 md:-mx-[25px] px-[20px] md:px-[25px]" />

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
                                className="px-[26.5px] py-[12px] rounded-md bg-primary-button-bg text-white hover:bg-primary-button-bg-hover"
                              >
                                {saving ? (
                                  <div className="flex items-center gap-2">
                                    <div className="theme-loader"></div>
                                    <span>Processing...</span>
                                  </div>
                                ) : isEdit ? (
                                  "Update Vendor Document"
                                ) : (
                                  "Add Vendor Document"
                                )}
                              </button>
                            </div>
                          </Form>
                        );
                      }}
                    </Formik>
                  )}
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
