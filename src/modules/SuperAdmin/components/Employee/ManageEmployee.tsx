import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ApiService } from "../../../../services/ApiService";
import DataTable from "react-data-table-component";
import ColumnSelector from "../ColumnSelector/ColumnSelector";
import CustomPagination from "../../../../components/CommonFormElements/Pagination/CustomPagination";
import ExportButtons from "../../../../components/CommonFormElements/ExportButtons/ExportButtons";
import OopsNoData from "../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import TableSkeleton from "../Forms/TableSkeleton";
import customStyles from "../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";
import ActionCell from "../../../../components/CommonFormElements/DataTableComponents/ActionCell";
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import Swal from "sweetalert2";
const Template: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [showTable, setShowTable] = useState(false); // Toggle to show 'Oops' or 'Welcome'
  const { universalService } = ApiService();
  const [hasVisitedTable, setHasVisitedTable] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [columns, setColumns] = useState<any[]>([]);
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortColumnKey, setSortColumnKey] = useState<string>("");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
  const [columnsReady, setColumnsReady] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [refreshGrid, setRefreshGrid] = useState(0);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);
  const [initialSortReady, setInitialSortReady] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const formName = path.split("/").pop();
  const canExport = SmartActions.canExport(formName);

  const procName = "Employee";
  const getCompanyId = () => {
    const saved = localStorage.getItem("EmployeeDetails");
    return saved ? JSON.parse(saved).CompanyId : null;
  };

  const getFilterPayload = (filter: string, value: string) => {
    const payload: any = {};

    // 🔥 Status filter
    if (statusFilter && statusFilter !== "All") {
      payload.Status = statusFilter;
    }

    // 🔥 Text search
    if (value && value.trim() !== "") {
      payload.SearchBy = filter && filter !== "" ? filter : "ALL";
      payload.Criteria = value.trim();
    }

    return payload;
  };
  const fetchFormPermissions = async () => {
    try {
      setPermissionsLoading(true);

      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

      const payload = {
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "GetForms",
          FormName: formName, // 👈 category for this page
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
          String(p.FormNameWithExt).trim().toLowerCase() ===
          formName?.trim().toLowerCase(),
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
  const handleSort = (column: any, direction: string) => {
    setSortColumnKey(column.columnKey);
    setSortDirection(direction.toUpperCase());
    setPage(1);
  };
  const handlePageChange = (p) => {
    setPage(p);

    fetchGridData({
      pageOverride: p,
    });
  };
  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setPage(page);
  };
  const fetchGridColumns = async () => {

    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    try {
      const payload = {
        procName: "GetUserGridColumns",
        Para: JSON.stringify({
          UserId: employeeId,
          GridName: "USP_Employee"
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
          setSortDirection(
            (defaultSortCol.SortDir || "ASC").toUpperCase() === "DESC"
              ? "DESC"
              : "ASC"
          );
        }

        setInitialSortReady(true);
      }

      setInitialSortReady(true);

      if (Array.isArray(data)) {
        const reactCols = data
          .filter((c: any) => c.IsVisible === true)
          .sort((a: any, b: any) => a.ColumnOrder - b.ColumnOrder)
          .map((c: any, index: number) => ({
            id: c.ColumnOrder,
            name: c.DisplayName,
            sortable: true,
            columnKey: c.ColumnKey,
            columnIndex: c.ColumnOrder,
            isCurrency: c.IsCurrency,
            isTotal: c.IsTotal,

            selector: (row: any) => row[c.ColumnKey],

            cell: (row: any) => {
              const value = row[c.ColumnKey];

              // ⭐ TOTAL ROW
              if (row.__isTotal) {
                if (index === 0) return "Total";

                if (c.IsTotal) {
                  const totalValue = row[c.ColumnKey] || 0;
                  return c.IsCurrency
                    ? `$${Number(totalValue).toLocaleString()}`
                    : Number(totalValue).toLocaleString();
                }

                return "";
              }

              // ✅ DOB DATE FORMAT
              if (c.ColumnKey === "DOB" && value) {
                try {
                  return format(new Date(value), "dd-MMM-yyyy");
                } catch {
                  return value;
                }
              }

              // ✅ Currency Format
              if (c.IsCurrency && value != null) {
                return `$${Number(value).toLocaleString()}`;
              }

              return value ?? "-";
            }
          }))
        const actionColumn = {
          name: "Action",
          cell: (row: any) => {
            if (row.__isTotal) return null;   // ⭐ hide buttons on total row

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
  const handleEdit = (row: any) => {
    if (!row?.EmployeeId) return;

    navigate(`/superadmin/employee/edit/${row.EmployeeId}`);
  };
  const exportColumns = columns
    .filter(c => c.columnKey)
    .map(c => ({
      key: c.columnKey,
      label: c.name
    }));
  const fetchExportData = async () => {
    const filters = getFilterPayload(filterColumn, searchInput);

    const payload = {
      procName: "Employee",
      Para: JSON.stringify({
        Length: 0, // 🔥 NOT GetReport
        CompanyId: getCompanyId(),
        ...filters,
        SortIndexColumn: sortColumnKey || "EmployeeId",
        SortDir: sortDirection,
      }),
    };

    const res = await universalService(payload);
    return res?.data ?? res ?? [];
  };

  const handleDelete = async (row: any) => {
    if (!row?.EmployeeId) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${row.EmployeeName}" ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    const payload = {
      procName: "Employee",
      Para: JSON.stringify({
        ActionMode: "Delete",
        EditId: row.EmployeeId,
        EntryBy: 1,
      }),
    };

    const response = await universalService(payload);
    const res = Array.isArray(response?.data)
      ? response.data[0]
      : response?.data ?? response;

    const status =
      res?.StatusCode ?? res?.statuscode ?? res?.statusCode ?? res?.status;

    if (String(status) === "1") {
      await Swal.fire("Deleted!", "Employee deleted successfully", "success");

      if (data.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchGridData();
      }
    } else {
      Swal.fire("Error", res?.msg || "Delete failed", "error");
    }
  };
  const fetchGridData = async (options?: any) => {
    const pageToUse = options?.pageOverride ?? page;
    const perPageToUse = options?.perPageOverride ?? perPage;

    try {
      setTableLoading(true);

      const filters = getFilterPayload(filterColumn, searchInput);

      const payload = {
        procName: "Employee",
        Para: JSON.stringify({
          ActionMode: "GetReport", // 🔥 important
          CompanyId: getCompanyId(),
          Start: (pageToUse - 1) * perPageToUse,
          Length: perPageToUse,
          ...filters,
          SortIndexColumn: sortColumnKey || "EmployeeId",
          SortDir: sortDirection,
        }),
      };

      const res = await universalService(payload);
      const result = res?.data ?? res;

      if (Array.isArray(result)) {
        setData(result);
        setTotalRows(result[0]?.TotalRecords ?? 0);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } finally {
      setTableLoading(false);
    }
  };
  const fetchVisibleColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    const payload = {
      procName: "UniversalColumnSelector",
      Para: JSON.stringify({

        EmployeeId: employeeId,
        USPName: "USP_Employee",
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

    fetchGridData();
  }, [
    page,
    perPage,
    sortColumnKey,
    sortDirection,
    searchTrigger,
    statusFilter
  ]);
  const applySearch = () => {
    if (!SmartActions.canSearch(formName)) return;

    const trimmed = searchInput.trim();

    if (statusFilter === "All" && !trimmed) {
      setFilterColumn("");
      setSearchInput("");
    } else {
      if (!filterColumn && trimmed) {
        setFilterColumn("EmployeeName"); // default
      }
    }

    setPage(1);
    setShowTable(true);
    setHasVisitedTable(true);
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
    hasData && totalRow
      ? [...data, { ...totalRow, __isTotal: true }]
      : data;
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
            Manage Employee
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-[34px] px-3 text-xs rounded-md border border-gray-300"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
              <option value="Pending">Pending</option>
              <option value="Resigned">Resigned</option>
            </select>
            {/* 1. Filter Dropdown (Exactly from your design) */}
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
                           ${SmartActions.canAdvancedSearch(formName)
                      ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                >

                  <option value="">Select Filter Option</option>
                  <option value="EmployeeName">Employee Name</option>
                  <option value="EmployeeCode">Employee Code</option>
                  <option value="DepartmentName">Department</option>
                  <option value="DesignationName">Designation</option>
                  <option value="EmailId">Email</option>
                  <option value="ContactNo">Contact No</option>
                  <option value="CityName">City</option>
                  <option value="Status">Status</option>
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                  <i className="material-symbols-outlined !text-[18px]">
                    expand_more
                  </i>
                </span>
              </PermissionAwareTooltip>
            </div>

            {/* 2. Search Input (Exactly from your design) */}
            <div className="relative">
              <PermissionAwareTooltip
                allowed={SmartActions.canSearch(formName)}
                allowedText="Enter Criteria"
              >
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

            {/* 3. BUTTONS GROUP (Exactly from your design) */}
            <div className="flex items-center gap-2">
              {/* SEARCH BUTTON */}
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
                  <i className="material-symbols-outlined text-[20px]">search</i>
                </button>
              </PermissionAwareTooltip>
              {/* COLUMN SELECTOR BUTTON */}
              <PermissionAwareTooltip
                allowed={SmartActions.canManageColumns(formName)}
                allowedText="Manage Columns"
              >
                <div
                  className={`h-[34px] flex items-center ${!SmartActions.canManageColumns(formName)
                    ? "pointer-events-none opacity-50"
                    : ""
                    }`}
                >
                  <ColumnSelector
                    procName="USP_Employee"
                    onApply={fetchVisibleColumns}
                  />
                </div>
              </PermissionAwareTooltip>
              {/* ADD BUTTON */}
              <PermissionAwareTooltip
                allowed={SmartActions.canAdd(formName)}
                allowedText="Add New"
              >
                <button
                  type="button"
                  disabled={!SmartActions.canAdd(formName)}
                  onClick={() => { navigate("/superadmin/employee/add-employee") }}
                  className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all shadow-sm disabled:opacity-50"
                >
                  <i className="material-symbols-outlined text-[20px]">add</i>
                </button>
              </PermissionAwareTooltip>
              {/* REFRESH BUTTON (Visible when showTable is true) */}

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
                    setStatusFilter("All");
                    setPage(1);
                    setSearchTrigger((p) => p + 1);
                  }}
                  className={`w-[34px] h-[34px] flex items-center justify-center rounded-md
        ${SmartActions.canSearch(formName)
                      ? "border border-gray-400 text-gray-600 hover:bg-gray-200"
                      : "border border-gray-300 text-gray-300 cursor-not-allowed"
                    }`}
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
          title="Manage Employee"
          addLabel="Add Employee"
          formName={formName}
          description={
            <>
              Search Employee using filters above.<br />
              Manage records, export reports and analyse performance.<br />
              <span className="font-medium">OR</span><br />
              Click add button to add a new employee.
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

                    fetchGridData({
                      pageOverride: 1,
                      perPageOverride: size,
                    });
                  }}
                  className="h-8 w-[120px] px-3 pr-7 text-xs font-semibold
        text-gray-600 dark:text-gray-300
        bg-transparent border border-gray-300 dark:border-gray-600
        rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800
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

              {/* EXPORT */}
              <PermissionAwareTooltip allowed={canExport}>
                <div className={!canExport ? "pointer-events-none opacity-50" : ""}>
                  <ExportButtons
                    title="Employee Report"
                    columns={exportColumns}
                    fetchData={fetchExportData}
                    disabled={!canExport}
                  />
                </div>
              </PermissionAwareTooltip>
            </div>
          ) : null}
          {/* --- CONTENT CONTAINER --- */}
          <div className="trezo-card-content 
  bg-white dark:bg-[#0f172a]
  text-gray-800 dark:text-gray-200
  border border-gray-200 dark:border-gray-700
  rounded-lg overflow-hidden">
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
                columns.find(col => col.columnKey === sortColumnKey)?.id
              }
              defaultSortAsc={sortDirection === "ASC"}
              progressPending={tableLoading}
              progressComponent={
                <TableSkeleton
                  rows={perPage}
                  columns={columns.length || 8}
                />
              }
              conditionalRowStyles={[
                {
                  when: row => row.__isTotal,
                  style: {
                    fontWeight: 700,
                    backgroundColor: "var(--color-primary-table-bg)",
                  }
                }
              ]}
              noDataComponent={!tableLoading && <OopsNoData />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Template;
