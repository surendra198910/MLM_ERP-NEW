import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ApiService } from "../../../../services/ApiService";
import DataTable from "react-data-table-component";
import ColumnSelector from "../ColumnSelector/ColumnSelector";
import CustomPagination from "../../../../components/CommonFormElements/Pagination/CustomPagination";
import ExportButtons from "../../../../components/CommonFormElements/ExportButtons/ExportButtons";
import StatsCards from "../../../../components/CommonFormElements/StatsCard/StatsCardsWithoutCurrency";
import DateRangeFilter from "../../../../components/CommonFormElements/DateRangeFilter/DateRangeFilter";
import OopsNoData from "../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import TableSkeleton from "../Forms/TableSkeleton";
import customStyles from "../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import { useLocation, useNavigate } from "react-router-dom";
import Loader from "../../common/Loader";
import { Field, Form, Formik } from "formik";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import AccessRestricted from "../../common/AccessRestricted";
import ActionCell from "../../../../components/CommonFormElements/DataTableComponents/ActionCell";
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import Swal from "sweetalert2";

const Template: React.FC = () => {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState("");
    const [filterColumn, setFilterColumn] = useState("");
    const [showTable, setShowTable] = useState(false); // Toggle to show 'Oops' or 'Welcome'
    const { universalService } = ApiService();
    const [hasVisitedTable, setHasVisitedTable] = useState(false);
    const [searchTrigger, setSearchTrigger] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);
    const [data, setData] = useState([]);
    const [adminMessage, setAdminMessage] = useState("");
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
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const closeModal = () => {setOpen(false);};
    const location = useLocation();
    const path = location.pathname;
    const formName = path.split("/").pop();
    const canExport = SmartActions.canExport(formName);
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromStr = format(firstDayOfMonth, "yyyy-MM-dd");
    const toStr = format(today, "yyyy-MM-dd");
    const [dateRange, setDateRange] = useState({
        from: fromStr,
        to: toStr,
        preset: "thisMonth",
    });

    const statsConfig = [
        { key: "TotalTickets", title: "Total Tickets", icon: "support_agent", variant: "highlight" },
        { key: "OpenTickets", title: "Open Tickets", icon: "mark_email_unread", variant: "income" },
        { key: "PendingTickets", title: "Pending Tickets", icon: "schedule", variant: "warning" },
        { key: "ClosedTickets", title: "Closed Tickets", icon: "task_alt", variant: "success" },
    ];
    const sendAdminChat = async () => {

        if (!adminMessage.trim()) return;

        try {

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            const payload = {
                procName: "MemberSupportTicket",
                Para: JSON.stringify({
                    ActionMode: "InsertChat",
                    TicketId: editData.TicketId,
                    ClientId: editData.ClientId,
                    Message: adminMessage,
                    EntryBy: employeeId
                })
            };

            const res = await universalService(payload);

            if (Array.isArray(res) || res?.StatusCode === 1) {

                setAdminMessage("");

                handleEdit(editData); // reload chat

            }

        } catch (err) {
            console.error("Admin chat failed", err);
        }

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
                    GridName: "USP_MemberSupportTicket",
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
                    const index = visibleSorted.findIndex(
                        (c: any) => c.ColumnKey === defaultSortCol.ColumnKey
                    ) + 1;

                    setSortIndex("");
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
                        }
                    }))
                const actionColumn = {
                    name: "Action",
                    cell: (row: any) => {
                        if (row.__isTotal) return null;

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
    const handleEdit = async (row) => {
        setEditLoading(true);
        setOpen(true);

        try {
            const payload = {
                procName: "MemberSupportTicket",
                Para: JSON.stringify({
                    ActionMode: "GetTicketById",
                    TicketId: row.TicketId,
                }),
            };

            const res = await universalService(payload);

            console.log("API RESPONSE", res);

            const result = res?.data ?? res ?? [];
            const ticket = Array.isArray(result) ? result[0] : result;

            // ⭐ Convert ChatHistory string → array
            let chatHistory = [];

            if (ticket?.ChatHistory) {
                if (typeof ticket.ChatHistory === "string") {
                    chatHistory = JSON.parse(ticket.ChatHistory);
                } else {
                    chatHistory = ticket.ChatHistory;
                }
            }

            console.log("PARSED CHAT", chatHistory);

            setEditData({
                ...ticket,
                ChatHistory: chatHistory,
            });
        } catch (err) {
            console.error("Chat fetch failed", err);
        } finally {
            setEditLoading(false);
        }
    };
        const exportColumns = columns
        .filter(c => c.columnKey)
        .map(c => ({
            key: c.columnKey,
            label: c.name
        }));
    const fetchExportData = async () => {
        const payload = {
            procName: "MemberSupportTicket",
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
            procName: "MemberSupportTicket",
            Para: JSON.stringify({
                ActionMode: "GetStats",
            }),
        };

        const res = await universalService(payload);

        const result = res?.data ?? res ?? [];

        setStats(result[0] || {});


        return result;
    };
    const handleDelete = (row) => {
        if (confirm(`Delete ${row.UserName}?`)) {
            console.log("Delete Row:", row);

        }
    };
    const fetchGridData = async (options?: any) => {
        const range = options || dateRange;

        const pageToUse = options?.pageOverride ?? page;
        const perPageToUse = options?.perPageOverride ?? perPage;

        try {
            setTableLoading(true);

            const payload = {
                procName: "MemberSupportTicket",
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
                USPName: "USP_MemberSupportTicket",
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
    }, [
        page,
        perPage,
        sortIndex,
        sortDirection,
        searchTrigger,
        dateRange
    ]);
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

    useEffect(() => {
        const box = document.getElementById("chatBox");
        if (box) box.scrollTop = box.scrollHeight;
    }, [editData?.ChatHistory]);
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
                        Manage Support
                    </h5>
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
                                    onChange={(r) => {
                                        if (!SmartActions.canDateFilter(formName)) return; // safety

                                        setPage(1); // reset pagination
                                        setDateRange(r);
                                        setSearchTrigger((p) => p + 1);
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
                           ${SmartActions.canAdvancedSearch(formName)
                                            ? "bg-white text-black border-gray-300 focus:border-primary-button-bg"
                                            : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                        }`}
                                >
                                    <option value="">Select Filter Option</option>
                                    <option value="UserName">Username</option>
                                    <option value="Subject">Subject</option>
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
                                        procName="USP_MemberSupportTicket"
                                        onApply={fetchVisibleColumns}
                                    />
                                </div>
                            </PermissionAwareTooltip>
                            
                            <PermissionAwareTooltip
                                allowed={SmartActions.canAdd(formName)}
                                allowedText="Add New"
                            >
                                <button
                                    type="button"
                                    disabled={!SmartActions.canAdd(formName)}
                                    onClick={()=>navigate("/superadmin/support-center/createticket")}
                                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all shadow-sm disabled:opacity-50"
                                >
                                    <i className="material-symbols-outlined text-[20px]">add</i>
                                </button>
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
                    title="Manage Support"
                    formName={formName}
                    addLabel="Add Income"
                    description={
                        <>
                            Search Support Tickets using filters above.<br />
                            Manage records, export reports and analyse performance.<br />
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
                                <div className={!canExport ? "pointer-events-none opacity-50" : ""}>
                                    <ExportButtons
                                        title="Manage Support"
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
                            defaultSortFieldId={sortIndex}
                        />
                    </div>
                </div>
            )}
            {/* POPUP MODEL */}
            <Dialog open={open} onClose={closeModal} className="relative z-60">

                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-500/75 transition-opacity"
                />

                <div className="fixed inset-0 z-60 w-screen overflow-y-auto">

                    <div className="flex min-h-full items-center justify-center p-4">

                        <DialogPanel
                            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl
sm:w-full sm:max-w-[700px]"
                        >

                            <div className="trezo-card w-full bg-white dark:bg-[#0c1427] p-[25px] rounded-md">

                                {/* HEADER */}

                                <div className="trezo-card-header bg-gray-50 dark:bg-[#15203c]
flex items-center justify-between
-mx-[25px] -mt-[25px] p-[25px] rounded-t-md mb-[20px]">

                                    <h5 className="!mb-0">Support Ticket Conversation</h5>

                                    <button
                                        className="text-[22px] text-black dark:text-white"
                                        onClick={closeModal}
                                    >
                                        <i className="ri-close-fill"></i>
                                    </button>

                                </div>

                                {editLoading ? (

                                    <div className="flex items-center justify-center min-h-[200px]">
                                        <div className="theme-loader"></div>
                                    </div>

                                ) : (

                                    <Formik
                                        initialValues={{
                                            Status: editData?.Status || "Open"
                                        }}
                                        enableReinitialize
                                        onSubmit={async (values) => {

                                            const confirm = await Swal.fire({
                                                title: "Confirm Update?",
                                                icon: "question",
                                                showCancelButton: true,
                                                confirmButtonText: "Update Ticket",
                                            });

                                            if (!confirm.isConfirmed) return;

                                            const saved = localStorage.getItem("EmployeeDetails");
                                            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

                                            const payload = {
                                                procName: "MemberSupportTicket",
                                                Para: JSON.stringify({
                                                    ActionMode: "ManageTicket",
                                                    TicketId: editData.TicketId,
                                                    Status: values.Status,
                                                    EntryBy: employeeId
                                                })
                                            };

                                            await universalService(payload);

                                            closeModal();

                                            setPage(1);
                                            setSearchTrigger(p => p + 1);
                                            setRefreshGrid(p => p + 1);

                                        }}
                                    >

                                        <Form className="space-y-5">

                                            {/* USER */}

                                            <div>
                                                <label className="font-medium block mb-1">User</label>

                                                <div className="p-3 rounded-md bg-gray-50 dark:bg-[#0f172a]">
                                                    {editData?.UserName}
                                                </div>
                                            </div>

                                            {/* SUBJECT */}

                                            <div>
                                                <label className="font-medium block mb-1">Subject</label>

                                                <div className="p-3 rounded-md bg-gray-50 dark:bg-[#0f172a]">
                                                    {editData?.Subject}
                                                </div>
                                            </div>

                                            {/* CHAT THREAD */}

                                            <div
                                                id="chatBox"
                                                className="border rounded-md p-4 bg-gray-50 dark:bg-[#0f172a] max-h-[350px] overflow-y-auto space-y-4"
                                            >
                                                {(() => {
                                                    let chats = [];

                                                    if (editData?.ChatHistory) {
                                                        try {
                                                            chats =
                                                                typeof editData.ChatHistory === "string"
                                                                    ? JSON.parse(editData.ChatHistory)
                                                                    : editData.ChatHistory;
                                                        } catch (err) {
                                                            console.error("ChatHistory parse error", err);
                                                            chats = [];
                                                        }
                                                    }

                                                    if (!Array.isArray(chats) || chats.length === 0) {
                                                        return (
                                                            <div className="text-center text-gray-400 py-6">
                                                                No conversation yet.
                                                            </div>
                                                        );
                                                    }

                                                    return chats.map((chat, i) => {
                                                        const isUser = chat?.SenderType === "User";

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                                                            >
                                                                <div
                                                                    className={`px-4 py-2 rounded-lg shadow max-w-[70%]
            ${isUser
                                                                            ? "bg-white dark:bg-[#1e293b] text-black dark:text-white"
                                                                            : "bg-primary-button-bg text-white"
                                                                        }`}
                                                                >
                                                                    {/* Sender */}
                                                                    <div
                                                                        className={`text-xs mb-1 ${isUser ? "text-gray-400" : "opacity-70"
                                                                            }`}
                                                                    >
                                                                        {isUser ? editData?.UserName || "User" : "Admin"}
                                                                    </div>

                                                                    {/* Message */}
                                                                    <div className="break-words">{chat?.Message}</div>

                                                                    {/* Date */}
                                                                    <div
                                                                        className={`text-[11px] mt-1 text-right ${isUser ? "text-gray-400" : "opacity-70"
                                                                            }`}
                                                                    >
                                                                        {chat?.CreatedDate}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>

                                            {/* ADMIN REPLY BOX */}

                                            <div>

                                                <label className="font-medium block mb-1">
                                                    Reply
                                                </label>

                                                <div className="flex gap-2">

                                                    <textarea
                                                        value={adminMessage}
                                                        onChange={(e) => setAdminMessage(e.target.value)}
                                                        placeholder="Type your reply..."
                                                        className="flex-1 border rounded-md p-2 bg-white dark:bg-[#0c1427]"
                                                        rows={2}
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={sendAdminChat}
                                                        className="px-4 py-2 bg-primary-button-bg text-white rounded-md"
                                                    >
                                                        Send
                                                    </button>

                                                </div>

                                            </div>

                                            {/* STATUS */}

                                            <div>

                                                <label className="font-medium block mb-1">Status</label>

                                                <Field
                                                    as="select"
                                                    name="Status"
                                                    className="h-[45px] border rounded-md px-3 w-full
bg-white dark:bg-[#0c1427]"
                                                >

                                                    <option value="Open">Open</option>
                                                    <option value="Pending">Pending</option>
                                                    <option value="Closed">Closed</option>

                                                </Field>

                                            </div>

                                            {/* FOOTER */}

                                            <div className="flex justify-end gap-3 pt-4">

                                                <button
                                                    type="button"
                                                    onClick={closeModal}
                                                    className="px-6 py-2 rounded-md bg-gray-400 text-white"
                                                >
                                                    Close
                                                </button>

                                                <button
                                                    type="submit"
                                                    className="px-6 py-2 rounded-md bg-primary-button-bg text-white"
                                                >
                                                    Update Ticket
                                                </button>

                                            </div>

                                        </Form>

                                    </Formik>

                                )}

                            </div>

                        </DialogPanel>

                    </div>

                </div>

            </Dialog>

        </div>
    );
};

export default Template;
