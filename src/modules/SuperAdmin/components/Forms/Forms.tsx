import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Swal from "sweetalert2";
import * as Yup from "yup";
import { useLocation } from "react-router-dom";

// Common Route Imports
import { ApiService } from "../../../../services/ApiService";
import { SmartActions } from "../Security/SmartActionWithFormName";
import ActionCell from "../../../../components/CommonFormElements/DataTableComponents/ActionCell";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import ColumnSelector from "../ColumnSelector/ColumnSelectorV1";
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import ExportButtons from "../../../../components/CommonFormElements/ExportButtons/ExportButtons";
import CustomPagination from "../../../../components/CommonFormElements/Pagination/CustomPagination";
import customStyles from "../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import TableSkeleton from "./TableSkeleton";
import OopsNoData from "../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import { useSweetAlert } from "../../context/SweetAlertContext";
// import { SmartActions } from "../../../../DT_components/SmartActionWithFormName";
// import ActionCell from "../../../../DT_components/ActionCell";
// import Loader from "../../../../DT_components/Loader";
// import AccessRestricted from "../../../../DT_components/AccessRestricted";
// import PermissionAwareTooltip from "../../../../DT_components/PermissionAwareTooltip";
// import ColumnSelector from "../../../../DT_components/ColumnSelector";
// import LandingIllustration from "../../../../DT_components/LandingIllustration";
// import ExportButtons from "../../../../DT_components/ExportButtons";
// import customStyles from "../../../../DT_components/CustomStyles";
// import CustomPagination from "../../../../DT_components/CustomPagination";
// import TableSkeleton from "../../../../DT_components/TableSkeleton";
// import OopsNoData from "../../../../DT_components/OopsNoData";
// import { useSweetAlert } from "../../../../DT_components/Context/SweetAlertContext";

