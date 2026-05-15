import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../services/ApiService";
import DataTable from "react-data-table-component";
import type { TableColumn } from "react-data-table-component";
import OopsNoData from "../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import TableSkeleton from "../Forms/TableSkeleton";
import customStyles from "../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import ExportButtons from "../../../../components/CommonFormElements/ExportButtons/ExportButtons";
import CustomPagination from "../../../../components/CommonFormElements/Pagination/CustomPagination";
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import { useLocation } from "react-router-dom";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";

interface TeamRow {
  SNO: number;
  NAME: string;
  USERNAME: string;
  
  PlaceUnderName: string;
  PlaceUnderUserName: string;
  MemberPosition: string;
  SponsorName: string;
  SponsorUserName: string;
  RegistrationDate: string;
  TotalRecords: number;
}

const PROCEDURE = "BinaryTeamReport";

const BinaryTeamReport: React.FC = () => {
  const { universalService } = ApiService();
  const location = useLocation();
  const formName = location.pathname.split("/").pop();
  const canExport = SmartActions.canExport(formName);

  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);
  const [hasSearched, setHasSearched] = useState(true); // auto-load on mount

  const [searchUsername, setSearchUsername] = useState("");
  const [activeTab, setActiveTab] = useState<"LEFT" | "RIGHT">("LEFT");
  const [filterColumn, setFilterColumn] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [data, setData] = useState<TeamRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchFormPermissions(); }, []);

  useEffect(() => {
    if (!hasSearched) return;
    fetchTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, perPage, searchTrigger]);

  const fetchFormPermissions = async () => {
    try {
      const saved = localStorage.getItem("EmployeeDetails");
      const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
      const payload = {
        procName: "AssignForm",
        Para: JSON.stringify({ ActionMode: "GetForms", FormName: formName, EmployeeId: employeeId }),
      };
      const response = await universalService(payload);
      const result = response?.data ?? response;
      if (!Array.isArray(result)) { setHasPageAccess(false); return; }
      const perm = result.find(
        (p) => String(p.FormNameWithExt).trim().toLowerCase() === formName?.trim().toLowerCase(),
      );
      if (!perm || !perm.Action || perm.Action.trim() === "") { setHasPageAccess(false); return; }
      SmartActions.load(result);
      setHasPageAccess(true);
    } catch {
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchTeamData = async (overrides?: { pageOverride?: number; perPageOverride?: number }) => {
    try {
      setLoading(true);
      const payload = {
        procName: PROCEDURE,
        Para: JSON.stringify({
          SearchUsername: searchUsername.trim() || "",
          TeamType: activeTab,
          SearchBy: filterColumn || "",
          Criteria: searchInput || "aaaaaaaaaaaaaaaaaa",
          Page: overrides?.pageOverride ?? page,
          PageSize: overrides?.perPageOverride ?? perPage,
        }),
      };
      const res = await universalService(payload);
      const result = res?.data ?? res;
      if (Array.isArray(result) && result.length > 0) {
        setData(result);
        setTotalRows(result[0].TotalRecords ?? result.length);
      } else {
        setData([]);
        setTotalRows(0);
      }
    } catch (err) {
      console.error("BinaryTeamReport failed", err);
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setHasSearched(true);
    setSearchTrigger((p) => p + 1);
  };

  const handleTabChange = (tab: "LEFT" | "RIGHT") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
    setData([]);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchTeamData({ pageOverride: p });
  };

  const handlePerRowsChange = (newPerPage: number, p: number) => {
    setPerPage(newPerPage);
    setPage(p);
    fetchTeamData({ perPageOverride: newPerPage, pageOverride: p });
  };

  const fetchExportData = async () => {
    const payload = {
      procName: PROCEDURE,
      Para: JSON.stringify({
        SearchUsername: searchUsername.trim() || null,
        TeamType: activeTab,
        SearchBy: filterColumn || null,
        Criteria: searchInput || null,
        Page: 1,
        PageSize: 0,
      }),
    };
    const res = await universalService(payload);
    return res?.data ?? res ?? [];
  };

  const exportColumns = [
    { key: "SNO", label: "SNO" },
    { key: "NAME", label: "Name" },
    { key: "USERNAME", label: "Username" },
      { key: "PlaceUnderName", label: "Place Under Name" },
    { key: "PlaceUnderUserName", label: "Place Under Username" },
    { key: "MemberPosition", label: "Position" },
    { key: "SponsorName", label: "Sponsor Name" },
    { key: "SponsorUserName", label: "Sponsor Username" },
    { key: "RegistrationDate", label: "Registration Date" },
  ];

  const columns: TableColumn<TeamRow>[] = [
    { name: "SNO", selector: (r) => r.SNO, sortable: true, width: "70px" },
    { name: "NAME", selector: (r) => r.NAME, sortable: true },
    { name: "USERNAME", selector: (r) => r.USERNAME, sortable: true },
 
    { name: "PLACE UNDER NAME", selector: (r) => r.PlaceUnderName, sortable: true },
    { name: "PLACE UNDER USERNAME", selector: (r) => r.PlaceUnderUserName, sortable: true },
    {
      name: "POSITION",
      selector: (r) => r.MemberPosition,
      sortable: true,
      cell: (r) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            r.MemberPosition === "Left"
              ? "bg-blue-100 text-blue-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {r.MemberPosition}
        </span>
      ),
    },
    { name: "SPONSOR NAME", selector: (r) => r.SponsorName, sortable: true },
    { name: "SPONSOR USERNAME", selector: (r) => r.SponsorUserName, sortable: true },
    { name: "REGISTRATION DATE", selector: (r) => r.RegistrationDate, sortable: true },
  ];

  if (permissionsLoading) return <Loader />;
  if (!hasPageAccess) return <AccessRestricted />;

  const hasData = data.length > 0;

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* ── Header ── */}
      <div className="trezo-card-header mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Member Team Details
          </h5>
        </div>
      </div>

      {/* ── Search Member ID ── */}
      <div className="py-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px] mb-5">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Search Member ID
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchUsername}
            placeholder="Enter Member ID / Username..."
            onChange={(e) => setSearchUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-[38px] w-full max-w-md px-3 text-sm rounded-md outline-none border border-gray-300 focus:border-primary-button-bg bg-white dark:bg-[#0c1427] dark:text-white dark:border-gray-600"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={!searchUsername.trim()}
            className="flex items-center gap-2 px-5 h-[38px] text-sm font-semibold text-white bg-primary-button-bg rounded-md hover:opacity-90 transition-all disabled:opacity-50"
          >
            <i className="material-symbols-outlined text-[18px]">search</i>
            Search Tree
          </button>
        </div>
      </div>

      {!hasSearched ? (
        <LandingIllustration
          title="Member Team Details"
          formName={formName}
          description={
            <>
              Enter a Member ID above and click <span className="font-medium">Search Tree</span> to view the binary team.
            </>
          }
        />
      ) : (
        <>
          {/* ── Tabs ── */}
          <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 mb-5">
            {(["LEFT", "RIGHT"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-6 py-3 text-sm font-semibold tracking-wide transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-primary-button-bg text-primary-button-bg"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab} TEAM
              </button>
            ))}
          </div>

          {/* ── Table toolbar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            {/* Per page + filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <select
                  value={perPage}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    setPerPage(size);
                    setPage(1);
                    fetchTeamData({ perPageOverride: size, pageOverride: 1 });
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

              {/* Search within results */}
              <div className="relative w-[160px]">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <i className="material-symbols-outlined !text-[16px]">filter_list</i>
                </span>
                <select
                  value={filterColumn}
                  onChange={(e) => setFilterColumn(e.target.value)}
                  className="w-full h-[32px] pl-8 pr-6 text-xs rounded-md appearance-none outline-none border border-gray-300 bg-white dark:bg-[#0c1427] dark:text-white dark:border-gray-600"
                >
                  <option value="">Filter By</option>
                  <option value="USERNAME">Username</option>
                  <option value="NAME">Name</option>
                
                </select>
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <i className="material-symbols-outlined !text-[16px]">expand_more</i>
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <i className="material-symbols-outlined !text-[16px]">search</i>
                </span>
                <input
                  type="text"
                  value={searchInput}
                  placeholder="Search..."
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { setPage(1); setSearchTrigger((p) => p + 1); }
                  }}
                  className="h-[32px] pl-8 pr-3 text-xs rounded-md outline-none border border-gray-300 bg-white dark:bg-[#0c1427] dark:text-white dark:border-gray-600 focus:border-primary-button-bg"
                />
              </div>

              {(filterColumn || searchInput) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterColumn("");
                    setSearchInput("");
                    setPage(1);
                    setSearchTrigger((p) => p + 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-100"
                >
                  <i className="material-symbols-outlined text-[18px]">close</i>
                </button>
              )}
            </div>

            {/* Export */}
            {/* <PermissionAwareTooltip allowed={canExport}>
              <div className={!canExport ? "pointer-events-none opacity-50" : ""}>
                <ExportButtons
                  title={`Binary Team Report - ${activeTab}`}
                  columns={exportColumns}
                  fetchData={fetchExportData}
                  disabled={!canExport}
                />
              </div>
            </PermissionAwareTooltip> */}
          </div>

          {/* ── DataTable ── */}
          <div className="trezo-card-content bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <DataTable
              columns={columns}
              data={data}
              customStyles={customStyles}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationComponent={(props) => (
                <CustomPagination {...props} currentPage={page} rowsPerPage={perPage} />
              )}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handlePerRowsChange}
              progressPending={loading}
              progressComponent={<TableSkeleton rows={perPage} columns={columns.length} />}
              noDataComponent={!loading && <OopsNoData />}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default BinaryTeamReport;
