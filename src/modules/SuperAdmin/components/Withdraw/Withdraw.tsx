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
import ActionCell from "../../../../components/CommonFormElements/DataTableComponents/WithdrawalCell";
import { useCurrency } from "../../context/CurrencyContext";
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import WithdrawActionModal from "./WithdrawalPopUp";
import Swal from "sweetalert2";

interface DateRange {
  from: string;
  to: string;
}

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
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
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
  const [dateRange, setDateRange] = useState({
    from: fromStr,
    to: toStr,
  });
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const statsConfig = [
    {
      key: "TotalWithdraw",
      title: "Total Withdraw",
      icon: "payments",
      variant: "income",
      showCurrency: true,
    },
    {
      key: "ThisMonthWithdraw",
      title: "This Month Withdraw",
      icon: "today",
      variant: "highlight",
      showCurrency: true,
    },
    {
      key: "PendingAmount",
      title: "Pending Withdraw",
      icon: "schedule",
      variant: "warning",
      showCurrency: true,
    },
    {
      key: "TotalPaid",
      title: "Approved Withdraw",
      icon: "check_circle",
      variant: "success",
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
  const IMAGE_BASE_URL =
    import.meta.env.VITE_IMAGE_PREVIEW_URL_2 + "ClientImages/";
  const fetchGridColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    try {
      const payload = {
        procName: "GetUserGridColumns",
        Para: JSON.stringify({
          UserId: employeeId,
          GridName: "USP_AdminWithdrawFundReport",
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

              //NORMAL ROW
              const value = row[c.ColumnKey];
              if (c.ColumnKey === "Member") {
                const profileUrl = row.ClientLogo
                  ? `${IMAGE_BASE_URL}${row.ClientLogo}`
                  : `https://ui-avatars.com/api/?name=${row.ClientName}&background=random`;

                return (
                  <div className="flex items-center gap-2">
                    <img
                      src={profileUrl}
                      alt="user"
                      className="w-9 h-9 rounded-full object-cover border"
                      onError={(e: any) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${row.ClientName}`;
                      }}
                    />

                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-sm">
                        {row.ClientName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {row.Username}
                      </span>
                    </div>
                  </div>
                );
              }
              // STATUS BADGE
              if (c.ColumnKey === "Status") {
                const getStatusClass = (status: string) => {
                  switch (status) {
                    case "Approved":
                      return "bg-green-100 text-green-700";
                    case "Rejected":
                      return "bg-red-100 text-red-700";
                    default:
                      return "bg-yellow-100 text-yellow-700"; // Pending
                  }
                };

                return (
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(
                      value,
                    )}`}
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
        const actionColumn = {
          name: "Action",
          cell: (row: any) => {
            if (row.__isTotal) return null;

            const status = row.Status;

            // ⭐ If Approved / Rejected → Show VIEW ICON
            if (status === "Approved" || status === "Rejected") {
              return (
                <button
                  className="text-blue-500 hover:text-blue-700"
                  onClick={() => handleView(row)}
                >
                  <i className="material-symbols-outlined">visibility</i>
                </button>
              );
            }

            // ⭐ If Pending → Show Take Action
            return <ActionCell row={row} OnAction={handleAction} />;
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
  const handleView = async (row: any) => {
    const details = await fetchWithdrawalDetails(row.WithdrawId);

    setSelectedRow(details);
    setOpen(true); // open same modal (readonly mode if needed)
  };
  const handleAction = async (row) => {
    try {
      const data = await fetchWithdrawalDetails(row.WithdrawId);

      if (data) {
        setSelectedRow(data);
        setOpen(true);
      } else {
        alert("No data found");
      }
    } catch (err) {
      console.error(err);
    } finally {
    }
  };
  const handleConfirmAction = async (payload) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to ${payload.status} this withdrawal`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: payload.status === "Approved" ? "#16a34a" : "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Yes, ${payload.status}`,
    });

    if (result.isConfirmed) {
      await handleSubmitAction(payload); // 👉 call actual API
    }
  };
  const handleSubmitAction = async (payload) => {
    try {
      const res = await approveRejectWithdrawal(payload);

      const data = res?.data?.[0] || res?.[0] || res;

      if (data?.StatusCode === 1) {
        await Swal.fire({
          title: "Success!",
          text: data?.Msg,
          icon: "success",
          confirmButtonColor: "#22c55e",
        });

        setOpen(false);

        // ✅ Step 1: mark row as removing (animation trigger)
        setData((prev: any[]) =>
          prev.map((row) =>
            row.WithdrawId === payload.withdrawId
              ? { ...row, isRemoving: true }
              : row,
          ),
        );

        // ✅ Step 2: remove after animation
        setTimeout(() => {
          setData((prev: any[]) =>
            prev.filter((row) => row.WithdrawId !== payload.withdrawId),
          );
        }, 300); // match animation time
      } else {
        Swal.fire({
          title: "Error",
          text: data?.Msg,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: "Something went wrong",
        icon: "error",
      });
    }
  };
  const approveRejectWithdrawal = async (payload: any) => {
    try {
      const apiPayload = {
        procName: "WithdrawFund",
        Para: JSON.stringify({
          ActionMode: "UpdateWithdrawStatus", // 👈 NEW ACTION MODE (you added in SP)
          WithdrawId: payload.withdrawId,
          Status: payload.status, // Approved / Rejected
          TransactionNo: payload.transactionId,
          WithdrawRemark: payload.remark,
        }),
      };

      const res = await universalService(apiPayload);

      return res;
    } catch (error) {
      console.error("Error in approve/reject:", error);
      throw error;
    }
  };
  const fetchWithdrawalDetails = async (withdrawId) => {
    try {
      const payload = {
        procName: "WithdrawFund",
        Para: JSON.stringify({
          ActionMode: "GetWitdrawalDetailById", // 👈 IMPORTANT
          WithdrawId: withdrawId,
        }),
      };

      const res = await universalService(payload);

      return res?.data?.[0] ?? res?.[0] ?? null;
    } catch (error) {
      console.error("Error fetching withdrawal details:", error);
      return null;
    }
  };
  const handleBulkAction = async (status: string) => {
    const pendingRows = selectedRows.filter((r) => r.Status === "Pending");
    if (pendingRows.length === 0) {
      Swal.fire({
        title: "No Pending Records",
        text: "Only pending withdrawals can be processed.",
        icon: "warning",
      });
      return;
    }
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to ${status} ${pendingRows.length} withdrawal(s)`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${status}`,
    });

    if (!result.isConfirmed) return;

    const withdrawIds = pendingRows.map((r) => r.WithdrawId);

    try {
      const res = await bulkApproveReject({
        withdrawIds,
        status,
      });

      const data = res?.data?.[0] || res?.[0] || res;

      if (data?.StatusCode === 1) {
        Swal.fire("Success", data.Msg, "success");

        // ✅ Remove rows locally (no refresh)
        setData((prev: any[]) =>
          prev.filter((row) => !withdrawIds.includes(row.WithdrawId)),
        );

        setSelectedRows([]);
      } else {
        Swal.fire("Error", data.Msg, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong", "error");
    }
  };
  const bulkApproveReject = async ({ withdrawIds, status }) => {
    const payload = {
      procName: "WithdrawFund",
      Para: JSON.stringify({
        ActionMode: "BulkUpdateWithdrawStatus",
        WithdrawIds: withdrawIds.join(","), // 👈 comma separated
        Status: status,
      }),
    };

    return await universalService(payload);
  };
  const exportColumns = columns
    .filter((c) => c.columnKey)
    .map((c) => ({
      key: c.columnKey,
      label: c.name,
    }));
  const fetchExportData = async () => {
    const payload = {
      procName: "AdminWithdrawFundReport",
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
      procName: "AdminWithdrawFundReport",
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
        procName: "AdminWithdrawFundReport",
        Para: JSON.stringify({
          Status: statusFilter,
          SearchBy: filterColumn,
          Criteria: searchInput,
          Page: page,
          PageSize: 0,
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
  const fetchVisibleColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    const payload = {
      procName: "UniversalColumnSelector",
      Para: JSON.stringify({
        EmployeeId: employeeId,
        USPName: "USP_AdminWithdrawFundReport",
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
    GetStats();
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
  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* --- HEADER & SEARCH SECTION --- */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h6 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Approve/Reject Withdraw
          </h6>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            <div className="px-4">
              <PermissionAwareTooltip
                allowed={SmartActions.canDateFilter(formName)}
                allowedText="Filter by Date"
              >
                <DateRangeFilter
                 disabled={!SmartActions.canDateFilter(formName)}
                  initialRange={{ start: oneYearAgo, end: today }}
                  onChange={(range) => {
                    setPendingRange({
                      from: format(range.start, "yyyy-MM-dd"),
                      to: format(range.end, "yyyy-MM-dd"),
                    });
                  }}
                />
              </PermissionAwareTooltip>
            </div>
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
                  <option value="UserName">Username</option>
                  <option value="MemberName">Member Name</option>
                  <option value="Status">Status</option>
                  <option value="PaymentMode">Payment Mode</option>
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
            <div className="relative w-full sm:w-[160px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                <i className="material-symbols-outlined !text-[18px] mt-2">
                  pending_actions
                </i>
              </span>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                }}
                className="w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border transition-all
                           bg-white text-black border-gray-300 focus:border-primary-button-bg"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
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
                    procName="USP_AdminWithdrawFundReport"
                    onApply={fetchVisibleColumns}
                  />
                </div>
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
      {!showTable && (
        <LandingIllustration
          title="Approve/Reject Withdraw"
          formName={formName}
          // addLabel="Add Income"
          description={
            <>
              Search Withdraw Report using filters above.
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
            // loading={tableLoading}
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
            <div className="flex justify-between items-center py-2 mb-[10px] gap-3 flex-wrap">
              {/* LEFT — Page Size */}
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

              {/* RIGHT — Export + Bulk Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* APPROVE SELECTED */}
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

                {/* REJECT SELECTED */}
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
                      title="Withdraw Report"
                      columns={exportColumns}
                      fetchData={fetchExportData}
                      disabled={!canExport}
                    />
                  </div>
                </PermissionAwareTooltip>
              </div>
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
              selectableRows
              selectableRowDisabled={(row) =>
                row.__isTotal || row.Status !== "Pending"
              }
              onSelectedRowsChange={({ selectedRows }) => {
                setSelectedRows(selectedRows);
              }}
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
                  classNames: ["hide-checkbox"], // ✅ hides checkbox via CSS
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
          <WithdrawActionModal
            isOpen={open}
            onClose={() => setOpen(false)}
            data={selectedRow}
            onSubmit={(payload) => {
              handleConfirmAction(payload);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Template;
