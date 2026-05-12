import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ApiService } from "../../../../services/ApiService";
import DataTable from "react-data-table-component";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import ColumnSelector from "../ColumnSelector/ColumnSelector";
import CustomPagination from "../../../../components/CommonFormElements/Pagination/CustomPagination";
import ExportButtons from "../../../../components/CommonFormElements/ExportButtons/ExportButtons";
import StatsCards from "../../../../components/CommonFormElements/StatsCard/StatsCards";
import OopsNoData from "../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import TableSkeleton from "../Forms/TableSkeleton";
import customStyles from "../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import { useLocation } from "react-router-dom";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";
import ActionCell from "../../../../components/CommonFormElements/DataTableComponents/ActionCell";
import { useCurrency } from "../../context/CurrencyContext";
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { PlayCircle } from "lucide-react";
import * as Yup from "yup";
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
  const [sortIndex, setSortIndex] = useState("");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
  const [stats, setStats] = useState({});
  const [columnsReady, setColumnsReady] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [refreshGrid, setRefreshGrid] = useState(0);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);
  const [initialSortReady, setInitialSortReady] = useState(false);
  const { currency } = useCurrency();
  const location = useLocation();
  const path = location.pathname;
  const formName = path.split("/").pop();
  const canExport = SmartActions.canExport(formName);
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const fromStr = format(firstDayOfMonth, "yyyy-MM-dd");
  const toStr = format(today, "yyyy-MM-dd");
  const [openBinary, setOpenBinary] = useState(false);
  const [processingBinary, setProcessingBinary] = useState(false);
  const todayDate = new Date().toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({
    from: fromStr,
    to: toStr,
    preset: "thisMonth",
  });
  const BinarySchema = Yup.object().shape({
    fromdate: Yup.string().required("From Date is required"),
    todate: Yup.string().required("To Date is required"),
  });
  const statsConfig = [
    {
      key: "UnprocessedIncome",
      title: "Unprocessed Income",
      icon: "today",
      variant: "highlight",
      showCurrency: true,
    },
    {
      key: "TotalIncome",
      title: "Total Income",
      icon: "account_balance_wallet",
      variant: "income",
      showCurrency: true,
    },

    {
      key: "ThisMonthIncome",
      title: "This Month Income",
      icon: "calendar_month",
      variant: "income",
      showCurrency: true,
    },
    {
      key: "LastMonthIncome",
      title: "Last Month Income",
      icon: "history",
      variant: "income",
      showCurrency: true,
    },
  ];
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
    if (!column?.columnKey) return;
    setSortIndex(column.columnKey);
    setSortDirection(direction.toUpperCase());
  };
  const handlePageChange = (p) => {
    setPage(p);

    fetchGridData({
      ...dateRange,
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
          GridName: "USP_ProcessBinaryIncome",
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
          const index =
            visibleSorted.findIndex(
              (c: any) => c.ColumnKey === defaultSortCol.ColumnKey,
            ) + 1;

          setSortIndex("");
          setSortDirection(
            (defaultSortCol.SortDir || "ASC").toUpperCase() === "DESC"
              ? "DESC"
              : "ASC",
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
            id: index + 1,
            name: c.DisplayName,
            sortable: true,
            columnKey: c.ColumnKey,
            columnIndex: c.ColumnKey,
            isCurrency: c.IsCurrency,
            isTotal: c.IsTotal,

            selector: (row: any) => row[c.ColumnKey],

            cell: (row: any) => {
              // ⭐ TOTAL ROW
              if (row.__isTotal) {
                // 👉 show TOTAL text in first column
                if (index === 0) return "Total";

                if (c.IsTotal) {
                  const value = row[c.ColumnKey] || 0;

                  return c.IsCurrency
                    ? `$${Number(value).toLocaleString()}`
                    : Number(value).toLocaleString();
                }

                return "";
              }

              // ⭐ NORMAL ROW
              const value = row[c.ColumnKey];

              if (c.IsCurrency && value != null) {
                return `$${Number(value).toLocaleString()}`;
              }

              return value ?? "-";
            },
          }));

        setColumns([...reactCols]);
      } else {
        setColumns([]);
      }
    } catch (err) {
      console.error("Grid columns fetch failed", err);
      setColumns([]);
    }
  };
  const exportColumns = columns
    .filter((c) => c.columnKey)
    .map((c) => ({
      key: c.columnKey,
      label: c.name,
    }));
  const fetchExportData = async () => {
    const payload = {
      procName: "ProcessBinaryIncome",
      Para: JSON.stringify({
        SearchBy: filterColumn,
        Criteria: searchInput,
        Page: page,
        PageSize: 0,
        SortIndexColumn: sortIndex,
        SortDir: sortDirection,

        /* ⭐ DATE FILTER */
        FromDate: dateRange.from || null,
        ToDate: dateRange.to || null,
      }),
    };

    const res = await universalService(payload);
    return res?.data ?? res ?? [];
  };
  const GetStats = async () => {
    const payload = {
      procName: "ProcessBinaryIncome",
      Para: JSON.stringify({
        ActionMode: "GetStats",
      }),
    };

    const res = await universalService(payload);

    const result = res?.data ?? res ?? [];

    setStats(result[0] || {});

    return result;
  };

  const fetchGridData = async (options?: any) => {
    const range = options || dateRange;

    const pageToUse = options?.pageOverride ?? page;
    const perPageToUse = options?.perPageOverride ?? perPage;

    try {
      setTableLoading(true);

      const payload = {
        procName: "ProcessBinaryIncome",
        Para: JSON.stringify({
          SearchBy: options?.searchBy ?? filterColumn ?? "",
          Criteria: options?.criteria ?? searchInput ?? "",
          Page: pageToUse,
          PageSize: perPageToUse,
          SortIndexColumn: sortIndex,
          SortDir: sortDirection,

          FromDate: range.from || null,
          ToDate: range.to || null,
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
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    const payload = {
      procName: "UniversalColumnSelector",
      Para: JSON.stringify({
        EmployeeId: employeeId,
        USPName: "USP_ProcessBinaryIncome",
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
    GetStats();
  }, [refreshGrid]);
  useEffect(() => {
    if (!showTable || !hasVisitedTable) return;

    fetchGridData();
  }, [page, perPage, sortIndex, sortDirection, searchTrigger, dateRange]);
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
  if (permissionsLoading) {
    return <Loader />;
  }

  if (!hasPageAccess) {
    return <AccessRestricted />;
  }
  const formatToDDMMMYYYY = (dateString: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };
  const handleProcessBinary = async (fromDate: string, toDate: string) => {
    try {
      const formattedFromDate = formatToDDMMMYYYY(fromDate);
      const formattedToDate = formatToDDMMMYYYY(toDate);

      const confirmResult = await Swal.fire({
        title: "Process Binary Income?",
        html: `
                  <div style="font-size:14px;">
                      Do you want to process Binary Income from
                      <b style="color:#3085d6;">${formattedFromDate}</b> to
                      <b style="color:#3085d6;">${formattedToDate}</b>?
                  </div>
              `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, Process it!",
      });

      if (!confirmResult.isConfirmed) return;

      setProcessingBinary(true);
      debugger;
      const payload = {
        procName: "ProcessBinaryIncome",
        Para: JSON.stringify({
          ProcessBy: localStorage.getItem("CompanyId"),
          ACtionmode: "ProcessIncome",
          FromDate: fromDate,
          ToDate: toDate,
        }),
      };
      // console.log("Process Binary Payload:", payload);
      // return;
      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response;

      if (res?.StatusCode === 1) {
        await Swal.fire({
          title: "Success!",
          html: `Binary Income processed successfully from <b>${formattedFromDate}</b> to <b>${formattedToDate}</b>`,
          icon: "success",
          confirmButtonColor: "#3085d6",
        });

        fetchGridData();
        setOpenBinary(false);
      } else {
        Swal.fire({
          title: "Error",
          text: res?.Msg || "Something went wrong",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Process Binary Error:", error);

      Swal.fire({
        title: "Error",
        text: "Server error while processing Binary.",
        icon: "error",
      });
    } finally {
      setProcessingBinary(false);
    }
  };
  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* --- HEADER & SEARCH SECTION --- */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Process Binary Income
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
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
                           ${
                             SmartActions.canAdvancedSearch(formName)
                               ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                               : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                           }`}
                >
                  <option value="">Select Filter Option</option>
                  <option value="Username">Username</option>
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
                  <i className="material-symbols-outlined !text-[18px]">
                    search
                  </i>
                </span>
                <input
                  type="text"
                  value={searchInput}
                  placeholder="Enter Criteria..."
                  disabled={!SmartActions.canAdd(formName)}
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
                  <i className="material-symbols-outlined text-[20px]">
                    search
                  </i>
                </button>
              </PermissionAwareTooltip>
              {/* COLUMN SELECTOR BUTTON */}
              <PermissionAwareTooltip
                allowed={SmartActions.canManageColumns(formName)}
                allowedText="Manage Columns"
              >
                <div
                  className={`h-[34px] flex items-center ${
                    !SmartActions.canManageColumns(formName)
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                >
                  <ColumnSelector
                    procName="USP_ProcessBinaryIncome"
                    onApply={fetchVisibleColumns}
                  />
                </div>
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
        ${
          SmartActions.canSearch(formName)
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
            <div className="relative">
              <PermissionAwareTooltip
                allowed={SmartActions.canAdd(formName)}
                allowedText="Process Binary"
              >
                <button
                  type="button"
                  onClick={() => setOpenBinary(true)}
                  disabled={!SmartActions.canAdd(formName)}
                  className="
        inline-flex items-center gap-2
        px-5 py-2.5
        rounded-xl
        bg-primary-button-bg
        text-white text-sm font-semibold
        shadow-sm
        hover:bg-white hover:text-primary-button-bg
        border border-primary-button-bg
        hover:border-primary-button-bg
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-button-bg/30
        disabled:opacity-50 disabled:cursor-not-allowed
      "
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Process Binary</span>
                </button>
              </PermissionAwareTooltip>
            </div>
          </div>
        </div>
      </div>
      {!showTable && (
        <LandingIllustration
          title="Process Binary Income"
          formName={formName}
          addLabel="Add Income"
          description={
            <>
              Search Binary income using filters above.
              <br />
              Manage records, export reports and analyse performance.
              <br />
              {/* <span className="font-medium">OR</span><br />
              Click below to create a new income entry. */}
            </>
          }
        />
      )}
      {showTable && (
        <div>
          <StatsCards
            stats={stats}
            config={statsConfig}
            loading={tableLoading}
          />

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
                      ...dateRange,
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
                <div
                  className={!canExport ? "pointer-events-none opacity-50" : ""}
                >
                  <ExportButtons
                    title="Binary Income Report"
                    columns={exportColumns}
                    fetchData={fetchExportData}
                    disabled={!canExport}
                  />
                </div>
              </PermissionAwareTooltip>
            </div>
          ) : null}
          {/* --- CONTENT CONTAINER --- */}
          <div
            className="trezo-card-content 
  bg-white dark:bg-[#0f172a]
  text-gray-800 dark:text-gray-200
  border border-gray-200 dark:border-gray-700
  rounded-lg overflow-hidden"
          >
            <DataTable
              title=""
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
              defaultSortFieldId={sortIndex}
            />
          </div>
        </div>
      )}
      <Dialog
        open={openBinary}
        onClose={() => setOpenBinary(false)}
        className="relative z-60"
      >
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />

        <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
            <DialogPanel
              className="relative transform overflow-hidden rounded-lg bg-white dark:bg-[#0c1427]
                      text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[450px]"
            >
              <div className="trezo-card w-full p-[20px] md:p-[25px]">
                {/* Header */}
                <div
                  className="trezo-card-header bg-gray-50 dark:bg-[#15203c]
                              mb-[20px] flex items-center justify-between
                              -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px]
                              p-[20px] md:p-[25px] rounded-t-md"
                >
                  <h5 className="!mb-0">Process Binary Income</h5>

                  <button
                    type="button"
                    className="text-[23px] hover:text-primary-button-bg"
                    onClick={() => setOpenBinary(false)}
                  >
                    <i className="ri-close-fill"></i>
                  </button>
                </div>

                <Formik
                  initialValues={{
                    fromdate: fromStr,
                    todate: toStr,
                  }}
                  validationSchema={BinarySchema}
                  onSubmit={(values) => {
                    handleProcessBinary(values.fromdate, values.todate);
                  }}
                >
                  <Form className="space-y-5">
                    {/* Date */}
                    <div>
                      <label className="mb-[10px] font-medium block">
                        From Date <span className="text-red-500">*</span>
                      </label>

                      <Field
                        type="date"
                        name="fromdate"
                        className="h-[55px] rounded-md border border-gray-200
  dark:border-[#172036] bg-white dark:bg-[#0c1427]
  px-[17px] block w-full focus:border-primary-button-bg"
                      />

                      <ErrorMessage
                        name="fromdate"
                        component="p"
                        className="text-red-500 text-sm"
                      />

                      <label className="mb-[10px] font-medium block">
                        To Date <span className="text-red-500">*</span>
                      </label>

                      <Field
                        type="date"
                        name="todate"
                        className="h-[55px] rounded-md border border-gray-200
  dark:border-[#172036] bg-white dark:bg-[#0c1427]
  px-[17px] block w-full focus:border-primary-button-bg"
                      />

                      <ErrorMessage
                        name="todate"
                        component="p"
                        className="text-red-500 text-sm"
                      />
                    </div>

                    <hr className="border-t border-gray-200 dark:border-gray-700 -mx-7" />

                    {/* Footer */}
                    <div className="text-right">
                      <button
                        type="button"
                        className="mr-[15px] px-[26px] py-[12px]
                                          rounded-md bg-danger-500 text-white hover:bg-danger-400"
                        onClick={() => setOpenBinary(false)}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={processingBinary}
                        className="px-[26px] py-[12px]
                                          rounded-md bg-primary-button-bg text-white
                                          hover:bg-primary-button-bg-hover"
                      >
                        {processingBinary ? (
                          <div className="flex items-center gap-2">
                            <div className="theme-loader"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          "Process Binary"
                        )}
                      </button>
                    </div>
                  </Form>
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
