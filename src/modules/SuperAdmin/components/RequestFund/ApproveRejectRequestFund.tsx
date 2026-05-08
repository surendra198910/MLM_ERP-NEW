import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ApiService } from "../../../../services/ApiService";
import DataTable from "react-data-table-component";
import ColumnSelector from "../ColumnSelector/ColumnSelector";
import CustomPagination from "../../../../components/CommonFormElements/Pagination/CustomPagination";
import ExportButtons from "../../../../components/CommonFormElements/ExportButtons/ExportButtons";
import StatsCards from "../../../../components/CommonFormElements/StatsCard/StatsCards";
import DateRangeFilter from "../../../../components/CommonFormElements/DateRangeFilter/DateRangeFilter";
import OopsNoData from "../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import TableSkeleton from "../Forms/TableSkeleton";
import customStyles from "../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import { useLocation } from "react-router-dom";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import Swal from "sweetalert2";
import { FaEye } from "react-icons/fa";

interface DateRange {
  from: string;
  to: string;
}

const Template: React.FC = () => {
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
  const [filterStatus, setFilterStatus] = useState("Pending");

  // ✅ NEW: bulk selection state
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  const location = useLocation();
  const path = location.pathname;
  const formName = path.split("/").pop();
  const canExport = SmartActions.canExport(formName);

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const fromStr = format(oneYearAgo, "yyyy-MM-dd");
  const toStr = format(today, "yyyy-MM-dd");

  const [pendingRange, setPendingRange] = useState<DateRange>({
    from: fromStr,
    to: toStr,
  });
  const [dateRange, setDateRange] = useState({ from: fromStr, to: toStr });

  const statsConfig = [
    {
      key: "TotalRequests",
      title: "Total Requests",
      icon: "list_alt",
      showCurrency: false,
    },
    {
      key: "TotalAmount",
      title: "Total Amount",
      icon: "payments",
      showCurrency: true,
    },
    {
      key: "ThisMonthAmount",
      title: "This Month",
      icon: "calendar_month",
      showCurrency: true,
    },
    { key: "TodayAmount", title: "Today", icon: "today", showCurrency: true },
  ];

  // single-row modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [actionStatus, setActionStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ─────────────────────────────────────────────
  // PERMISSIONS
  // ─────────────────────────────────────────────
  const fetchFormPermissions = async () => {
    try {
      setPermissionsLoading(true);
      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

      const payload = {
        procName: "AssignForm",
        Para: JSON.stringify({
          ActionMode: "GetForms",
          FormName: formName,
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

      SmartActions.load(data);
      setHasPageAccess(true);
    } catch (error) {
      console.error("Form permission fetch failed:", error);
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // GRID COLUMNS
  // ─────────────────────────────────────────────
  const fetchGridColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    try {
      const payload = {
        procName: "GetUserGridColumns",
        Para: JSON.stringify({
          UserId: employeeId,
          GridName: "USP_FetchFundRequests",
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
              // TOTAL ROW
              if (row.__isTotal) {
                if (index === 0) return "Total";
                if (c.IsTotal) {
                  const value = row[c.ColumnKey] || 0;
                  return c.IsCurrency
                    ? `$${Number(value).toLocaleString()}`
                    : Number(value).toLocaleString();
                }
                return "";
              }

              // NORMAL ROW
              const value = row[c.ColumnKey];
              const IMAGE_BASE_URL =
                import.meta.env.VITE_IMAGE_PREVIEW_URL_2 + "ClientImages/";

              if (c.ColumnKey === "Member") {
                const profileUrl = row.ClientLogo
                  ? `${IMAGE_BASE_URL}${row.ClientLogo}`
                  : `https://ui-avatars.com/api/?name=${row.MemberName}&background=random`;
                return (
                  <div className="flex items-center gap-2">
                    <img
                      src={profileUrl}
                      alt="user"
                      className="w-9 h-9 rounded-full object-cover border"
                      onError={(e: any) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${row.MemberName}`;
                      }}
                    />
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-sm">
                        {row.MemberName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {row.UserName}
                      </span>
                    </div>
                  </div>
                );
              }

              if (c.ColumnKey === "Status") {
                const getStatusClass = (status: string) => {
                  switch (status) {
                    case "Approved":
                      return "bg-green-100 text-green-700";
                    case "Rejected":
                      return "bg-red-100 text-red-700";
                    default:
                      return "bg-yellow-100 text-yellow-700";
                  }
                };
                return (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(value)}`}
                  >
                    {value}
                  </span>
                );
              }

              if (c.IsCurrency && value != null) {
                return `$${Number(value).toLocaleString()}`;
              }
              return value ?? "-";
            },
          }));

        // Action column — matches withdraw pattern
        const actionColumn = {
          name: "Action",
          cell: (row: any) => {
            if (row.__isTotal) return null;

            if (row.Status === "Approved" || row.Status === "Rejected") {
              return (
                <button
                  className="text-blue-500 hover:text-blue-700"
                  onClick={() => handleGetDetails(row.Id)}
                  title="View Details"
                >
                  <FaEye style={{ fontSize: "18px" }} />
                </button>
              );
            }

            return (
              <button
                onClick={() => handleGetDetails(row.Id)}
                className="text-primary-button-bg hover:underline text-xs font-medium"
              >
                Take Action
              </button>
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

  // ─────────────────────────────────────────────
  // SORT / PAGE HANDLERS
  // ─────────────────────────────────────────────
  const handleSort = (column: any, direction: string) => {
    if (!column?.columnKey) return;
    setSortIndex(column.columnKey);
    setSortDirection(direction.toUpperCase());
  };
  const exportColumns = columns
    .filter((c) => c.columnKey)
    .map((c) => ({
      key: c.columnKey,
      label: c.name,
    }));
  const handlePageChange = (p) => {
    setPage(p);
    fetchGridData({ ...dateRange, pageOverride: p });
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setPerPage(newPerPage);
    setPage(page);
  };

  // ─────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────
  const fetchGridData = async (options?: any) => {
    const pageToUse = options?.pageOverride ?? page;
    const perPageToUse = options?.perPageOverride ?? perPage;

    try {
      setTableLoading(true);
      const payload = {
        procName: "FetchFundRequests",
        Para: JSON.stringify({
          SearchBy: options?.searchBy ?? filterColumn ?? "",
          Status: filterStatus,
          Criteria: options?.criteria ?? searchInput ?? "",
          Page: pageToUse,
          PageSize: perPageToUse,
          SortIndexColumn: sortIndex,
          SortDir: sortDirection,
          FromDate: pendingRange.from || null,
          ToDate: pendingRange.to || null,
          ActionMode: "GetReport",
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

  const GetStats = async () => {
    const payload = {
      procName: "FetchFundRequests",
      Para: JSON.stringify({ ActionMode: "GetStats" }),
    };
    const res = await universalService(payload);
    const result = res?.data ?? res ?? [];
    setStats(result[0] || {});
  };

  const fetchExportData = async () => {
    const payload = {
      procName: "FetchFundRequests",
      Para: JSON.stringify({
        SearchBy: filterColumn,
        Criteria: searchInput,
        Page: page,
        PageSize: 0,
        SortIndexColumn: sortIndex,
        SortDir: sortDirection,
        FromDate: dateRange.from || null,
        ToDate: dateRange.to || null,
      }),
    };
    const res = await universalService(payload);
    return res?.data ?? res ?? [];
  };

  const fetchVisibleColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    const payload = {
      procName: "UniversalColumnSelector",
      Para: JSON.stringify({
        EmployeeId: employeeId,
        USPName: "USP_FetchFundRequests",
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

  // ─────────────────────────────────────────────
  // SINGLE-ROW ACTION MODAL
  // ─────────────────────────────────────────────
  const handleGetDetails = async (id: any) => {
    try {
      setLoadingDetails(true);
      const payload = {
        procName: "ApproveRejectFundRequest",
        Para: JSON.stringify({ ActionMode: "GetDetailsById", RequestId: id }),
      };
      const res = await universalService(payload);
      const data = res?.data ?? res;
      if (data && data.length > 0) {
        setSelectedRow(data[0]);
        setShowModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async () => {
    if (!actionStatus) {
      Swal.fire({
        icon: "warning",
        title: "Action Required",
        text: "Please select action before submitting",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to ${actionStatus} this request`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, proceed",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#d33",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      Swal.fire({
        title: "Processing...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const payload = {
        procName: "ApproveRejectFundRequest",
        Para: JSON.stringify({
          ActionMode: "Update",
          RequestId: selectedRow.Id,
          Status: actionStatus,
          UserRemarks: remarks,
          EmployeeID: JSON.parse(
            localStorage.getItem("EmployeeDetails") || "{}",
          ).EmployeeId,
        }),
      };

      const res = await universalService(payload);
      const result = res?.data ?? res;
      Swal.close();

      if (result[0]?.StatusCode === 1) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: result[0].msg,
          confirmButtonColor: "#28a745",
        });

        //  remove approved/rejected row locally
        setData((prev: any[]) =>
          prev.filter((row) => row.Id !== selectedRow.Id),
        );

        //  decrease total records
        setTotalRows((prev) => Math.max(prev - 1, 0));

        //  clear selected rows if needed
        setSelectedRows((prev) =>
          prev.filter((row) => row.Id !== selectedRow.Id),
        );

        setShowModal(false);

        // setShowModal(false);
        // fetchGridData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: result[0]?.msg || "Something went wrong",
          confirmButtonColor: "#d33",
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Server error. Try again.",
        confirmButtonColor: "#d33",
      });
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────
  // ✅ BULK ACTIONS  (mirrored from withdraw page)
  // ─────────────────────────────────────────────
  const handleBulkAction = async (status: "Approved" | "Rejected") => {
    const pendingRows = selectedRows.filter((r) => r.Status === "Pending");

    if (pendingRows.length === 0) {
      Swal.fire({
        title: "No Pending Records",
        text: "Only pending fund requests can be processed.",
        icon: "warning",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to ${status} ${pendingRows.length} fund request(s)`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${status}`,
      confirmButtonColor: status === "Approved" ? "#16a34a" : "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    const ids = pendingRows.map((r) => r.Id);

    try {
      const res = await bulkFundAction({ ids, status });
      const data = res?.data?.[0] || res?.[0] || res;

      if (data?.Success === 1) {
        Swal.fire("Success", data.Message, "success");

        // ✅ Remove rows locally — no full reload needed
        setData((prev: any[]) => prev.filter((row) => !ids.includes(row.Id)));
        setSelectedRows([]);
      } else {
        Swal.fire("Error", data?.Message || "Something went wrong", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  const bulkFundAction = async ({
    ids,
    status,
  }: {
    ids: number[];
    status: string;
  }) => {
    const actionMode = status === "Approved" ? "BulkApprove" : "BulkReject";

    const payload = {
      procName: "ApproveRejectFundRequest", // same SP, new ActionMode
      Para: JSON.stringify({
        ActionMode: actionMode,
        Ids: ids.join(","), // comma-separated e.g. "1,2,3"
        AdminRemarks: "", // optional — extend if needed
      }),
    };

    return await universalService(payload);
  };

  // ─────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    fetchGridColumns();
    GetStats();
  }, [refreshGrid]);

  useEffect(() => {
    if (!showTable || !hasVisitedTable) return;
    fetchGridData();
  }, [page, perPage, sortIndex, sortDirection, searchTrigger, dateRange]);

  useEffect(() => {
    if (!selectedRow) return;
    if (selectedRow.Status !== "Pending") {
      setActionStatus(selectedRow.Status);
    } else {
      setActionStatus("");
    }
  }, [selectedRow]);

  useEffect(() => {
    fetchFormPermissions();
  }, []);

  const applySearch = () => {
    if (!SmartActions.canSearch(formName)) return;
    setShowTable(true);
    setHasVisitedTable(true);
    setPage(1);
    setSearchTrigger((p) => p + 1);
  };

  // ─────────────────────────────────────────────
  // PAGE TOTALS
  // ─────────────────────────────────────────────
  const pageTotals: any = {};
  columns.forEach((col: any) => {
    if (!col.isTotal || !col.columnKey) return;
    pageTotals[col.columnKey] = data.reduce(
      (sum: number, row: any) => sum + Number(row[col.columnKey] || 0),
      0,
    );
  });

  const totalRow =
    Object.keys(pageTotals).length > 0
      ? columns.reduce((acc: any, col: any) => {
          if (!col.columnKey) {
            acc.__label = "Page Total";
            return acc;
          }
          acc[col.columnKey] = col.isTotal ? pageTotals[col.columnKey] : "";
          return acc;
        }, {})
      : null;

  const hasData = data.length > 0;
  const tableData =
    hasData && totalRow ? [...data, { ...totalRow, __isTotal: true }] : data;
  const isActionAllowed = selectedRow?.Status === "Pending";

  if (permissionsLoading) return <Loader />;
  if (!hasPageAccess) return <AccessRestricted />;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* ── HEADER ── */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h6 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Approve / Reject Fund Request
          </h6>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            {/* DATE RANGE */}
            <div className="px-4">
              <PermissionAwareTooltip
                allowed={SmartActions.canDateFilter(formName)}
                allowedText="Filter by Date"
              >
                <DateRangeFilter
                  initialRange={{ start: oneYearAgo, end: today }}
                  disabled={!SmartActions.canDateFilter(formName)}
                  onChange={(range) => {
                    setPendingRange({
                      from: format(range.start, "yyyy-MM-dd"),
                      to: format(range.end, "yyyy-MM-dd"),
                    });
                  }}
                />
              </PermissionAwareTooltip>
            </div>

            {/* SEARCH BY COLUMN */}
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
                  <option value="MemberName">Member Name</option>
                  <option value="PaymentMode">Payment Mode</option>
                </select>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                  <i className="material-symbols-outlined !text-[18px]">
                    expand_more
                  </i>
                </span>
              </PermissionAwareTooltip>
            </div>

            {/* SEARCH INPUT */}
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

            {/* STATUS FILTER */}
            <div className="relative w-full sm:w-[160px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                <i className="material-symbols-outlined !text-[18px] mt-2">
                  pending_actions
                </i>
              </span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border transition-all
                           bg-white text-black border-gray-300 focus:border-primary-button-bg"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                <i className="material-symbols-outlined !text-[18px]">
                  expand_more
                </i>
              </span>
            </div>

            {/* BUTTONS GROUP */}
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
                    procName="USP_FetchFundRequests"
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
          </div>
        </div>
      </div>

      {/* ── LANDING ── */}
      {!showTable && (
        <LandingIllustration
          title="Request Fund Report"
          formName={formName}
          description={
            <>
              Search Request Fund Report using filters above.
              <br />
              Manage records, export reports and analyse performance.
            </>
          }
        />
      )}

      {/* ── TABLE SECTION ── */}
      {showTable && (
        <div>
          <StatsCards
            stats={stats}
            config={statsConfig}
            loading={tableLoading}
          />

          {/* TOOLBAR ROW */}
          {tableLoading ? (
            <div className="flex justify-between items-center py-2 animate-pulse">
              <div className="h-8 w-[120px] bg-gray-200 dark:bg-gray-700 rounded-md" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"
                  />
                ))}
              </div>
            </div>
          ) : hasData ? (
            <div className="flex justify-between items-center py-2 mb-[10px] gap-3 flex-wrap">
              {/* LEFT — page size */}
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

              {/* RIGHT — bulk actions + export */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* ✅ BULK APPROVE */}
                <button
                  disabled={selectedRows.length === 0}
                  onClick={() => handleBulkAction("Approved")}
                  className="h-8 flex items-center gap-1 px-3 text-xs font-medium
                    bg-green-600 hover:bg-green-700 text-white
                    rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <i className="material-symbols-outlined text-[16px]">
                    check_circle
                  </i>
                  Approve Selected
                </button>

                {/* ✅ BULK REJECT */}
                <button
                  disabled={selectedRows.length === 0}
                  onClick={() => handleBulkAction("Rejected")}
                  className="h-8 flex items-center gap-1 px-3 text-xs font-medium
                    bg-red-600 hover:bg-red-700 text-white
                    rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <i className="material-symbols-outlined text-[16px]">
                    cancel
                  </i>
                  Reject Selected
                </button>

                {/* EXPORT */}
                <PermissionAwareTooltip allowed={canExport}>
                  <div
                    className={
                      !canExport ? "pointer-events-none opacity-50" : ""
                    }
                  >
                    <ExportButtons
                      title="Request Fund Report"
                      columns={exportColumns}
                      fetchData={fetchExportData}
                      disabled={!canExport}
                    />
                  </div>
                </PermissionAwareTooltip>
              </div>
            </div>
          ) : null}

          {/* ── DATA TABLE ── */}
          <div className="trezo-card-content bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <DataTable
              // ✅ selectable rows — only Pending rows, not total row
              selectableRows
              selectableRowDisabled={(row) =>
                row.__isTotal || row.Status !== "Pending"
              }
              onSelectedRowsChange={({ selectedRows }) =>
                setSelectedRows(selectedRows)
              }
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
                  classNames: ["hide-checkbox"], // hides checkbox on total row
                },
                {
                  when: (row) => row.isRemoving,
                  style: {
                    opacity: 0,
                    transform: "translateX(80px)",
                    transition: "all 0.3s ease",
                  },
                },
              ]}
              noDataComponent={!tableLoading && <OopsNoData />}
              defaultSortFieldId={sortIndex}
            />
          </div>
        </div>
      )}

      {/* ── SINGLE-ROW DETAILS MODAL ── */}
      {showModal && selectedRow && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[0.5px]" />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-[700px] max-h-[90vh] bg-white dark:bg-[#0c1427] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Modal header */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-[#15203c] px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h5 className="text-lg font-semibold text-black dark:text-white">
                  Fund Request Details
                </h5>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[22px] text-gray-500 hover:text-red-500 transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 py-3 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs !mb-0 text-gray-400">User</p>
                    <p className="font-semibold !mb-0">
                      {selectedRow.UserName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs !mb-0 text-gray-400">Name</p>
                    <p className="font-semibold !mb-0">
                      {selectedRow.MemberName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs !mb-0 text-gray-400">Amount</p>
                    <p className="font-bold !mb-0 text-green-600 text-base">
                      ₹{selectedRow.Amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs !mb-0 text-gray-400">USDT</p>
                    <p>{selectedRow.USDTAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs !mb-0 text-gray-400">Payment Mode</p>
                    <p className="font-bold !mb-0 text-green-600 text-base">
                      {selectedRow.PaymentMode}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs !mb-0 text-gray-400">
                      Transaction No
                    </p>
                    <p>{selectedRow.TransactionReference || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs !mb-0 text-gray-400">Status</p>
                    <span
                      className={`inline-block px-3 py-1 text-xs rounded-full font-medium
                      ${
                        selectedRow.Status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : selectedRow.Status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                      }`}
                    >
                      {selectedRow.Status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs !mb-0 text-gray-400">Date</p>
                    <p>{selectedRow.RequestDate}</p>
                  </div>
                </div>

                {/* Bank details */}
                {selectedRow.PaymentMode !== "UPI" && (
                  <div className="grid grid-cols-2 gap-3 mb-2 text-sm border-t pt-3 border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs !mb-0 text-gray-400">
                        Account Name
                      </p>
                      <p>{selectedRow.AccountName}</p>
                    </div>
                    <div>
                      <p className="text-xs !mb-0 text-gray-400">Account No</p>
                      <p>{selectedRow.AccountNo}</p>
                    </div>
                    <div>
                      <p className="text-xs !mb-0 text-gray-400">IFSC</p>
                      <p>{selectedRow.IFSCCode}</p>
                    </div>
                    <div>
                      <p className="text-xs !mb-0 text-gray-400">Branch</p>
                      <p>{selectedRow.Branch}</p>
                    </div>
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <p className="text-xs !mb-0 text-gray-400 mb-1">Remarks</p>
                  <div className="px-3 py-2 border rounded-md bg-gray-50 dark:bg-[#0f172a]">
                    {selectedRow.UserRemarks || "-"}
                  </div>
                </div>

                {/* Receipt */}
                {selectedRow.ReceiptUrl && (
                  <div>
                    <p className="text-xs !mb-0 text-gray-400 mb-2">Receipt</p>
                    <div
                      className="flex items-center gap-3 p-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                      onClick={() =>
                        window.open(selectedRow.ReceiptUrl, "_blank")
                      }
                    >
                      <img
                        src={selectedRow.ReceiptUrl}
                        alt="receipt"
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                      <div>
                        <p className="text-sm !mb-0 font-medium text-blue-600">
                          View Receipt
                        </p>
                        <p className="text-xs text-gray-400">
                          Click to open full image
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action section */}
                <div className="border-t pt-5 border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={actionStatus || selectedRow?.Status || ""}
                      onChange={(e) => setActionStatus(e.target.value)}
                      disabled={!isActionAllowed}
                      className={`h-10 px-3 text-sm border rounded-md
                        ${isActionAllowed ? "bg-white dark:bg-[#0f172a]" : "bg-gray-100 opacity-60 cursor-not-allowed"}
                        border-gray-300 dark:border-gray-600`}
                    >
                      {isActionAllowed && (
                        <option value="">Select Action</option>
                      )}
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Reject</option>
                    </select>

                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      disabled={!isActionAllowed}
                      placeholder="Enter remarks"
                      className={`h-10 px-3 text-sm border rounded-md
                        ${isActionAllowed ? "bg-white dark:bg-[#0f172a]" : "bg-gray-100 opacity-60 cursor-not-allowed"}
                        border-gray-300 dark:border-gray-600`}
                    />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#15203c]">
                <button
                  onClick={() => setShowModal(false)}
                  className="mr-[15px] px-[26.5px] py-[12px] rounded-md bg-danger-500 text-white hover:bg-danger-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isActionAllowed}
                  className={`px-[26.5px] py-[12px] rounded-md text-white transition-colors disabled:opacity-50
                    ${isActionAllowed ? "bg-primary-button-bg hover:opacity-90" : "bg-gray-400 cursor-not-allowed"}`}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Template;
