import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ApiService } from "../../../../services/ApiService";
import DataTable from "react-data-table-component";
import type { TableColumn } from "react-data-table-component";
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
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import { useCurrency } from "../../context/CurrencyContext";

const pageTitle = "Wallet Report";
const procedureName = "GetWalletReport";

// ✅ Move outside component — stable reference, never recreated
const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_PREVIEW_URL_2 + "ClientImages/";

// ✅ Stable fallback handler — defined once, never recreated
const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = "/images/default-avatar.png";
};

interface WalletRow {
  SNO: number;
  ClientId: number;
  MemberName: string;
  UserName: string;
  ClientLogo: string | null;
  Status: string;
  WalletAmount: number;
  ROIWallet: number;
  CommissionWallet: number;
  ProductWallet: number;
  TotalRecords: number;
}

const statsConfig = [
  // {
  //   key: "TotalMembers",
  //   title: "Total Members",
  //   icon: "groups",
  //   showCurrency: false,
  // },
  // {
  //   key: "ActiveMembers",
  //   title: "Active Members",
  //   icon: "verified",
  //   showCurrency: false,
  // },
  // {
  //   key: "InactiveMembers",
  //   title: "Inactive Members",
  //   icon: "person_off",
  //   showCurrency: false,
  // },
  // {
  //   key: "TotalWalletAmount",
  //   title: "Total Wallet",
  //   icon: "account_balance_wallet",
  //   showCurrency: true,
  // },
];

const exportColumns = [
  { key: "SNO", label: "SNO" },
  { key: "MemberName", label: "Member Name" },
  { key: "UserName", label: "Username" },
  { key: "Status", label: "Status" },
  { key: "WalletAmount", label: "Wallet Amount" },
  { key: "ROIWallet", label: "ROI Wallet" },
  { key: "CommissionWallet", label: "Commission Wallet" },
  { key: "ProductWallet", label: "Product Wallet" },
];

// Add this OUTSIDE the main component, at the top of the file
const MemberAvatar: React.FC<{ logo: string | null; name: string }> =
  React.memo(({ logo, name }) => {
    const [imgSrc, setImgSrc] = useState(
      logo ? `${IMAGE_BASE_URL}${logo}` : "/images/default-avatar.png",
    );

    return (
      <img
        src={imgSrc}
        alt={name}
        className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
        onError={() => setImgSrc("/images/default-avatar.png")}
      />
    );
  });

