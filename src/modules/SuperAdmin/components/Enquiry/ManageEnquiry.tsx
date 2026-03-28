import React, { useEffect, useState } from "react";
import { ApiService } from "../../../../services/ApiService";
import { useSweetAlert } from "../../../../context/sweetalert/SweetAlertContext";
import ColumnSelector from "../ColumnSelector/ColumnSelector";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SmartActions } from "../Security/SmartAction";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { useNavigate } from "react-router-dom";
import Pagination from "../../common/Pagination";
import { formatDate } from "../../../../utils/dateFormatter";
import TableSkeleton from "../../BindedComponent/form/TableSkeleton.tsx/TableSkeleton";

type Enquiry = {
  EnquiryId: number;
  EnquiryNo: string;
  Name: string;
  EmailId: string;
  ContactNo: string;
  EnquiryStatus: string;
  CityName: string;
  ExpectedCallBack: string;
  EntryDate: string;
  TotalRecords?: number;
};

const EnquiryList: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchInput, setSearchInput] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [tableLoading, setTableLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [hasVisitedTable, setHasVisitedTable] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>("EnquiryId");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
  const [columnsReady, setColumnsReady] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [statusDirty, setStatusDirty] = useState(false);
  const DATE_COLUMNS = ["ExpectedCallBack", "EntryDate"];

  const navigate = useNavigate();
  const { universalService } = ApiService();
  const { ShowConfirmAlert, ShowSuccessAlert } = useSweetAlert();
  const CURRENT_FORM_ID = 17; 
  const NO_FILTER = "__NONE__";

  const ALLOWED_SORT_COLUMNS = [
    "EnquiryId",
    "EnquiryNo",
    "Name",
    "EmailId",
    "ContactNo",
    "EnquiryStatus",
    "CityName",
    "ExpectedCallBack",
    "EntryDate",
  ];

  const getCellValue = (row: any, columnName: string) => {
    const key = Object.keys(row).find(
      (k) => k.toLowerCase() === columnName.toLowerCase(),
    );

    const value = key ? row[key] : null;

    // 🔥 Date handling (centralized)
    if (DATE_COLUMNS.includes(columnName)) {
      return formatDate(value, "readable");
    }

    return value ?? "-";
  };

  const getFilterPayload = (filter: string, value: string) => {
    const payload: any = {};

    // ✅ STATUS FILTER
    if (statusFilter && statusFilter !== "All") {
      payload.Status = statusFilter;
    }

    // ✅ TEXT SEARCH (THIS IS THE FIX)
    if (value && value.trim() !== "") {
      payload.SearchBy = filter && filter !== "" ? filter : "ALL";
      payload.Criteria = value.trim();
    }

    return payload;
  };

  const getCompanyId = () => {
    const saved = localStorage.getItem("EmployeeDetails");
    return saved ? JSON.parse(saved).CompanyId : null;
  };

  const fetchExportData = async () => {
    const filters = getFilterPayload(filterColumn, searchQuery);
    const payload = {
      procName: "AddEnquiry",
      Para: JSON.stringify({
        ActionMode: "Export",
        CompanyId: getCompanyId(),
        ...filters,
        SortColumn: sortColumn,
        SortDir: sortDirection,
      }),
    };
    const response = await universalService(payload);
    return response?.data || response || [];
  };

  const applySearch = () => {
    if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;

    const trimmed = searchInput.trim();

    if (statusFilter === "All" && !trimmed) {
      setFilterColumn("");
      setSearchQuery("");
      setSearchInput("");
    } else {
      if (!filterColumn && trimmed) {
        setFilterColumn("Name");
      }
      setSearchQuery(trimmed);
    }

    setCurrentPage(1);
    setShowTable(true);

    // 🔥 ONLY trigger
    setSearchTrigger((prev) => prev + 1);
  };

  const exportCSV = async () => {
    const data = await fetchExportData();
    if (!data.length) return;
    const header = displayedColumns.map((c) => c.DisplayName).join(",");
    const rows = data.map((item: any) =>
      displayedColumns
        .map((col) => `"${getCellValue(item, col.ColumnName)}"`)
        .join(","),
    );
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "enquiries.csv";
    a.click();
  };

  const exportExcel = async () => {
    const data = await fetchExportData();
    if (!data.length) return;
    const rows = data.map((item: any) =>
      displayedColumns.reduce((obj: any, col) => {
        obj[col.DisplayName] = getCellValue(item, col.ColumnName);
        return obj;
      }, {}),
    );
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Enquiries");
    XLSX.writeFile(workbook, "enquiries.xlsx");
  };

  const exportPDF = async () => {
    const data = await fetchExportData();
    if (!data.length) return;
    const doc = new jsPDF("l");
    const tableColumn = displayedColumns.map((c) => c.DisplayName);
    const tableRows = data.map((item: any) =>
      displayedColumns.map((col) => getCellValue(item, col.ColumnName)),
    );
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [25, 118, 210] },
    });
    doc.save("enquiries.pdf");
  };

  const printTable = async () => {
    const data = await fetchExportData();
    if (!data.length) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const headers = displayedColumns
      .map((c) => `<th>${c.DisplayName}</th>`)
      .join("");

    const rows = data
      .map(
        (row: any) => `
      <tr>
        ${displayedColumns
          .map((col) => `<td>${getCellValue(row, col.ColumnName)}</td>`)
          .join("")}
      </tr>
    `,
      )
      .join("");

    printWindow.document.write(`
    <html>
      <head>
        <title>Print Enquiries</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h2 {
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
          }
          th {
            background: #1976d2;
            color: white;
          }
          @page {
            size: landscape;
          }
        </style>
      </head>
      <body>
        <h2>Enquiries</h2>
        <table>
          <thead>
            <tr>${headers}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const fetchVisibleColumns = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    const payload = {
      procName: "UniversalColumnSelector",
      Para: JSON.stringify({
        EmployeeId: employeeId,
        USPName: "USP_AddEnquiry",
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
    }
  };

  const displayedColumns = React.useMemo(() => {
    return visibleColumns
      .filter((c) => c.IsVisible && c.IsHidden)
      .sort((a, b) => a.DisplayOrder - b.DisplayOrder);
  }, [visibleColumns]);

  const handleDelete = async (enquiryId: number) => {
    const result = await ShowConfirmAlert(
      "Are you sure you want to delete this enquiry?",
    );
    if (!result) return;

    try {
      const payload = {
        procName: "AddEnquiry", // ✅ this is OK as per your API
        Para: JSON.stringify({
          ActionMode: "Delete",
          EditId: enquiryId, // ✅ now TS is happy
          EntryBy: 1,
        }),
      };

      const response = await universalService(payload);
      const res = Array.isArray(response) ? response[0] : response;

      const status =
        res?.StatusCode ?? res?.statuscode ?? res?.statusCode ?? res?.status;

      if (String(status) === "1") {
        ShowSuccessAlert("Enquiry deleted successfully");

        if (enquiries.length === 1 && currentPage > 1) {
          setCurrentPage((p) => p - 1);
        } else {
          fetchTableData();
        }
      }
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const fetchTableData = async () => {
    try {
      setTableLoading(true);
      const filters = getFilterPayload(filterColumn, searchQuery);
      const payload = {
        procName: "AddEnquiry",
        Para: JSON.stringify({
          ActionMode: "List",
          CompanyId: getCompanyId(),
          Start: (currentPage - 1) * itemsPerPage,
          Length: itemsPerPage,
          SortColumn: sortColumn,
          SortDir: sortDirection,

          ...filters,
        }),
      };
      const response = await universalService(payload);
      const apiRes = response?.data || response;
      if (!Array.isArray(apiRes)) {
        setEnquiries([]);
        setTotalCount(0);
        return;
      }
      setTotalCount(apiRes[0]?.TotalRecords ?? 0);
      setEnquiries(apiRes);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setTableLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= Math.ceil(totalCount / itemsPerPage)) {
      setCurrentPage(page);
    }
  };

  const handleSort = (column: string) => {
    if (
      !ALLOWED_SORT_COLUMNS.includes(column) ||
      !displayedColumns.some((c) => c.ColumnName === column)
    )
      return;
    setCurrentPage(1);
    if (sortColumn === column) {
      setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
    } else {
      setSortColumn(column);
      setSortDirection("ASC");
    }
  };

  const fetchFormPermissions = async () => {
    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    const payload = {
      procName: "AssignForm",
      Para: JSON.stringify({
        ActionMode: "Forms",
        FormCategoryId: 4072,
        EmployeeId: employeeId,
      }),
    };
    const response = await universalService(payload);
    const data = response?.data ?? response;
    if (Array.isArray(data)) SmartActions.load(data);
  };

  const isFilterActive =
    filterColumn !== "" || searchQuery !== "" || statusFilter !== "All";

  useEffect(() => {
    fetchFormPermissions();
  }, []);

  useEffect(() => {
    if (!showTable) return;
    const loadInitial = async () => {
      await fetchTableData();
      await fetchVisibleColumns();
    };
    loadInitial();
  }, [showTable]);

  useEffect(() => {
    if (showTable) fetchTableData();
  }, [
    currentPage,
    itemsPerPage,
    searchQuery,
    sortColumn,
    sortDirection,
    searchTrigger,
  ]);

  const skeletonColumns = React.useMemo(() => {
    return displayedColumns.length > 0 ? displayedColumns.length + 1 : 6;
  }, [displayedColumns]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <>
      <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
        {/* Header and Filters */}
        <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
          {" "}
          <div className="trezo-card-title">
            <h5 className="!mb-0">Manage Enquiries</h5>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-[7px] w-full">
              {/* Status Filter */}
              <PermissionAwareTooltip
                allowed={SmartActions.canAdvancedSearch(CURRENT_FORM_ID)}
                allowedText="Filter by status"
                deniedText="Permission required"
              >
                <div className="relative w-full sm:w-[150px]">
                  <select
                    disabled={!SmartActions.canAdvancedSearch(CURRENT_FORM_ID)}
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                    }}
                    className={`w-full h-[34px] text-xs rounded-md px-3 appearance-none outline-none border transition-all ${
                      SmartActions.canAdvancedSearch(CURRENT_FORM_ID)
                        ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                  >
                    <option value="All">All</option>
                    <option value="New">New</option>
                    <option value="Open">Open</option>
                    <option value="Converted">Converted</option>
                    <option value="Not Converted">Not Converted</option>
                  </select>
                </div>
              </PermissionAwareTooltip>

              {/* Filter Dropdown */}
              <PermissionAwareTooltip
                allowed={SmartActions.canAdvancedSearch(CURRENT_FORM_ID)}
                allowedText="Filter records"
                deniedText="Permission required"
              >
                <div className="relative w-full sm:w-[180px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                    <i className="material-symbols-outlined !text-[18px]">
                      filter_list
                    </i>
                  </span>
                  <select
                    disabled={!SmartActions.canAdvancedSearch(CURRENT_FORM_ID)}
                    value={filterColumn}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilterColumn(value === NO_FILTER ? "" : value);
                      setSearchInput("");
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className={`w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border transition-all ${
                      SmartActions.canAdvancedSearch(CURRENT_FORM_ID)
                        ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                  >
                    <option value={NO_FILTER}>Select Filter Option</option>
                    <option value="Name">Customer Name</option>
                    <option value="EnquiryNo">Enquiry No</option>
                    <option value="EmailId">Email</option>
                    <option value="ContactNo">Contact No</option>
                    <option value="C.CityName">City</option>
                    <option value="EnquiryStatus">Status</option>
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                    <i className="material-symbols-outlined !text-[18px]">
                      expand_more
                    </i>
                  </span>
                </div>
              </PermissionAwareTooltip>

              {/* Search Input */}
              <PermissionAwareTooltip
                allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                allowedText="Search records"
                deniedText="Permission required"
              >
                <div className="relative w-full">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                    <i className="material-symbols-outlined !text-[18px]">
                      search
                    </i>
                  </span>
                  <input
                    type="text"
                    value={searchInput}
                    disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                    placeholder="Enter Criteria..."
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applySearch()}
                    className={`h-[34px] w-full pl-8 pr-3 text-xs rounded-md outline-none border transition-all ${
                      SmartActions.canSearch(CURRENT_FORM_ID)
                        ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                  />
                </div>
              </PermissionAwareTooltip>

              {/* Action Buttons Group */}
              <div className="flex items-center justify-end gap-[7px]">
                {/* Search Button */}
                <PermissionAwareTooltip
                  allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                  allowedText="Search"
                >
                  <button
                    type="button"
                    onClick={applySearch}
                    disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all disabled:opacity-50"
                  >
                    <i className="material-symbols-outlined text-[20px]">
                      search
                    </i>
                  </button>
                </PermissionAwareTooltip>

                {/* Column Selector */}
                <PermissionAwareTooltip
                  allowed={SmartActions.canManageColumns(CURRENT_FORM_ID)}
                  allowedText="Manage Columns"
                  deniedText="You do not have permission to manage columns"
                >
                  <div
                    className={`h-[34px] flex items-center ${
                      SmartActions.canManageColumns(CURRENT_FORM_ID)
                        ? ""
                        : "pointer-events-none opacity-50"
                    }`}
                  >
                    <ColumnSelector
                      procName="USP_AddEnquiry"
                      onApply={fetchVisibleColumns}
                      disabled={!SmartActions.canManageColumns(CURRENT_FORM_ID)}
                    />
                  </div>
                </PermissionAwareTooltip>

                {/* Add Button (Navigation) */}
                <PermissionAwareTooltip
                  allowed={SmartActions.canAdd(CURRENT_FORM_ID)}
                  allowedText="Add New "
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/superadmin/enquiry/add-enquiry")
                    }
                    disabled={!SmartActions.canAdd(CURRENT_FORM_ID)}
                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-white text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg  hover:text-primary-button-bg transition-all disabled:opacity-50"
                  >
                    <i className="material-symbols-outlined text-[20px]">add</i>
                  </button>
                </PermissionAwareTooltip>

                {/* Refresh Button */}
                {showTable && isFilterActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterColumn("");
                      setSearchInput("");
                      setSearchQuery("");
                      setStatusFilter("All");
                      setCurrentPage(1);
                      setSearchTrigger((prev) => prev + 1);
                    }}
                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-400 text-gray-500 hover:bg-gray-100 transition-all"
                  >
                    <i className="material-symbols-outlined text-[20px]">
                      refresh
                    </i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table or Placeholder */}
        {!showTable ? (
          <div className="w-full bg-white dark:bg-[#0c1427] rounded-md border border-gray-200 dark:border-[#172036] p-10 flex flex-col md:flex-row items-center md:items-start justify-center md:gap-x-80 min-h-[450px]">
            <div className="md:max-w-md md:px-3 px-0 py-14">
              <h1 className="text-3xl font-semibold text-black dark:text-white mb-4">
                Manage Enquiries
              </h1>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-[15px]">
                Search enquiries by Name, Code, Department or Designation to
                manage records.
                <br />
                OR <br />
                Click below to add New Enquirie.
              </p>
              <PermissionAwareTooltip
                allowed={SmartActions.canAdd(CURRENT_FORM_ID)}
                allowedText="Add New"
                deniedText="You do not have permission to add enquiries"
              >
                <button
                  type="button"
                  onClick={() => navigate("/superadmin/enquiry/add-enquiry")}
                  disabled={!SmartActions.canAdd(CURRENT_FORM_ID)}
                  className={`px-[26.5px] py-[12px] rounded-md transition-all ${
                    SmartActions.canAdd(CURRENT_FORM_ID)
                      ? "bg-primary-button-bg text-white hover:bg-primary-button-bg-hover"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Add Enquirie
                </button>
              </PermissionAwareTooltip>
            </div>
            {/* RIGHT ILLUSTRATION */}
            <div className="hidden md:flex">
              <svg
                viewBox="0 0 512 512"
                className="w-[320px] h-auto opacity-100 select-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Main Card Background - using primary-button-bg */}
                <rect
                  x="40"
                  y="80"
                  width="432"
                  height="340"
                  rx="30"
                  className="fill-primary-button-bg"
                />

                {/* Card Header - using primary-button-bg (darker) */}
                <path
                  d="M70 80H442C458.569 80 472 93.4315 472 110V130H40V110C40 93.4315 53.4315 80 70 80Z"
                  className="fill-primary-200"
                />

                {/* Content Lines/Items - also using primary-button-bg for contrast */}
                <g className="fill-primary-200">
                  <rect x="90" y="210" width="25" height="25" rx="6" />
                  <rect x="140" y="210" width="240" height="15" rx="7.5" />

                  <rect x="90" y="265" width="25" height="25" rx="6" />
                  <rect x="140" y="265" width="240" height="15" rx="7.5" />

                  <rect x="90" y="320" width="25" height="25" rx="6" />
                  <rect x="140" y="320" width="240" height="15" rx="7.5" />
                </g>

                {/* Magnifying Glass Handle - using primary-button-bg */}
                <rect
                  x="430"
                  y="420"
                  width="20"
                  height="80"
                  rx="5"
                  transform="rotate(-45 430 420)"
                  className="fill-primary-button-bg"
                />

                {/* Magnifying Glass Lens - using primary-50 (lightest) */}
                <circle
                  cx="380"
                  cy="380"
                  r="90"
                  className="fill-primary-50 stroke-primary-200"
                  strokeWidth="8"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="trezo-card-content -mx-[20px] md:-mx-[25px]">
            {tableLoading || !columnsReady ? (
              <div className="table-responsive overflow-x-auto">
                <TableSkeleton
                  rows={itemsPerPage > 10 ? 10 : itemsPerPage}
                  columns={skeletonColumns}
                  showExportSkeleton
                  showPageSizeSkeleton
                />
              </div>
            ) : totalCount === 0 && enquiries.length === 0 ? (
              /* ✅ OOPS – NO RECORDS FOUND */
              <div className="flex flex-col md:flex-row items-center justify-center p-10 gap-10 min-h-[300px] animate-in fade-in zoom-in duration-300">
                <div className="text-center md:text-left max-w-md">
                  <h3 className="text-xl font-bold text-purple-600 mb-1">
                    Oops!
                  </h3>
                  <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">
                    No records found!
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Please adjust the data filter and search again.
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <svg
                    viewBox="0 0 512 512"
                    className="w-[320px] h-auto select-none"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                  >
                    {/* Box Outline */}
                    <path
                      d="M96 220L256 300L416 220"
                      className="stroke-primary-button-bg"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Left Flap */}
                    <path
                      d="M96 220L150 160L256 200"
                      className="stroke-primary-button-bg"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Right Flap */}
                    <path
                      d="M416 220L362 160L256 200"
                      className="stroke-primary-button-bg"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Bottom Box */}
                    <path
                      d="M96 220V340C96 360 112 376 132 376H380C400 376 416 360 416 340V220"
                      className="stroke-primary-button-bg"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Inner Fill */}
                    <path
                      d="M150 220L256 260L362 220L256 190L150 220Z"
                      className="fill-primary-button-bg"
                    />

                    {/* Floating Motion Path */}
                    <path
                      d="M256 110C300 90 340 110 340 140C340 165 300 175 256 200"
                      className="stroke-primary-button-bg"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="12 14"
                    />

                    {/* Floating e */}
                    <circle
                      cx="256"
                      cy="90"
                      r="26"
                      className="stroke-primary-button-bg fill-primary-50"
                      strokeWidth="6"
                    />

                    <path
                      d="M245 92H268C268 78 245 78 245 92C245 106 268 106 268 92"
                      className="stroke-primary-button-bg"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <>
                {/* Export Buttons */}
                <div className="flex justify-between items-center px-7 py-2 mb-2">
                  {/* Page Size Selector */}
                  <PermissionAwareTooltip
                    allowed={true}
                    allowedText="Items per page"
                  >
                    <div className="relative group">
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
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
                  </PermissionAwareTooltip>

                  <div className="flex items-center gap-2 leading-none">
                    {/* PDF */}
                    <PermissionAwareTooltip
                      allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                      allowedText="Export PDF"
                      deniedText="You do not have permission to export"
                    >
                      <button
                        type="button"
                        disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                        onClick={() => {
                          if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                          exportPDF();
                        }}
                        className={`h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase rounded-md transition-all ${
                          SmartActions.canSearch(CURRENT_FORM_ID)
                            ? "text-primary-button-bg border border-primary-button-bg hover:bg-primary-button-bg hover:text-white"
                            : "text-gray-300 border border-gray-300 cursor-not-allowed"
                        }`}
                      >
                        PDF
                      </button>
                    </PermissionAwareTooltip>

                    {/* EXCEL */}
                    <PermissionAwareTooltip
                      allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                      allowedText="Export Excel"
                      deniedText="You do not have permission to export"
                    >
                      <button
                        type="button"
                        disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                        onClick={() => {
                          if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                          exportExcel();
                        }}
                        className={`h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase rounded-md transition-all ${
                          SmartActions.canSearch(CURRENT_FORM_ID)
                            ? "text-primary-button-bg border border-primary-button-bg hover:bg-primary-button-bg hover:text-white"
                            : "text-gray-300 border border-gray-300 cursor-not-allowed"
                        }`}
                      >
                        Excel
                      </button>
                    </PermissionAwareTooltip>

                    {/* CSV */}
                    <PermissionAwareTooltip
                      allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                      allowedText="Export CSV"
                      deniedText="You do not have permission to export"
                    >
                      <button
                        type="button"
                        disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                        onClick={() => {
                          if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                          exportCSV();
                        }}
                        className={`h-8 px-3 inline-flex items-center justify-center text-xs font-semibold uppercase rounded-md transition-all ${
                          SmartActions.canSearch(CURRENT_FORM_ID)
                            ? "text-primary-button-bg border border-primary-button-bg hover:bg-primary-button-bg hover:text-white"
                            : "text-gray-300 border border-gray-300 cursor-not-allowed"
                        }`}
                      >
                        CSV
                      </button>
                    </PermissionAwareTooltip>

                    {/* PRINT */}
                    <PermissionAwareTooltip
                      allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                      allowedText="Print "
                      deniedText="You do not have permission to print"
                    >
                      <button
                        type="button"
                        disabled={!SmartActions.canSearch(CURRENT_FORM_ID)}
                        onClick={() => {
                          if (!SmartActions.canSearch(CURRENT_FORM_ID)) return;
                          printTable();
                        }}
                        className={`h-8 px-3 inline-flex items-center justify-center
      text-xs font-semibold uppercase rounded-md transition-all
      ${
        SmartActions.canSearch(CURRENT_FORM_ID)
          ? "text-primary-button-bg border border-primary-button-bg hover:bg-primary-button-bg hover:text-white"
          : "text-gray-300 border border-gray-300 cursor-not-allowed"
      }`}
                      >
                        PRINT
                      </button>
                    </PermissionAwareTooltip>
                  </div>
                </div>

                {/* Table */}
                <div className="table-responsive overflow-x-auto">
                  <table className="w-full">
                    <thead className="text-black dark:text-white">
                      <tr>
                        {displayedColumns.map((col) => (
                          <th
                            key={col.ColumnName}
                            onClick={() => handleSort(col.ColumnName)}
                            className={`font-medium ltr:text-left rtl:text-right px-[20px] py-[11px] whitespace-nowrap cursor-pointer transition-colors ${
                              sortColumn === col.ColumnName
                                ? "bg-primary-table-bg-hover dark:bg-[#1e2a4a]"
                                : "bg-primary-table-bg dark:bg-[#15203c]"
                            }`}
                          >
                            <div className="flex items-center gap-1 group font-semibold">
                              <span className="transition-colors">
                                {col.DisplayName}
                              </span>
                              <i
                                className={`material-symbols-outlined text-sm transition-all ${
                                  sortColumn === col.ColumnName
                                    ? "text-primary-table-text dark:text-primary-button-bg-hover opacity-100"
                                    : "text-primary-table-text dark:text-gray-500 opacity-40"
                                }`}
                              >
                                {sortDirection === "ASC"
                                  ? "arrow_drop_up"
                                  : "arrow_drop_down"}
                              </i>
                            </div>
                          </th>
                        ))}
                        <th className="px-[20px] py-[11px] text-left bg-primary-table-bg dark:bg-[#15203c]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-black dark:text-white">
                      {enquiries.map((enq) => (
                        <tr key={enq.EnquiryId}>
                          {displayedColumns.map((col) => (
                            <td
                              key={`${enq.EnquiryId}_${col.ColumnName}`}
                              className="px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]"
                            >
                              {getCellValue(enq, col.ColumnName)}
                            </td>
                          ))}
                          <td className="ltr:text-left rtl:text-right whitespace-nowrap px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]">
                            <div className="flex items-center gap-[9px]">
                              {/* EDIT */}
                              <PermissionAwareTooltip
                                allowed={SmartActions.canEdit(CURRENT_FORM_ID)}
                                allowedText="Edit "
                                deniedText="You do not have permission to edit"
                              >
                                <button
                                  type="button"
                                  disabled={
                                    !SmartActions.canEdit(CURRENT_FORM_ID)
                                  }
                                  onClick={() =>
                                    navigate(
                                      `/superadmin/enquiry/edit/${enq.EnquiryId}`,
                                    )
                                  }
                                  className={`leading-none ${
                                    SmartActions.canEdit(CURRENT_FORM_ID)
                                      ? "text-gray-500 hover:text-primary-button-bg"
                                      : "text-gray-300 cursor-not-allowed"
                                  }`}
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    edit
                                  </i>
                                </button>
                              </PermissionAwareTooltip>

                              {/* PERMISSIONS */}
                              <PermissionAwareTooltip
                                allowed={SmartActions.canEdit(CURRENT_FORM_ID)}
                                allowedText="View Details"
                                deniedText="You do not have permission to manage permissions"
                              >
                                <button
                                  type="button"
                                  disabled={
                                    !SmartActions.canEdit(CURRENT_FORM_ID)
                                  }
                                  onClick={() =>
                                    navigate(
                                      `/superadmin/enquiry/details/${enq.EnquiryId}`,
                                    )
                                  }
                                  className={`leading-none ${
                                    SmartActions.canEdit(CURRENT_FORM_ID)
                                      ? "text-gray-500 hover:text-indigo-600"
                                      : "text-gray-300 cursor-not-allowed"
                                  }`}
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    settings
                                  </i>
                                </button>
                              </PermissionAwareTooltip>

                              {/* DELETE */}
                              {/* <PermissionAwareTooltip
                                allowed={SmartActions.canDelete(
                                  CURRENT_FORM_ID,
                                )}
                                allowedText="Delete "
                                deniedText="You do not have permission to delete"
                              >
                                <button
                                  type="button"
                                  disabled={
                                    !SmartActions.canDelete(CURRENT_FORM_ID)
                                  }
                                  onClick={() => {
                                    if (
                                      !SmartActions.canDelete(CURRENT_FORM_ID)
                                    )
                                      return;
                                    handleDelete(enq.EnquiryId);
                                  }}
                                  className={`leading-none ${
                                    SmartActions.canDelete(CURRENT_FORM_ID)
                                      ? "text-danger-500 hover:text-danger-700"
                                      : "text-gray-300 cursor-not-allowed"
                                  }`}
                                >
                                  <i className="material-symbols-outlined !text-md">
                                    delete
                                  </i>
                                </button>
                              </PermissionAwareTooltip> */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default EnquiryList;
