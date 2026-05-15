import React, { useState, useEffect } from "react";
import { ApiService } from "../../../../services/ApiService";
import DataTable from "react-data-table-component";
import type { TableColumn } from "react-data-table-component";
import OopsNoData from "../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import TableSkeleton from "../Forms/TableSkeleton";
import customStyles from "../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import ExportButtons from "../../../../components/CommonFormElements/ExportButtons/ExportButtons";
import { SmartActions } from "../Security/SmartActionWithFormName";
import { useLocation } from "react-router-dom";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";
import { useCurrency } from "../../context/CurrencyContext";

interface SelfDetail {
  Name: string;
  UserName: string;
}

interface DownlineRow {
  SNO: number;
  ID: string;
  NAME: string;
  ClientLogo: string;
  "REGISTRATION DATE": string;
  "ACTIVATION DATE": string;
  JoiningAmount: number;
  MemberId: number;
}

const TeamDownlineReport: React.FC = () => {
  const { universalService } = ApiService();
  const { currency } = useCurrency();
  const location = useLocation();
  const formName = location.pathname.split("/").pop();
  const canExport = SmartActions.canExport(formName);

  const [selfData, setSelfData] = useState<SelfDetail | null>(null);
  const [downlineData, setDownlineData] = useState<DownlineRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [hasPageAccess, setHasPageAccess] = useState(true);

  const rootMemberId = (() => {
    const saved = localStorage.getItem("EmployeeDetails");
    return saved ? JSON.parse(saved).ClientId ?? JSON.parse(saved).EmployeeId ?? 1 : 1;
  })();

  const [currentMemberId, setCurrentMemberId] = useState<number>(rootMemberId);
  const [isAtRoot, setIsAtRoot] = useState(true);

  const fetchFormPermissions = async () => {
    try { 
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
    } catch {
      setHasPageAccess(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchSponsorData = async (memberId: number) => {
    try {
      setLoading(true);

      const payload = {
        procName: "SponsorPrintView",
        Para: JSON.stringify({ MemberId: memberId }),
      };

      const res = await universalService(payload);
      const result = res?.data ?? res;

      if (!result || result === "NoRecord") {
        setSelfData(null);
        setDownlineData([]);
        return;
      }

      // Single result set: rows are the downline members.
      // UserDetails column in each row contains the current member's info as a JSON string.
      if (Array.isArray(result)) {
        if (result.length > 0) {
          try {
            const raw = result[0].UserDetails;
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            setSelfData(Array.isArray(parsed) ? parsed[0] : parsed);
          } catch {
            setSelfData(null);
          }
        } else {
          setSelfData(null);
        }
        setDownlineData(result);
      } else {
        setSelfData(null);
        setDownlineData([]);
      }
    } catch (err) {
      console.error("SponsorPrintView failed", err);
      setSelfData(null);
      setDownlineData([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchFormPermissions(); }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSponsorData(currentMemberId); }, [currentMemberId]);

  const drillDown = (memberId: number) => {
    setCurrentMemberId(memberId);
    setIsAtRoot(memberId === rootMemberId);
  };

  const backToMain = () => {
    setCurrentMemberId(rootMemberId);
    setIsAtRoot(true);
  };

  const exportColumns = [
    { key: "SNO", label: "SNO" },
    { key: "ID", label: "Member ID" },
    { key: "NAME", label: "Member Name" },
    { key: "REGISTRATION DATE", label: "Registration Date" },
    { key: "ACTIVATION DATE", label: "Activation Date" },
    { key: "JoiningAmount", label: "Joining Amount" },
  ];

  const IMAGE_BASE_URL =
    import.meta.env.VITE_IMAGE_PREVIEW_URL_2 + "ClientImages/";

  const columns: TableColumn<DownlineRow>[] = [
    // {
    //   name: "SNO",
    //   selector: (row: DownlineRow) => row.SNO,
    //   sortable: true,
    //   width: "70px",
    // },
    {
      name: "MEMBER",
      selector: (row: DownlineRow) => row.NAME,
      sortable: true,
      minWidth: "220px",
      cell: (row: DownlineRow) => (
        <div className="flex items-center gap-3 py-1">
          <img
            src={`${IMAGE_BASE_URL}${row.ClientLogo}`}
            alt={row.NAME}
            className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
           
          />
          <div className="flex flex-col lead-ing-tight">
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              {row.ID}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {row.NAME}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: "REGISTRATION DATE",
      selector: (row: DownlineRow) => row["REGISTRATION DATE"],
      sortable: true,
    },
    {
      name: "ACTIVATION DATE",
      selector: (row: DownlineRow) => row["ACTIVATION DATE"] || "--",
      sortable: true,
      cell: (row: DownlineRow) => row["ACTIVATION DATE"] || "--",
    },
    {
      name: "JOINING AMOUNT",
      selector: (row: DownlineRow) => row.JoiningAmount,
      sortable: true,
      cell: (row: DownlineRow) => currency.symbol + (row.JoiningAmount ?? 0).toLocaleString(),
    },
    {
      name: "ACTION",
      ignoreRowClick: true,
      button: true,
      cell: (row: DownlineRow) => (
        <button
          onClick={() => drillDown(row.MemberId)}
          className="px-3 py-1 text-xs font-semibold text-white rounded-md transition-all"
          style={{ backgroundColor: "#007bff" }}
        >
          Downline Team
        </button>
      ),
    },
  ];

  if (permissionsLoading) return <Loader />;
  if (!hasPageAccess) return <AccessRestricted />;

  const hasDownline = downlineData.length > 0;

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* Header */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Team Downline Report
          </h5>
        </div>

        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          {!isAtRoot && (
            <button
              onClick={backToMain}
              className="flex items-center gap-1 px-4 py-[7px] text-xs font-semibold rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all"
            >
              <i className="material-symbols-outlined text-[16px]">arrow_back</i>
              Back to Main
            </button>
          )}
          <button
            onClick={() => fetchSponsorData(currentMemberId)}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-400 text-gray-600 hover:bg-gray-100 transition-all"
            title="Reload"
          >
            <i className="material-symbols-outlined text-[20px]">refresh</i>
          </button>
        </div>
      </div>

      {/* Self Detail Mini Table */}
      {selfData && (
        <div className="mb-5">
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">UserName</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-[#0c1427]">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                    {selfData.Name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {selfData.UserName}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Row */}
      {/* {hasDownline && !loading && (
        <div className="flex justify-end py-2 mb-2">
          <div className={!canExport ? "pointer-events-none opacity-50" : ""}>
            <ExportButtons
              title="Team Downline Report"
              columns={exportColumns}
              fetchData={async () => downlineData}
              disabled={!canExport}
            />
          </div>
        </div>
      )} */}

      {/* Downline DataTable */}
      <div className="trezo-card-content bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <DataTable
          title=""
          columns={columns}
          data={downlineData}
          customStyles={customStyles}
          pagination
          progressPending={loading}
          progressComponent={<TableSkeleton rows={10} columns={7} />}
          noDataComponent={
            !loading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <OopsNoData />
                {!isAtRoot && (
                  <button
                    onClick={backToMain}
                    className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-primary-button-bg rounded-md hover:opacity-90 transition-all"
                  >
                    Reload (Back to Main)
                  </button>
                )}
              </div>
            )
          }
        />
      </div>
    </div>
  );
};

export default TeamDownlineReport;