"use client";

import React, { useEffect, useState } from "react";
import { ApiService } from "../../../../../services/ApiService";
import DataTable from "react-data-table-component";
import customStyles from "../../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import TableSkeleton from "../../Forms/TableSkeleton";
import OopsNoData from "../../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import { useLocation, useNavigate } from "react-router-dom";
import ColumnSelector from "../../ColumnSelector/ColumnSelector";
import CustomPagination from "../../../../../components/CommonFormElements/Pagination/CustomPagination";
import ActionCell from "../../../../../components/CommonFormElements/DataTableComponents/ActionCell";
import PermissionAwareTooltip from "../../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../../Security/SmartActionWithFormName";
import ExportButtons from "../../../../../components/CommonFormElements/ExportButtons/ExportButtons";
import Loader from "../../../common/Loader";
import AccessRestricted from "../../../common/AccessRestricted";
import Swal from "sweetalert2";

const ManageReports: React.FC = () => {
  const { universalService } = ApiService();
  const navigate = useNavigate();

  /* ================= STATE ================= */

  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [columnsReady, setColumnsReady] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);
  const [refreshGrid, setRefreshGrid] = useState(0);
  const location = useLocation();
  const path = location.pathname;
  const formName = path.split("/").pop();
  const canExport = SmartActions.canExport(formName);
  const [page, setPage] = useState(1);
  const hasData = data.length > 0;
  const tableLoading = loading;
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [hasVisitedTable, setHasVisitedTable] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [filterColumn, setFilterColumn] = useState("");

  const [sortIndex, setSortIndex] = useState(1);
  const [sortDirection, setSortDirection] = useState("ASC");

  /* ================= ACTIONS ================= */

  const handleEdit = (row: any) => {
    navigate(`/superadmin/mlm-setting/add-report/${row.ReportId}`);
  };

  const handleDelete = (row: any) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete ${row.ReportName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const payload = {
          procName: "SystemReport",
          Para: JSON.stringify({
            ActionMode: "Delete",
            ReportId: row.ReportId
          })
        };

        const res = await universalService(payload);
        const apiRes = Array.isArray(res) ? res[0] : res;

        if (apiRes?.Status === 1) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: apiRes.Message || "Report deleted successfully",
            timer: 1500,
            showConfirmButton: false
          });

          // ⭐ refresh grid
          setPage(1);
          setSearchTrigger(p => p + 1);

        } else {
          Swal.fire("Error", apiRes?.Message || "Delete failed", "error");
        }

      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Something went wrong", "error");
      }
    });
  };
  const resetSearch = () => {
    setSearchInput("");
    setFilterColumn("");
    setShowTable(true);     // 👈 keep table visible
    setPage(1);

    fetchGridData({
      pageOverride: 1,
      perPageOverride: perPage,
      forceNoFilter: true   // 👈 important
    });
  };
  /* ================= GRID COLUMNS ================= */
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
  const fetchGridColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

    try {
      const payload = {
        procName: "GetUserGridColumns",
        Para: JSON.stringify({
          UserId: employeeId,
          GridName: "USP_SystemReport",
        }),
      };

      const res = await universalService(payload);
      const data = res?.data || res;

      if (Array.isArray(data)) {
        const reactCols = data
          .filter((c: any) => c.IsVisible === true)
          .sort((a: any, b: any) => a.ColumnOrder - b.ColumnOrder)
          .map((c: any, index: number) => ({
            id: index + 1,
            name: c.DisplayName,
            selector: (row: any) => row[c.ColumnKey],
            sortable: true,
            columnKey: c.ColumnKey,
            columnIndex: index + 1,
          }));

        const actionColumn = {
          name: "Action",
          cell: (row: any) => (
            <ActionCell row={row} onEdit={handleEdit} onDelete={handleDelete} />
          ),
          ignoreRowClick: true,
          button: true,
        };

        setColumns([...reactCols, actionColumn]);
      }
    } catch (err) {
      console.error(err);
      setColumns([]);
    }
  };

  /* ================= GRID DATA ================= */

  const fetchGridData = async (options?: any) => {
    const pageToUse = options?.pageOverride ?? page;
    const perPageToUse = options?.perPageOverride ?? perPage;

    try {
      setLoading(true);

      const payload = {
        procName: "SystemReport",
        Para: JSON.stringify({
          ActionMode: "GetAllReports",
          SearchBy: filterColumn || "",
          Criteria: searchInput || "",
          Page: pageToUse,
          PageSize: perPageToUse,
          SortIndex: sortIndex,
          SortDir: sortDirection,
        }),
      };

      const res = await universalService(payload);
      const result = res?.data || res;

      if (result?.rows) {
        setData(result.rows);
        setTotalRows(result[0]?.TotalRecords || 0);
      } else if (Array.isArray(result)) {
        setData(result);
        setTotalRows(result[0]?.TotalRecords || 0);

        setShowTable(!!searchInput || !!filterColumn);
      }
      else {
        setData([]);
        setTotalRows(0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EVENTS ================= */

  const handleSort = (column: any, direction: string) => {
    setSortIndex(column.columnIndex);
    setSortDirection(direction.toUpperCase());
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchGridData({ pageOverride: p });
  };

  const handlePerRowsChange = (newPerPage: number, p: number) => {
    setPerPage(newPerPage);
    setPage(p);
  };

  const applySearch = () => {
    setShowTable(true);
    setHasVisitedTable(true);   // ⭐ key
    setPage(1);
    setSearchTrigger(p => p + 1);
  };

  /* ================= EFFECTS ================= */
  useEffect(() => {
    fetchFormPermissions();
  }, [])
  useEffect(() => {
    fetchGridColumns();
  }, [refreshGrid]);

  useEffect(() => {
    if (!showTable || !hasVisitedTable || columns.length === 0) return;

    fetchGridData();
  }, [columns, page, perPage, sortIndex, sortDirection, searchTrigger]);
  /* ================= UI ================= */
  if (permissionsLoading) {
    return <Loader />;
  }

  if (!hasPageAccess) {
    return <AccessRestricted />;
  }
  return (
    <div className="trezo-card bg-white dark:bg-[#0f172a] p-6 rounded-lg">

      {/* HEADER */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[23px] px-[20px] md:px-[25px]">

        <h5 className="font-bold text-xl mt-2">Manage Reports</h5>

        <div className="flex gap-2">

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
                <option value="Username">Report Name</option>
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
                disabled={!SmartActions.canAdd(formName)}
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

          <ColumnSelector
            procName="USP_SystemReport"
            onApply={() => setRefreshGrid((p) => p + 1)}
          />

          {/* ADD BUTTON */}
          <PermissionAwareTooltip
            allowed={SmartActions.canAdd(formName)}
            allowedText="Add New"
          >
            <button
              type="button"
              onClick={()=>{navigate("/superadmin/mlm-setting/add-report")}}
              disabled={!SmartActions.canAdd(formName)}
              className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all shadow-sm disabled:opacity-50"
            >
              <i className="material-symbols-outlined text-[20px]">add</i>
            </button>
          </PermissionAwareTooltip>
          {/* REFRESH BUTTON (Visible when showTable is true) */}
          {showTable && (
            <button
              type="button"
              onClick={resetSearch}
              className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-400 text-gray-500 hover:bg-gray-100 transition-all"
            >
              <i className="material-symbols-outlined text-[20px]">
                refresh
              </i>
            </button>
          )}
        </div>
      </div>
     
     
      {/* TABLE TOOLBAR */}
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

          <div className="relative">
            <select
              value={perPage}
              onChange={(e) => {
                const size = Number(e.target.value);
                setPerPage(size);
                setPage(1);
                fetchGridData({ pageOverride: 1, perPageOverride: size });
              }}
              className="h-8 w-[120px] px-3 pr-7 text-xs font-semibold border rounded-md"
            >
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>

          <PermissionAwareTooltip allowed={canExport}>
            <div className={!canExport ? "pointer-events-none opacity-50" : ""}>
              <ExportButtons
                title="Reports"
                columns={columns.filter(c => c.columnKey).map(c => ({ key: c.columnKey, label: c.name }))}
                fetchData={async () => {
                  const payload = {
                    procName: "SystemReport",
                    Para: JSON.stringify({
                      ActionMode: "GetAllReports",
                      SearchBy: filterColumn === "" ? "" : filterColumn,
                      Criteria: searchInput || "",
                      Page: 1,
                      PageSize: 0,
                      SortIndex: sortIndex,
                      SortDir: sortDirection
                    })
                  };
                  const res = await universalService(payload);
                  return res?.data ?? res ?? [];
                }}
                disabled={!canExport}
              />
            </div>
          </PermissionAwareTooltip>

        </div>
      ) : null}


      {/* TABLE */}
      <DataTable
        columns={columns}
        data={data}
        customStyles={customStyles}
        pagination
        paginationServer
        paginationTotalRows={totalRows}
        onChangePage={handlePageChange}
        onChangeRowsPerPage={handlePerRowsChange}
        onSort={handleSort}
        sortServer
        progressPending={loading}
        progressComponent={<TableSkeleton rows={perPage} columns={columns.length || 4} />}
        noDataComponent={!loading && <OopsNoData />}
        paginationComponent={(props) => (
          <CustomPagination {...props} currentPage={page} rowsPerPage={perPage} />
        )}
        defaultSortFieldId={1}
      />
    </div>
  );
};

export default ManageReports;