const Template: React.FC = () => {
  const formSchema = Yup.object().shape({
    module: Yup.string().required("Module is required"),
    parentCategory: Yup.string().required("Parent category is required"),
    formDisplayName: Yup.string().required("Form display name is required"),
    actionList: Yup.array().min(1, "At least one action is required"),
    emailSending: Yup.boolean(),
    showInMenu: Yup.boolean(),
  });

  const [searchInput, setSearchInput] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [showTable, setShowTable] = useState(false);
  const { universalService } = ApiService();
  const [hasVisitedTable, setHasVisitedTable] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [columns, setColumns] = useState<any[]>([]);
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortColumnKey, setSortColumnKey] = useState<string>("FormId");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
  const [columnsReady, setColumnsReady] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [refreshGrid, setRefreshGrid] = useState(0);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);
  const [initialSortReady, setInitialSortReady] = useState(false);

  const location = useLocation();
  const path = location.pathname;
  const segments = path.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  const isId = !isNaN(Number(last));
  const formName = isId ? segments[segments.length - 2] : last;
  const canExport = SmartActions.canExport(formName);

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const { ShowSuccessAlert, ShowConfirmAlert } = useSweetAlert();

  // Custom Form States
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const EmployeeIdLocalSTG =
    JSON.parse(localStorage.getItem("EmployeeDetails") || "{}").EmployeeId || 0;

  const fetchFormPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const payload = {
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "GetForms",
          FormName: formName,
          EmployeeId: EmployeeIdLocalSTG,
        }),
      };
      const response = await universalService(payload);
      const data = response?.data ?? response;

      if (!Array.isArray(data)) {
        setHasPageAccess(false);
        return;
      }

      const pagePermission = data.find(
        (p) =>
          String(p.FormNameWithExt).trim().toLowerCase() ===
          formName?.trim().toLowerCase(),
      );

      if (
        !pagePermission ||
        !pagePermission.Action ||
        pagePermission.Action.trim() === ""
      ) {
        setHasPageAccess(false);
        return;
      }

      SmartActions.load(data);
      setHasPageAccess(true);
    } catch (error) {
      console.error("Form permission fetch failed:", error);
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // --- Fetch Lookups (Modules & Categories) ---
  const fetchModules = async () => {
    try {
      const payload = {
        procName: "Modules",
        Para: JSON.stringify({ Action: "GetModules" }),
      };
      const response = await universalService(payload);
      const res = response?.data ?? response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (apiRes?.ModuleList) {
        const moduleArray = JSON.parse(apiRes.ModuleList);
        setModules(
          moduleArray.map((m: any) => ({
            id: m.ModuleID,
            name: m.ModuleTitle,
          })),
        );
      }
    } catch (error) {
      console.error("Module fetch error:", error);
    }
  };

  const fetchParentCategories = async (moduleId: string) => {
    if (!moduleId) {
      setParentCategories([]);
      return;
    }
    try {
      const payload = {
        procName: "Modules",
        Para: JSON.stringify({
          Action: "GetParentCategoryByModuleID",
          ModuleID: moduleId,
        }),
      };
      const response = await universalService(payload);
      const res = response?.data ?? response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (apiRes?.FormCategoryList) {
        const parsed = JSON.parse(apiRes.FormCategoryList);
        setParentCategories(
          parsed.map((c: any) => ({
            id: c.FormCategoryId,
            name: c.FormCategoryName,
          })),
        );
      } else {
        setParentCategories([]);
      }
    } catch (error) {
      console.error("Parent category fetch error:", error);
      setParentCategories([]);
    }
  };

  useEffect(() => {
    if (hasPageAccess) {
      fetchModules();
    }
  }, [hasPageAccess]);

  useEffect(() => {
    if (selectedModule) {
      fetchParentCategories(selectedModule);
    }
  }, [selectedModule]);

  // --- Grid Logic ---
  const renderActionList = (actions?: string) => {
    if (!actions) return "-";
    return (
      <div className="flex flex-wrap gap-2 w-full py-2">
        {actions.split(",").map((action, index) => (
          <span
            key={index}
            className="px-3 py-[3px] text-xs font-semibold rounded-full bg-primary-table-bg-hover text-primary-700 whitespace-nowrap"
          >
            {action.trim()}
          </span>
        ))}
      </div>
    );
  };

  const handleSort = (column: any, direction: string) => {
    setSortColumnKey(column.columnKey);
    setSortDirection(direction.toUpperCase());
    setInitialSortReady(true);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchGridData({ pageOverride: p });
  };

  const handlePerRowsChange = (newPerPage: number, page: number) => {
    setPerPage(newPerPage);
    setPage(page);
  };

  const fetchGridColumns = async () => {
    try {
      const payload = {
        procName: "GetUserGridColumns",
        Para: JSON.stringify({
          UserId: EmployeeIdLocalSTG,
          GridName: "USP_Forms",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;
      if (Array.isArray(data)) {
        const visibleSorted = data
          .filter((c: any) => c.IsVisible)
          .sort((a: any, b: any) => a.ColumnOrder - b.ColumnOrder);

        const defaultSortCol = visibleSorted.find((c: any) => c.isSort);

        if (defaultSortCol) {
          setSortColumnKey(defaultSortCol.ColumnKey);
          setSortDirection((defaultSortCol.SortDir || "ASC").toUpperCase());
        }
        setInitialSortReady(true);
      }

      if (Array.isArray(data)) {
        const reactCols = data
          .filter((c: any) => c.IsVisible === true)
          .sort((a: any, b: any) => a.ColumnOrder - b.ColumnOrder)
          .map((c: any, colIndex: number) => ({
            id: c.ColumnOrder,
            name: c.DisplayName,
            sortable: true,
            columnKey: c.ColumnKey,
            columnIndex: c.ColumnOrder,
            isCurrency: c.IsCurrency,
            isTotal: c.IsTotal,

            // 🔥 ADD THIS PART
            ...(c.ColumnKey === "ActionList" && {
              minWidth: "700px",
              maxWidth: "1000px",
              grow: 2, 
              wrap: true,
            }),

            selector: (row: any) => row[c.ColumnKey],

            cell: (row: any) => {
              if (row.__isTotal) {
                if (colIndex === 0) return "Total";
                if (c.IsTotal) {
                  const value = row[c.ColumnKey] || 0;
                  return c.IsCurrency
                    ? `$${Number(value).toLocaleString()}`
                    : Number(value).toLocaleString();
                }
                return "";
              }

              if (c.ColumnKey === "ActionList") {
                return renderActionList(row.ActionList);
              }

              if (
                c.ColumnKey === "HasEmailSending" ||
                c.ColumnKey === "ShowInMenu"
              ) {
                return row[c.ColumnKey] === true ||
                  row[c.ColumnKey] === 1 ||
                  row[c.ColumnKey] === "1"
                  ? "Yes"
                  : "No";
              }

              const value = row[c.ColumnKey];
              if (c.IsCurrency && value != null) {
                return `$${Number(value).toLocaleString()}`;
              }
              return value ?? "-";
            },
          }));

        const actionColumn = {
          name: "Action",
          cell: (row: any) => {
            if (row.__isTotal) return null;
            return (
              <ActionCell
                row={row}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          },
          ignoreRowClick: true,
          button: true,
        };
        setColumns([...reactCols, actionColumn]);
      } else {
        setColumns([]);
      }
    } catch (err) {
      console.error("Grid columns fetch failed", err);
      setColumns([]);
    }
  };

  const fetchExportData = async () => {
    const payload = {
      procName: "Forms",
      Para: JSON.stringify({
        SearchBy: filterColumn,
        Criteria: searchInput,
        Page: page,
        PageSize: 0,
        SortIndexColumn: sortColumnKey || "",
        SortDir: sortDirection,
        ActionMode: "Export", // Use Export action mode if supported, or GetReport with PageSize 0
      }),
    };
    const res = await universalService(payload);
    return res?.data ?? res ?? [];
  };

  const handleDelete = async (row: any) => {
    const result = await ShowConfirmAlert(
      "Are you sure?",
      "You won't be able to revert this!",
    );
    if (!result) return;

    try {
      const payload = {
        procName: "Forms",
        Para: JSON.stringify({
          ActionMode: "Delete",
          EditId: row.FormId,
          EntryBy: EmployeeIdLocalSTG,
        }),
      };
      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response;

      if (
        res?.StatusCode === 1 ||
        res?.StatusCode === "1" ||
        res?.Status === 1
      ) {
        await ShowSuccessAlert("Form Deleted Successfully");
        setSearchTrigger((p) => p + 1);
        setRefreshGrid((p) => p + 1);
      } else {
        Swal.fire("Error", res?.Msg || "Delete failed", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server error", "error");
    }
  };

  const fetchGridData = async (options?: any) => {
    const pageToUse = options?.pageOverride ?? page;
    const perPageToUse = options?.perPageOverride ?? perPage;

    try {
      setTableLoading(true);
      const payload = {
        procName: "Forms",
        Para: JSON.stringify({
          ActionMode: "GetReport",
          SearchBy: options?.searchBy ?? filterColumn ?? "",
          Criteria: options?.criteria ?? searchInput ?? "",
          Page: pageToUse,
          PageSize: perPageToUse,
          SortIndexColumn: sortColumnKey || "",
          SortDir: sortDirection,
        }),
      };

      const res = await universalService(payload);
      const result = res?.data || res;

      if (result?.rows && Array.isArray(result.rows)) {
        setData(result.rows);
        setTotalRows(result[0]?.TotalRecords || 0);
      } else if (Array.isArray(result)) {
        setData(result);
        setTotalRows(result[0]?.TotalRecords || 0);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  const fetchVisibleColumns = async () => {
    const payload = {
      procName: "UniversalColumnSelector",
      Para: JSON.stringify({
        EmployeeId: EmployeeIdLocalSTG,
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
      setRefreshGrid((prev) => prev + 1);
    }
  };

  useEffect(() => {
    fetchGridColumns();
  }, [refreshGrid]);

  useEffect(() => {
    if (!showTable || !hasVisitedTable) return;
    if (!sortColumnKey && initialSortReady) {
      fetchGridData();
      return;
    }
    if (sortColumnKey) {
      fetchGridData();
    }
  }, [
    page,
    perPage,
    sortColumnKey,
    sortDirection,
    searchTrigger,
    initialSortReady,
  ]);

  const applySearch = () => {
    if (!SmartActions.canSearch(formName)) return;
    setShowTable(true);
    setHasVisitedTable(true);
    setPage(1);
    setSearchTrigger((p) => p + 1);
  };

  const hasData = data.length > 0;

  useEffect(() => {
    fetchFormPermissions();
  }, []);

  const pageTotals: any = {};
  columns.forEach((col: any) => {
    if (!col.isTotal || !col.columnKey) return;
    pageTotals[col.columnKey] = data.reduce((sum: number, row: any) => {
      return sum + Number(row[col.columnKey] || 0);
    }, 0);
  });

  const totalRow =
    Object.keys(pageTotals).length > 0
      ? columns.reduce((acc: any, col: any, index: number) => {
          if (!col.columnKey) {
            acc.__label = "Page Total";
            return acc;
          }
          if (col.isTotal) {
            acc[col.columnKey] = pageTotals[col.columnKey];
          } else {
            acc[col.columnKey] = "";
          }
          return acc;
        }, {})
      : null;

  const tableData =
    hasData && totalRow ? [...data, { ...totalRow, __isTotal: true }] : data;

  // --- Add / Edit Handlers ---
  const handleAdd = () => {
    if (!SmartActions.canAdd(formName)) return;
    setIsEdit(false);
    setEditData(null);
    setSelectedModule("");
    setTags([]);
    setOpen(true);
  };

  const handleEdit = async (row: any) => {
    setEditLoading(true);
    setOpen(true);
    setIsEdit(true);

    try {
      const payload = {
        procName: "Forms",
        Para: JSON.stringify({
          ActionMode: "Select",
          EditId: row.FormId,
        }),
      };
      const response = await universalService(payload);
      const data = Array.isArray(response?.data || response)
        ? (response?.data || response)[0]
        : response?.data || response;

      setEditData(data || row);
      setSelectedModule(String(data?.ModuleId || row.ModuleId || ""));

      if (data?.ActionList || row.ActionList) {
        setTags(
          (data?.ActionList || row.ActionList)
            .split(",")
            .map((t: string) => t.trim()),
        );
      } else {
        setTags([]);
      }
    } catch (error) {
      console.error(error);
      setEditData(row);
    }
    setTimeout(() => setEditLoading(false), 200);
  };

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setIsEdit(false);
        setEditData(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const exportColumns = columns
    .filter((c) => c.columnKey)
    .map((c) => ({ key: c.columnKey, label: c.name }));

  if (permissionsLoading) {
    return <Loader />;
  }

  if (!hasPageAccess) {
    return <AccessRestricted />;
  }

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* --- HEADER & SEARCH SECTION --- */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Manage Forms
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            {/* 1. Filter Dropdown */}
            <div className="relative w-full sm:w-[180px]">
              <PermissionAwareTooltip
                allowed={SmartActions.canAdvancedSearch(formName)}
                allowedText="Search By"
              >
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                  <i className="material-symbols-outlined !text-[18px]">
                    filter_list
                  </i>
                </span>
                <select
                  value={filterColumn}
                  onChange={(e) => setFilterColumn(e.target.value)}
                  className={`w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border transition-all
                           ${
                             SmartActions.canAdvancedSearch(formName)
                               ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                               : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                           }`}
                >
                  <option value="">Select Filter Option</option>
                  <option value="FormDisplayName">Form Name</option>
                  <option value="FormCategoryName">Category Name</option>
                  <option value="ModuleTitle">Module Name</option>
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                  <i className="material-symbols-outlined !text-[18px]">
                    expand_more
                  </i>
                </span>
              </PermissionAwareTooltip>
            </div>

            {/* 2. Search Input */}
            <div className="relative">
              <PermissionAwareTooltip
                allowed={SmartActions.canSearch(formName)}
                allowedText="Enter Criteria"
              >
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                  <i className="material-symbols-outlined !text-[18px]">
                    search
                  </i>
                </span>
                <input
                  type="text"
                  value={searchInput}
                  placeholder="Enter Criteria..."
                  disabled={!SmartActions.canSearch(formName)}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                  className={`h-[34px] w-full pl-8 pr-3 text-xs rounded-md outline-none border transition-all
                           ${
                             SmartActions.canSearch(formName)
                               ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                               : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                           }`}
                />
              </PermissionAwareTooltip>
            </div>

            {/* 3. BUTTONS GROUP */}
            <div className="flex items-center gap-2">
              <PermissionAwareTooltip
                allowed={SmartActions.canSearch(formName)}
                allowedText="Search"
              >
                <button
                  type="button"
                  onClick={applySearch}
                  disabled={!SmartActions.canSearch(formName)}
                  className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all shadow-sm disabled:opacity-50"
                >
                  <i className="material-symbols-outlined text-[20px]">
                    search
                  </i>
                </button>
              </PermissionAwareTooltip>

              <PermissionAwareTooltip
                allowed={SmartActions.canManageColumns(formName)}
                allowedText="Manage Columns"
              >
                <div
                  className={`h-[34px] flex items-center ${!SmartActions.canManageColumns(formName) ? "pointer-events-none opacity-50" : ""}`}
                >
                  <ColumnSelector
                    procName="USP_Forms"
                    onApply={fetchVisibleColumns}
                  />
                </div>
              </PermissionAwareTooltip>

              <PermissionAwareTooltip
                allowed={SmartActions.canAdd(formName)}
                allowedText="Add New"
              >
                <button
                  type="button"
                  disabled={!SmartActions.canAdd(formName)}
                  onClick={handleAdd}
                  className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all shadow-sm disabled:opacity-50"
                >
                  <i className="material-symbols-outlined text-[20px]">add</i>
                </button>
              </PermissionAwareTooltip>
            </div>

            {(filterColumn || searchInput) && (
              <PermissionAwareTooltip
                allowed={SmartActions.canSearch(formName)}
                allowedText="Reset filter"
              >
                <button
                  type="button"
                  disabled={!SmartActions.canSearch(formName)}
                  onClick={() => {
                    setFilterColumn("");
                    setSearchInput("");
                    setPage(1);
                    setSearchTrigger((p) => p + 1);
                  }}
                  className={`w-[34px] h-[34px] flex items-center justify-center rounded-md
                    ${SmartActions.canSearch(formName) ? "border border-gray-400 text-gray-600 hover:bg-gray-200" : "border border-gray-300 text-gray-300 cursor-not-allowed"}`}
                >
                  <i className="material-symbols-outlined text-[20px]">
                    refresh
                  </i>
                </button>
              </PermissionAwareTooltip>
            )}
          </div>
        </div>
      </div>

      {!showTable && (
        <LandingIllustration
          title="Manage Forms"
          addLabel="Add Form"
          formName={formName}
          description={
            <>
              Search Form data by using above filters to edit, delete etc.
              <br />
              <span className="font-medium">OR</span>
              <br />
              Click on Add button to create a new form entry.
            </>
          }
        />
      )}

      {showTable && (
        <div>
          {tableLoading ? (
            <div className="flex justify-between items-center py-2 animate-pulse">
              <div className="h-8 w-[120px] bg-gray-200 dark:bg-gray-700 rounded-md" />
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md" />
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md" />
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md" />
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md" />
              </div>
            </div>
          ) : hasData ? (
            <div className="flex justify-between items-center py-2 mb-[10px]">
              {/* PAGE SIZE */}
              <div className="relative">
                <select
                  value={perPage}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    setPerPage(size);
                    setPage(1);
                    fetchGridData({ pageOverride: 1, perPageOverride: size });
                  }}
                  className="h-8 w-[120px] px-3 pr-7 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all appearance-none"
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

              {/* EXPORT */}
              <PermissionAwareTooltip allowed={canExport}>
                <div
                  className={!canExport ? "pointer-events-none opacity-50" : ""}
                >
                  <ExportButtons
                    title="Forms Report"
                    columns={exportColumns}
                    fetchData={fetchExportData}
                    disabled={!canExport}
                  />
                </div>
              </PermissionAwareTooltip>
            </div>
          ) : null}

          {/* --- CONTENT CONTAINER --- */}
          <div className="trezo-card-content bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <DataTable
              columns={columns}
              data={tableData}
              customStyles={customStyles}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationComponent={(props) => (
                <CustomPagination
                  {...props}
                  currentPage={page}
                  rowsPerPage={perPage}
                />
              )}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handlePerRowsChange}
              onSort={handleSort}
              sortServer
              defaultSortFieldId={
                columns.find((col) => col.columnKey === sortColumnKey)?.id
              }
              defaultSortAsc={sortDirection === "ASC"}
              progressPending={tableLoading}
              progressComponent={
                <TableSkeleton rows={perPage} columns={columns.length || 8} />
              }
              conditionalRowStyles={[
                {
                  when: (row) => row.__isTotal,
                  style: {
                    fontWeight: 700,
                    backgroundColor: "var(--color-primary-table-bg)",
                  },
                },
              ]}
              noDataComponent={!tableLoading && <OopsNoData />}
            />
          </div>
        </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-60"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-[650px] data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
            >
              <div className="trezo-card w-full bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
                {/* Header */}
                <div className="trezo-card-header bg-gray-50 dark:bg-[#15203c] mb-[20px] md:mb-[25px] flex items-center justify-between -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px] p-[20px] md:p-[25px] rounded-t-md">
                  <div className="trezo-card-title">
                    <h5 className="!mb-0">
                      {isEdit ? "Edit Form" : "Add Form"}
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
                {editLoading ? (
                  <div className="flex items-center justify-center min-h-[280px]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="theme-loader"></div>
                      <p className="text-sm text-gray-500">
                        Loading form details...
                      </p>
                    </div>
                  </div>
                ) : (
                  <Formik
                    initialValues={{
                      module: editData ? String(editData.ModuleId) : "",
                      parentCategory: editData
                        ? String(editData.FormCategoryId)
                        : "",
                      formDisplayName: editData?.FormDisplayName || "",
                      formName: editData?.FormNameWithExt || "",
                      emailSending: editData
                        ? Boolean(editData.HasEmailSending)
                        : false,
                      showInMenu: editData
                        ? Boolean(editData.ShowInMenu)
                        : false,
                      actionList: editData?.ActionList
                        ? editData.ActionList.split(",").map((t: string) =>
                            t.trim(),
                          )
                        : [],
                    }}
                    enableReinitialize
                    validationSchema={formSchema}
                    onSubmit={async (values, { resetForm }) => {
                      const confirm = await Swal.fire({
                        title: isEdit ? "Update Form?" : "Add Form?",
                        text: "Do you want to continue?",
                        icon: "question",
                        showCancelButton: true,
                        confirmButtonText: "Yes",
                        cancelButtonText: "Cancel",
                      });

                      if (!confirm.isConfirmed) return;

                      try {
                        setSaving(true);
                        Swal.fire({
                          title: "Processing...",
                          allowOutsideClick: false,
                          didOpen: () => Swal.showLoading(),
                        });

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
                            EntryBy: EmployeeIdLocalSTG,
                            ModifiedBy: EmployeeIdLocalSTG,
                            EditId: isEdit ? Number(editData?.FormId) : 0,
                          }),
                        };

                        const response = await universalService(payload);
                        const res = Array.isArray(response)
                          ? response[0]
                          : response;

                        Swal.close();

                        if (res?.StatusCode === 1 || res?.StatusCode === "1") {
                          await Swal.fire({
                            icon: "success",
                            title: isEdit ? "Updated!" : "Added!",
                            text: res?.Msg || "Form saved successfully",
                            timer: 1500,
                            showConfirmButton: false,
                          });

                          resetForm();
                          setOpen(false);

                          setPage(1);
                          setSearchTrigger((p) => p + 1);
                          setRefreshGrid((p) => p + 1);
                        } else {
                          Swal.fire(
                            "Error",
                            res?.Msg || "Operation failed",
                            "error",
                          );
                        }
                      } catch (err) {
                        console.error("Form save error:", err);
                        Swal.fire("Error", "Server error", "error");
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {({ errors, touched, setFieldValue, values }) => (
                      <Form className="space-y-5">
                        {/* SELECT MODULE */}
                        <div>
                          <label className="mb-[10px] text-black dark:text-white font-medium block">
                            Select Module:{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Field
                              as="select"
                              name="module"
                              onChange={(e: any) => {
                                setFieldValue("module", e.target.value);
                                setFieldValue("parentCategory", ""); // reset category when module changes
                                setSelectedModule(e.target.value);
                              }}
                              className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all focus:border-primary-button-bg appearance-none"
                            >
                              <option value="">Select Module</option>
                              {modules.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </Field>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                              <i className="material-symbols-outlined !text-[20px]">
                                expand_more
                              </i>
                            </span>
                          </div>
                          <ErrorMessage
                            name="module"
                            component="p"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>

                        {/* SELECT PARENT CATEGORY */}
                        <div>
                          <label className="mb-[10px] text-black dark:text-white font-medium block">
                            Parent Category:{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Field
                              as="select"
                              name="parentCategory"
                              className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all focus:border-primary-button-bg appearance-none"
                            >
                              <option value="">Select Parent Category</option>
                              {selectedModule &&
                                parentCategories.length === 0 && (
                                  <option disabled>
                                    No Parent Category Found
                                  </option>
                                )}
                              {parentCategories.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </Field>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                              <i className="material-symbols-outlined !text-[20px]">
                                expand_more
                              </i>
                            </span>
                          </div>
                          <ErrorMessage
                            name="parentCategory"
                            component="p"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>

                        {/* FORM DISPLAY NAME */}
                        <div>
                          <label className="mb-[10px] text-black dark:text-white font-medium block">
                            Form Display Name:{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Field
                            name="formDisplayName"
                            className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 focus:border-primary-button-bg"
                            placeholder="Enter form display name"
                          />
                          <ErrorMessage
                            name="formDisplayName"
                            component="p"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>

                        {/* FORM NAME WITH EXTENSION */}
                        <div>
                          <label className="mb-[10px] text-black dark:text-white font-medium block">
                            Form Name Without Extension:
                          </label>
                          <div className="flex items-center">
                            <div className="h-[55px] w-[55px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-[#172036] rounded-l-md border-r-0">
                              <i className="ri-tools-fill text-gray-400 text-xl"></i>
                            </div>
                            <Field
                              name="formName"
                              className="h-[55px] text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] w-full outline-0 transition-all placeholder:text-gray-500 focus:border-primary-button-bg"
                              placeholder="Form name"
                            />
                            <button
                              type="button"
                              className="h-[55px] min-w-[130px] px-[15px] bg-primary-button-bg hover:bg-primary-button-bg-hover transition-colors text-white rounded-r-md flex items-center justify-center whitespace-nowrap shrink-0"
                            >
                              Fetch Action List
                            </button>
                          </div>
                          <ErrorMessage
                            name="formName"
                            component="p"
                            className="text-red-500 text-sm mt-1"
                          />
                        </div>

                        {/* ACTION LIST (TAGS) */}
                        <div>
                          <label className="mb-[10px] text-black dark:text-white font-medium block">
                            Action List: <span className="text-red-500">*</span>
                          </label>
                          <div
                            className="flex flex-wrap items-center gap-2 border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] rounded-md p-2 min-h-[55px] focus-within:border-primary-button-bg transition-colors cursor-text"
                            onClick={() =>
                              document.getElementById("tagInput")?.focus()
                            }
                          >
                            {tags.map((tag, index) => (
                              <span
                                key={index}
                                className="flex items-center gap-1 bg-primary-table-bg-hover text-primary-700 dark:bg-[#1e2a4a] dark:text-primary-300 px-3 py-1 rounded-full text-sm font-medium"
                              >
                                {tag}
                                <button
                                  type="button"
                                  className="hover:text-red-500 focus:outline-none ml-1 leading-none"
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
                                tags.length === 0
                                  ? "e.g., add, edit, delete (Press Enter)"
                                  : ""
                              }
                              className="outline-none flex-grow bg-transparent text-sm text-black dark:text-white placeholder:text-gray-400 min-w-[150px]"
                            />
                          </div>
                          {errors.actionList &&
                            typeof errors.actionList === "string" && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.actionList}
                              </p>
                            )}
                        </div>

                        {/* TOGGLES */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[25px]">
                          {/* EMAIL SENDING */}
                          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-[#172036] rounded-md">
                            <label className="font-medium text-black dark:text-white">
                              E-Mail Sending
                            </label>
                            <Field name="emailSending">
                              {({ field }: any) => (
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) =>
                                      setFieldValue(
                                        "emailSending",
                                        e.target.checked,
                                      )
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-primary-button-bg transition-colors"></div>
                                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                                </label>
                              )}
                            </Field>
                          </div>

                          {/* SHOW IN MENU */}
                          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-[#172036] rounded-md">
                            <label className="font-medium text-black dark:text-white">
                              Show In Menu
                            </label>
                            <Field name="showInMenu">
                              {({ field }: any) => (
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) =>
                                      setFieldValue(
                                        "showInMenu",
                                        e.target.checked,
                                      )
                                    }
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-primary-button-bg transition-colors"></div>
                                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
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
                            className="mr-[15px] px-[26.5px] py-[12px] rounded-md bg-danger-500 text-white hover:bg-danger-400 transition-colors"
                            onClick={() => setOpen(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="px-[26.5px] py-[12px] rounded-md bg-primary-button-bg text-white hover:bg-primary-button-bg-hover transition-colors disabled:opacity-50"
                          >
                            {saving ? (
                              <div className="flex items-center gap-2">
                                <div className="theme-loader"></div>
                                <span>Processing...</span>
                              </div>
                            ) : isEdit ? (
                              "Update Form"
                            ) : (
                              "Add Form"
                            )}
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                )}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Template;
