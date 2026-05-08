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
import IconsPopUpPage from "../Icons/IconsPopUpPage";
import ColorPickerPopup from "../Colors/ColorPickerPopup";

// ─────────────────────────────────────────────────────────────────────────────
// extractSvg
// API returns icons as SVG wrapped in HTML comments:
//   <!--begin::Svg Icon | path:...--> <svg>...</svg> <!--end::Svg Icon-->
// This strips the comments and returns just the <svg>...</svg> string.
// Returns null if no valid SVG found → fallback material icon shown.
// ─────────────────────────────────────────────────────────────────────────────
function extractSvg(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("<svg")) return trimmed;
  const match = trimmed.match(/<svg[\s\S]*?<\/svg>/i);
  return match ? match[0] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// IconCell
// Renders the SVG icon from API response with proper colorization,
// OR falls back to a material-symbols icon if SVG is invalid/missing.
// ─────────────────────────────────────────────────────────────────────────────
const IconCell: React.FC<{
  iconRaw: string | null | undefined;
  iconColor: string;
  fallback?: string;
  label: string;
}> = ({ iconRaw, iconColor, fallback = "category", label }) => {
  const svgString = extractSvg(iconRaw);

  return (
    <div className="flex items-center gap-2">
      {svgString ? (
        <span
          className="flex-shrink-0"
          style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center" }}
          dangerouslySetInnerHTML={{
            __html: svgString
              // Normalize size
              .replace(/width="24px"/g,  'width="22"')
              .replace(/height="24px"/g, 'height="22"')
              .replace(/width="24"/g,    'width="22"')
              .replace(/height="24"/g,   'height="22"')
              // Colorize solid black fills with stored icon color
              .replace(/fill="#000000"/g,   `fill="${iconColor}"`)
              .replace(/fill="#000"/g,      `fill="${iconColor}"`)
              // Keep opacity-based paths legible (they use opacity="0.3" etc.)
          }}
        />
      ) : (
        <span
          className="material-symbols-outlined flex-shrink-0"
          style={{ fontSize: 20, color: iconColor }}
        >
          {fallback}
        </span>
      )}
      <span>{label}</span>
    </div>
  );
};