const WalletReport: React.FC = () => {
  const { universalService } = ApiService();
  const { currency } = useCurrency();
  const location = useLocation();
  const formName = location.pathname.split("/").pop();
  const canExport = SmartActions.canExport(formName);

  const [searchInput, setSearchInput] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [hasVisitedTable, setHasVisitedTable] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);

  const [data, setData] = useState<WalletRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortIndex, setSortIndex] = useState("");
  const [sortDirection, setSortDirection] = useState("ASC");
  const [stats, setStats] = useState({});
  const [tableLoading, setTableLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);

  // ✅ Memoize fmt so it only changes when currency changes
  const fmt = useCallback(
    (val: number) => currency.symbol + Number(val ?? 0).toLocaleString(),
    [currency.symbol],
  );

  // ✅ Memoize columns so DataTable doesn't re-render rows when parent re-renders
  const columns: TableColumn<WalletRow>[] = useMemo(
    () => [
      {
        name: "SNO",
        selector: (r) => r.SNO,
        sortable: true,
        width: "70px",
      },
      {
        name: "MEMBER",
        selector: (r) => r.MemberName,
        sortable: true,
        minWidth: "220px",
        cell: (r) => (
          <div className="flex items-center gap-3 py-1">
            <MemberAvatar logo={r.ClientLogo} name={r.MemberName} />{" "}
            {/* ✅ use this */}
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                {r.MemberName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {r.UserName}
              </span>
            </div>
          </div>
        ),
      },
      {
        name: "STATUS",
        selector: (r) => r.Status,
        sortable: true,
        cell: (r) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
              r.Status === "Active"
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-red-100 text-red-700 border-red-200"
            }`}
          >
            {r.Status}
          </span>
        ),
      },
      {
        name: "WALLET AMOUNT",
        selector: (r) => r.WalletAmount,
        sortable: true,
        cell: (r) => fmt(r.WalletAmount),
      },
      {
        name: "ROI WALLET",
        selector: (r) => r.ROIWallet,
        sortable: true,
        cell: (r) => fmt(r.ROIWallet),
      },
      {
        name: "COMMISSION WALLET",
        selector: (r) => r.CommissionWallet,
        sortable: true,
        cell: (r) => fmt(r.CommissionWallet),
      },
      {
        name: "PRODUCT WALLET",
        selector: (r) => r.ProductWallet,
        sortable: true,
        cell: (r) => fmt(r.ProductWallet),
      },
    ],
    [fmt],
  ); // ✅ only rebuilds when fmt changes (i.e. currency changes)

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
      const result = response?.data ?? response;
      if (!Array.isArray(result)) {
        setHasPageAccess(false);
        return;
      }
      const perm = result.find(
        (p: { FormNameWithExt: string; Action: string }) =>
          String(p.FormNameWithExt).trim().toLowerCase() ===
          formName?.trim().toLowerCase(),
      );
      if (!perm || !perm.Action || perm.Action.trim() === "") {
        setHasPageAccess(false);
        return;
      }
      SmartActions.load(result);
      setHasPageAccess(true);
    } catch {
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const GetStats = async () => {
    const payload = {
      procName: procedureName,
      Para: JSON.stringify({ ActionMode: "GetStats" }),
    };
    const res = await universalService(payload);
    const result = res?.data ?? res ?? [];
    setStats(result[0] || {});
  };

  const fetchGridData = async (options?: {
    pageOverride?: number;
    perPageOverride?: number;
  }) => {
    try {
      setTableLoading(true);
      const payload = {
        procName: procedureName,
        Para: JSON.stringify({
          ActionMode: "GetReport",
          SearchBy: filterColumn ?? "",
          Criteria: searchInput ?? "",
          Page: options?.pageOverride ?? page,
          PageSize: options?.perPageOverride ?? perPage,
          SortIndexColumn: sortIndex ?? "",
          SortDir: sortDirection ?? "ASC",
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
    } catch {
      setData([]);
      setTotalRows(0);
    } finally {
      setTableLoading(false);
    }
  };

  const fetchExportData = async () => {
    const payload = {
      procName: procedureName,
      Para: JSON.stringify({
        ActionMode: "GetReport",
        SearchBy: filterColumn ?? "",
        Criteria: searchInput ?? "",
        Page: 1,
        PageSize: 0,
        SortIndexColumn: sortIndex ?? "",
        SortDir: sortDirection ?? "ASC",
      }),
    };
    const res = await universalService(payload);
    return res?.data ?? res ?? [];
  };

  const handleSort = (column: TableColumn<WalletRow>, direction: string) => {
    if (!column?.id) return;
    setSortIndex(String(column.id));
    setSortDirection(direction.toUpperCase());
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchGridData({ pageOverride: p });
  };

  const handlePerRowsChange = (newPerPage: number, p: number) => {
    setPerPage(newPerPage);
    setPage(p);
    fetchGridData({ pageOverride: p, perPageOverride: newPerPage });
  };

  const applySearch = () => {
    if (!SmartActions.canSearch(formName)) return;
    setShowTable(true);
    setHasVisitedTable(true);
    setPage(1);
    setSearchTrigger((p) => p + 1);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchFormPermissions();
    GetStats();
  }, []);

  useEffect(() => {
    if (!showTable || !hasVisitedTable) return;
    fetchGridData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, sortIndex, sortDirection, searchTrigger]);

  if (permissionsLoading) return <Loader />;
  if (!hasPageAccess) return <AccessRestricted />;

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* HEADER */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            {pageTitle}
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3 sm:mt-0 flex-wrap justify-end">
          {/* FILTER DROPDOWN */}
          <div className="relative w-full sm:w-[180px]">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <i className="material-symbols-outlined !text-[18px]">
                filter_list
              </i>
            </span>
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              className="w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border border-gray-300 bg-white dark:bg-[#0c1427] dark:text-white dark:border-gray-600 focus:border-primary-button-bg"
            >
              <option value="">Filter By</option>
              <option value="Username">Username</option>
              <option value="ClientName">Member Name</option>
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <i className="material-symbols-outlined !text-[18px]">
                expand_more
              </i>
            </span>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <i className="material-symbols-outlined !text-[18px]">search</i>
            </span>
            <input
              type="text"
              value={searchInput}
              placeholder="Enter Criteria..."
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              className="h-[34px] w-full sm:w-[200px] pl-8 pr-3 text-xs rounded-md outline-none border border-gray-300 bg-white dark:bg-[#0c1427] dark:text-white dark:border-gray-600 focus:border-primary-button-bg"
            />
          </div>

          {/* BUTTONS */}
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
                <i className="material-symbols-outlined text-[20px]">search</i>
              </button>
            </PermissionAwareTooltip>

            {(filterColumn || searchInput) && (
              <button
                type="button"
                onClick={() => {
                  setFilterColumn("");
                  setSearchInput("");
                  setPage(1);
                  setSearchTrigger((p) => p + 1);
                }}
                className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-400 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <i className="material-symbols-outlined text-[20px]">close</i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LANDING */}
      {!showTable ? (
        <LandingIllustration
          title={pageTitle}
          formName={formName}
          description={
            <>
              Search Wallet Report using filters above.
              <br />
              View wallet balances per member across all wallet types.
            </>
          }
        />
      ) : (
        <div>
          {/* STATS */}
          <StatsCards
            stats={stats}
            config={statsConfig}
            loading={tableLoading}
          />

          {/* TOOLBAR */}
          {!tableLoading && data.length > 0 && (
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

              <PermissionAwareTooltip allowed={canExport}>
                <div
                  className={!canExport ? "pointer-events-none opacity-50" : ""}
                >
                  <ExportButtons
                    title={pageTitle}
                    columns={exportColumns}
                    fetchData={fetchExportData}
                    disabled={!canExport}
                  />
                </div>
              </PermissionAwareTooltip>
            </div>
          )}

          {/* TABLE */}
          <div className="trezo-card-content bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <DataTable
              columns={columns}
              data={data}
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
                <TableSkeleton rows={perPage} columns={columns.length} />
              }
              noDataComponent={!tableLoading && <OopsNoData />}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletReport;