const Template: React.FC = () => {
  const formSchema = Yup.object().shape({
    module: Yup.string().required("Module is required"),
    formCategoryName: Yup.string().required("Category name is required"),
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
  const [sortColumnKey, setSortColumnKey] = useState<string>("FormCategoryId");
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

  // Custom States
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [openIconPopup, setOpenIconPopup] = useState(false);
  const [openColorPopup, setOpenColorPopup] = useState(false);

  const formikRef = React.useRef<any>(null);

  const EmployeeIdLocalSTG = JSON.parse(
    localStorage.getItem("EmployeeDetails") || "{}"
  ).EmployeeId || 0;

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

      if (!Array.isArray(data)) { setHasPageAccess(false); return; }

      const pagePermission = data.find(
        (p) => String(p.FormNameWithExt).trim().toLowerCase() === formName?.trim().toLowerCase(),
      );

      if (!pagePermission || !pagePermission.Action || pagePermission.Action.trim() === "") {
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
        setModules(moduleArray.map((m: any) => ({ id: m.ModuleID, name: m.ModuleTitle })));
      }
    } catch (error) {
      console.error("Module fetch error:", error);
    }
  };

  const fetchParentCategories = async (moduleId: string) => {
    if (!moduleId) { setParentCategories([]); return; }
    try {
      const payload = {
        procName: "Modules",
        Para: JSON.stringify({ Action: "GetParentCategoryByModuleID", ModuleID: moduleId }),
      };
      const response = await universalService(payload);
      const res = response?.data ?? response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (apiRes?.FormCategoryList) {
        const parsed = JSON.parse(apiRes.FormCategoryList);
        setParentCategories(parsed.map((c: any) => ({ id: c.FormCategoryId, name: c.FormCategoryName })));
      } else {
        setParentCategories([]);
      }
    } catch (error) {
      console.error("Parent category fetch error:", error);
      setParentCategories([]);
    }
  };

  useEffect(() => { if (hasPageAccess) fetchModules(); }, [hasPageAccess]);
  useEffect(() => { if (selectedModule) fetchParentCategories(selectedModule); }, [selectedModule]);

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
          GridName: "USP_MemberFormCategory",
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
            selector: (row: any) => row[c.ColumnKey],
            cell: (row: any) => {
              if (row.__isTotal) {
                if (colIndex === 0) return "Total";
                if (c.IsTotal) {
                  const value = row[c.ColumnKey] || 0;
                  return c.IsCurrency ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString();
                }
                return "";
              }

              // ✅ FormCategoryName — render SVG icon from API
              if (c.ColumnKey === "FormCategoryName") {
                return (
                  <IconCell
                    iconRaw={row.FormCategoryIcon}
                    iconColor={row.FormCategoryIconColor || "#1976d2"}
                    fallback="category"
                    label={row.FormCategoryName || "-"}
                  />
                );
              }

              // ✅ ParentCategoryName — render SVG icon from API
              if (c.ColumnKey === "ParentCategoryName") {
                if (!row.ParentCategoryName) return "-";
                return (
                  <IconCell
                    iconRaw={row.ParentCategoryIcon}
                    iconColor={row.ParentCategoryIconColor || "#1976d2"}
                    fallback="folder"
                    label={row.ParentCategoryName}
                  />
                );
              }

              const value = row[c.ColumnKey];
              if (c.IsCurrency && value != null) return `$${Number(value).toLocaleString()}`;
              return value ?? "-";
            },
          }));

        const actionColumn = {
          name: "Action",
          cell: (row: any) => {
            if (row.__isTotal) return null;
            return <ActionCell row={row} onEdit={handleEdit} onDelete={handleDelete} />;
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
      procName: "MemberFormCategory",
      Para: JSON.stringify({
        SearchBy: filterColumn,
        Criteria: searchInput,
        Page: page,
        PageSize: 0,
        SortIndexColumn: sortColumnKey || "",
        SortDir: sortDirection,
        ActionMode: "Export",
      }),
    };
    const res = await universalService(payload);
    return res?.data ?? res ?? [];
  };

  const handleDelete = async (row: any) => {
    const result = await ShowConfirmAlert("Are you sure?", "You won't be able to revert this!");
    if (!result) return;

    try {
      const payload = {
        procName: "MemberFormCategory",
        Para: JSON.stringify({
          ActionMode: "Delete",
          EditId: row.FormCategoryId,
          EntryBy: EmployeeIdLocalSTG,
        }),
      };
      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response;

      if (res?.StatusCode === 1 || res?.StatusCode === "1" || res?.Status === 1) {
        await ShowSuccessAlert("Category Deleted Successfully");
        setSearchTrigger(p => p + 1);
        setRefreshGrid(p => p + 1);
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
        procName: "MemberFormCategory",
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
        USPName: "USP_MemberFormCategory",
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
            IsVisible: c.IsVisible === true || c.IsVisible === 1 || c.IsVisible === "1",
            IsHidden: c.IsHidden === false || c.IsHidden === 0 || c.IsHidden === "0",
          }))
          .sort((a, b) => a.DisplayOrder - b.DisplayOrder),
      );
      setColumnsReady(true);
      setRefreshGrid((prev) => prev + 1);
    }
  };

  useEffect(() => { fetchGridColumns(); }, [refreshGrid]);

  useEffect(() => {
    if (!showTable || !hasVisitedTable) return;
    if (!sortColumnKey && initialSortReady) { fetchGridData(); return; }
    if (sortColumnKey) fetchGridData();
  }, [page, perPage, sortColumnKey, sortDirection, searchTrigger, initialSortReady]);

  const applySearch = () => {
    if (!SmartActions.canSearch(formName)) return;
    setShowTable(true);
    setHasVisitedTable(true);
    setPage(1);
    setSearchTrigger((p) => p + 1);
  };

  const hasData = data.length > 0;

  useEffect(() => { fetchFormPermissions(); }, []);

  const pageTotals: any = {};
  columns.forEach((col: any) => {
    if (!col.isTotal || !col.columnKey) return;
    pageTotals[col.columnKey] = data.reduce((sum: number, row: any) => {
      return sum + Number(row[col.columnKey] || 0);
    }, 0);
  });

  const totalRow =
    Object.keys(pageTotals).length > 0
      ? columns.reduce((acc: any, col: any) => {
          if (!col.columnKey) { acc.__label = "Page Total"; return acc; }
          if (col.isTotal) acc[col.columnKey] = pageTotals[col.columnKey];
          else acc[col.columnKey] = "";
          return acc;
        }, {})
      : null;

  const tableData = hasData && totalRow ? [...data, { ...totalRow, __isTotal: true }] : data;

  const handleAdd = () => {
    if (!SmartActions.canAdd(formName)) return;
    setIsEdit(false);
    setEditData(null);
    setSelectedModule("");
    setOpen(true);
  };

  const handleEdit = async (row: any) => {
    setEditLoading(true);
    setOpen(true);
    setIsEdit(true);

    try {
      const payload = {
        procName: "MemberFormCategory",
        Para: JSON.stringify({ ActionMode: "Select", EditId: row.FormCategoryId }),
      };
      const response = await universalService(payload);
      const data = Array.isArray(response?.data || response)
        ? (response?.data || response)[0]
        : (response?.data || response);

      setEditData(data || row);
      setSelectedModule(String(data?.ModuleId || row.ModuleId || ""));
    } catch (error) {
      console.error(error);
      setEditData(row);
    }
    setTimeout(() => setEditLoading(false), 200);
  };

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => { setIsEdit(false); setEditData(null); }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const exportColumns = columns.filter(c => c.columnKey).map(c => ({ key: c.columnKey, label: c.name }));

  if (permissionsLoading) return <Loader />;
  if (!hasPageAccess) return <AccessRestricted />;

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* --- HEADER & SEARCH SECTION --- */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Manage Member Form Categories
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">

            <div className="relative w-full sm:w-[180px]">
              <PermissionAwareTooltip allowed={SmartActions.canAdvancedSearch(formName)} allowedText="Search By">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                  <i className="material-symbols-outlined !text-[18px]">filter_list</i>
                </span>
                <select
                  value={filterColumn}
                  onChange={(e) => setFilterColumn(e.target.value)}
                  className={`w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border transition-all
                    ${SmartActions.canAdvancedSearch(formName)
                      ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                >
                  <option value="">Select Filter Option</option>
                  <option value="FormCategoryName">Category Name</option>
                  <option value="ParentCategoryName">Parent Category Name</option>
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                  <i className="material-symbols-outlined !text-[18px]">expand_more</i>
                </span>
              </PermissionAwareTooltip>
            </div>

            <div className="relative">
              <PermissionAwareTooltip allowed={SmartActions.canSearch(formName)} allowedText="Enter Criteria">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                  <i className="material-symbols-outlined !text-[18px]">search</i>
                </span>
                <input
                  type="text"
                  value={searchInput}
                  placeholder="Enter Criteria..."
                  disabled={!SmartActions.canSearch(formName)}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                  className={`h-[34px] w-full pl-8 pr-3 text-xs rounded-md outline-none border transition-all
                    ${SmartActions.canSearch(formName)
                      ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                />
              </PermissionAwareTooltip>
            </div>

            <div className="flex items-center gap-2">
              <PermissionAwareTooltip allowed={SmartActions.canSearch(formName)} allowedText="Search">
                <button
                  type="button"
                  onClick={applySearch}
                  disabled={!SmartActions.canSearch(formName)}
                  className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all shadow-sm disabled:opacity-50"
                >
                  <i className="material-symbols-outlined text-[20px]">search</i>
                </button>
              </PermissionAwareTooltip>

              <PermissionAwareTooltip allowed={SmartActions.canManageColumns(formName)} allowedText="Manage Columns">
                <div className={`h-[34px] flex items-center ${!SmartActions.canManageColumns(formName) ? "pointer-events-none opacity-50" : ""}`}>
                  <ColumnSelector procName="USP_MemberFormCategory" onApply={fetchVisibleColumns} />
                </div>
              </PermissionAwareTooltip>

              <PermissionAwareTooltip allowed={SmartActions.canAdd(formName)} allowedText="Add New">
                <button
                  type="button"
                  disabled={!SmartActions.canAdd(formName)}
                  onClick={handleAdd}
                  className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-white text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all shadow-sm disabled:opacity-50"
                >
                  <i className="material-symbols-outlined text-[20px]">add</i>
                </button>
              </PermissionAwareTooltip>
            </div>

            {(filterColumn || searchInput) && (
              <PermissionAwareTooltip allowed={SmartActions.canSearch(formName)} allowedText="Reset filter">
                <button
                  type="button"
                  disabled={!SmartActions.canSearch(formName)}
                  onClick={() => {
                    setFilterColumn(""); setSearchInput(""); setPage(1);
                    setSearchTrigger((p) => p + 1);
                  }}
                  className={`w-[34px] h-[34px] flex items-center justify-center rounded-md
                    ${SmartActions.canSearch(formName)
                      ? "border border-gray-400 text-gray-600 hover:bg-gray-200"
                      : "border border-gray-300 text-gray-300 cursor-not-allowed"
                    }`}
                >
                  <i className="material-symbols-outlined text-[20px]">refresh</i>
                </button>
              </PermissionAwareTooltip>
            )}
          </div>
        </div>
      </div>

      {!showTable && (
        <LandingIllustration
          title="Manage Member Form Categories"
          addLabel="Add Category"
          formName={formName}
          description={
            <>
              Search Category data by using above filters to edit, delete etc.<br />
              <span className="font-medium">OR</span><br />
              Click on Add button to create a new category entry.
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
                {[0,1,2,3].map(i => <div key={i} className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md" />)}
              </div>
            </div>
          ) : hasData ? (
            <div className="flex justify-between items-center py-2 mb-[10px]">
              <div className="relative">
                <select
                  value={perPage}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    setPerPage(size); setPage(1);
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
                  <i className="material-symbols-outlined text-[18px] text-gray-500">expand_more</i>
                </span>
              </div>

              <PermissionAwareTooltip allowed={canExport}>
                <div className={!canExport ? "pointer-events-none opacity-50" : ""}>
                  <ExportButtons
                    title="Form Categories Report"
                    columns={exportColumns}
                    fetchData={fetchExportData}
                    disabled={!canExport}
                  />
                </div>
              </PermissionAwareTooltip>
            </div>
          ) : null}

          <div className="trezo-card-content bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <DataTable
              columns={columns}
              data={tableData}
              customStyles={customStyles}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationComponent={(props) => (
                <CustomPagination {...props} currentPage={page} rowsPerPage={perPage} />
              )}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handlePerRowsChange}
              onSort={handleSort}
              sortServer
              defaultSortFieldId={columns.find(col => col.columnKey === sortColumnKey)?.id}
              defaultSortAsc={sortDirection === "ASC"}
              progressPending={tableLoading}
              progressComponent={<TableSkeleton rows={perPage} columns={columns.length || 8} />}
              conditionalRowStyles={[{
                when: row => row.__isTotal,
                style: { fontWeight: 700, backgroundColor: "var(--color-primary-table-bg)" }
              }]}
              noDataComponent={!tableLoading && <OopsNoData />}
            />
          </div>
        </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
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
                <div className="trezo-card-header bg-gray-50 dark:bg-[#15203c] mb-[20px] md:mb-[25px] flex items-center justify-between -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px] p-[20px] md:p-[25px] rounded-t-md">
                  <div className="trezo-card-title">
                    <h5 className="!mb-0">
                      {isEdit ? "Edit Member Form Category" : "Add Member Form Category"}
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

                <Formik
                  enableReinitialize
                  initialValues={{
                    parentCategory: editData ? String(editData.ParentCategoryId) : "",
                    formCategoryName: editData?.FormCategoryName ?? "",
                    formNameWithExt: editData?.FormNameWithExt ?? "",
                    iconName: editData?.Icon ?? "",
                    iconColor: editData?.IconColor ?? "#1976d2",
                    position: editData?.Position ?? 0,
                  }}
                  validationSchema={Yup.object().shape({
                    formCategoryName: Yup.string().required("Category name is required"),
                  })}
                  onSubmit={async (values, { setSubmitting }) => {
                    try {
                      const payload = {
                        procName: "MemberFormCategory",
                        Para: JSON.stringify({
                          ActionMode: isEdit ? "Update" : "Insert",
                          ParentCategoryId: values.parentCategory || 0,
                          FormCategoryName: values.formCategoryName,
                          FormNameWithExt: values.formNameWithExt,
                          Icon: values.iconName,
                          IconColor: values.iconColor,
                          Position: values.position,
                          EntryBy: 1,
                          ...(isEdit && { EditId: editData?.FormCategoryId }),
                        }),
                      };
                      const response = await universalService(payload);
                      ShowSuccessAlert(isEdit ? "Category updated successfully" : "Category added successfully");
                      setOpen(false);
                      setIsEdit(false);
                      setEditData(null);
                      setSearchTrigger(p => p + 1);
                    } catch (error) {
                      console.error("Form insert/update error:", error);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {({ errors, touched, setFieldValue, values }) => (
                    <>
                      <Form className="space-y-5">
                        <div>
                          <label className="mb-[10px] font-medium block">Parent Category:</label>
                          <Field as="select" name="parentCategory" className="h-[55px] rounded-md border px-[14px] w-full">
                            <option value="">Select Parent Category</option>
                            {parentCategories.length === 0 && <option disabled>No Parent Category Found</option>}
                            {parentCategories.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </Field>
                        </div>

                        <div>
                          <label className="mb-[10px] font-medium block">
                            Category Name:<span className="text-red-500">*</span>
                          </label>
                          <Field name="formCategoryName" className="h-[55px] rounded-md border px-[17px] w-full" placeholder="Enter category name" />
                          {errors.formCategoryName && touched.formCategoryName && (
                            <p className="text-red-500 text-sm">{errors.formCategoryName}</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-[10px] font-medium block">Form Name With Extension</label>
                          <Field name="formNameWithExt" className="h-[55px] rounded-md border px-[17px] w-full" placeholder="/member/dashboard" />
                        </div>

                        <div>
                          <label className="mb-[10px] font-medium block">Icon & Color:</label>
                          <div className="flex items-center">
                            <div className="h-[55px] w-[55px] flex items-center justify-center bg-white border rounded-l-md">
                              <span className="material-symbols-outlined text-primary-button-bg text-2xl" style={{ color: values.iconColor }}>
                                {values.iconName || "star"}
                              </span>
                            </div>
                            <Field name="iconName" placeholder="Icon name" className="h-[55px] border px-[17px] w-full" />
                            <button
                              type="button"
                              className="h-[55px] min-w-[130px] max-w-[250px] px-[15px] bg-primary-button-bg text-white rounded-r-md flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
                              onClick={() => setOpenIconPopup(true)}
                            >
                              Select Icon
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="mb-[10px] font-medium block">Icon Color:</label>
                          <div className="flex items-center">
                            <div className="h-[55px] w-[55px] flex items-center justify-center bg-white border rounded-l-md" style={{ backgroundColor: values.iconColor }} />
                            <Field name="iconColor" placeholder="#1976d2" className="h-[55px] border px-[17px] w-full" />
                            <button
                              type="button"
                              className="h-[55px] min-w-[130px] max-w-[250px] px-[15px] bg-primary-button-bg text-white rounded-r-md flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis shrink-0"
                              onClick={() => setOpenColorPopup(true)}
                            >
                              Select Color
                            </button>
                          </div>
                        </div>

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
                            {isEdit ? "Update Category" : "Add Category"}
                          </button>
                        </div>
                      </Form>

                      <IconsPopUpPage
                        open={openIconPopup}
                        setOpen={setOpenIconPopup}
                        onSelectIcon={(icon) => setFieldValue("iconName", icon)}
                      />
                      <ColorPickerPopup
                        open={openColorPopup}
                        setOpen={setOpenColorPopup}
                        value={values.iconColor}
                        onChange={(color) => setFieldValue("iconColor", color)}
                      />
                    </>
                  )}
                </Formik>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Template;