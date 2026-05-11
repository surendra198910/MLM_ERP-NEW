import React, { useState, useEffect } from "react";
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
import { useLocation } from "react-router-dom";
import Loader from "../../common/Loader";
import AccessRestricted from "../../common/AccessRestricted";
import ActionCell from "../../../../components/CommonFormElements/DataTableComponents/ActionCell";
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Swal from "sweetalert2";
import * as Yup from "yup";

// ─── Types ────────────────────────────────────────────────────────────────────
interface IncomeRecord {
    IncomeId: number;
    IncomeName: string;
    DisplayName: string;
    Status: boolean | number;
    TriggerTypeId: number | string;
    TriggerTime: string;
    IsIncludedInCapping: boolean | number;
    TriggerValueTypeId: number | string;
    WalletId: number | string;
    IncomeType: string;
    MaxLevel: number | string;
    Route: string;
}

// ─── Validation Schema ────────────────────────────────────────────────────────
const incomeSchema = Yup.object().shape({
    IncomeName: Yup.string()
        .trim()
        .required("Income Name is required")
        .max(100, "Maximum 100 characters allowed"),

    DisplayName: Yup.string()
        .trim()
        .required("Display Name is required")
        .max(200, "Maximum 200 characters allowed"),

    Route: Yup.string()
        .trim()
        .required("Route is required")
        .max(50, "Maximum 50 characters allowed"),

    TriggerType: Yup.number()
        .typeError("Trigger Type is required")
        .transform((value, originalValue) =>
            originalValue === "" ? undefined : Number(originalValue)
        )
        .required("Trigger Type is required")
        .moreThan(0, "Trigger Type is required"),

    TriggerTime: Yup.string().required("Trigger Time is required"),

    TriggerValueType: Yup.number()
        .typeError("Trigger Value Type is required")
        .transform((value, originalValue) =>
            originalValue === "" ? undefined : Number(originalValue)
        )
        .required("Trigger Value Type is required")
        .moreThan(0, "Trigger Value Type is required"),

    WalletId: Yup.number()
        .typeError("Wallet is required")
        .transform((value, originalValue) =>
            originalValue === "" ? undefined : Number(originalValue)
        )
        .required("Wallet is required")
        .moreThan(0, "Wallet is required"),

    IncomeType: Yup.string().required("Income Type is required"),

    MaxLevel: Yup.number()
        .typeError("Max Level must be a number")
        .transform((value, originalValue) =>
            originalValue === "" ? undefined : Number(originalValue)
        )
        .required("Max Level is required")
        .min(0, "Max Level cannot be negative"),
});

// ─── Component ────────────────────────────────────────────────────────────────
const Template: React.FC = () => {
    const { universalService } = ApiService();
    const location = useLocation();

    // derive formName from route
    const path = location.pathname;
    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    const isId = !isNaN(Number(last));
    const formName = isId ? segments[segments.length - 2] : last;
    const canExport = SmartActions.canExport(formName);

    // ── state ──────────────────────────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState("");
    const [filterColumn, setFilterColumn] = useState("");
    const [showTable, setShowTable] = useState(false);
    const [hasVisitedTable, setHasVisitedTable] = useState(false);
    const [searchTrigger, setSearchTrigger] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);
    const [data, setData] = useState<any[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortColumnKey, setSortColumnKey] = useState<string>("");
    const [sortDirection, setSortDirection] = useState("ASC");
    const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
    const [columnsReady, setColumnsReady] = useState(false);
    const [tableLoading, setTableLoading] = useState(true);
    const [refreshGrid, setRefreshGrid] = useState(0);
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState(true);
    const [initialSortReady, setInitialSortReady] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    // modal
    const [openROI, setOpenROI] = useState(false);
    const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
    const [processingROI, setProcessingROI] = useState(false);

    // dropdowns
    const [triggerTypes, setTriggerTypes] = useState<any[]>([]);
    const [triggerValueTypes, setTriggerValueTypes] = useState<any[]>([]);
    const [wallets, setWallets] = useState<any[]>([]);

    // ── helpers ────────────────────────────────────────────────────────────────
    const getEmployeeId = () => {
        const saved = localStorage.getItem("EmployeeDetails");
        return saved ? JSON.parse(saved).EmployeeId : 0;
    };

    // ── fetch permissions ──────────────────────────────────────────────────────
    const fetchFormPermissions = async () => {
        try {
            setPermissionsLoading(true);
            const payload = {
                procName: "AssignForm",
                Para: JSON.stringify({
                    ActionMode: "GetForms",
                    FormName: formName,
                    EmployeeId: getEmployeeId(),
                }),
            };
            const response = await universalService(payload);
            const resData = response?.data ?? response;

            if (!Array.isArray(resData)) { setHasPageAccess(false); return; }

            const pagePermission = resData.find(
                (p) => String(p.FormNameWithExt).trim().toLowerCase() === formName?.trim().toLowerCase()
            );

            if (!pagePermission || !pagePermission.Action || pagePermission.Action.trim() === "") {
                setHasPageAccess(false); return;
            }

            SmartActions.load(resData);
            setHasPageAccess(true);
        } catch {
            setHasPageAccess(false);
        } finally {
            setPermissionsLoading(false);
        }
    };

    // ── fetch dropdowns ────────────────────────────────────────────────────────
    const fetchDropdownData = async () => {
        try {
            const [ttRes, tvRes, walletRes] = await Promise.all([
                universalService({ procName: "IncomeSetting", Para: JSON.stringify({ ActionMode: "GET_ALL_TRIGGER_TYPE" }) }),
                universalService({ procName: "IncomeSetting", Para: JSON.stringify({ ActionMode: "GET_ALL_TRIGGER_VALUE_TYPE" }) }),
                universalService({ procName: "IncomeSetting", Para: JSON.stringify({ ActionMode: "GET_ALL_WALLETS" }) }),
            ]);
            setTriggerTypes(ttRes?.data ?? ttRes ?? []);
            setTriggerValueTypes(tvRes?.data ?? tvRes ?? []);
            setWallets(walletRes?.data ?? walletRes ?? []);
        } catch (error) {
            console.error("Dropdown fetch error:", error);
        }
    };

    // ── fetch grid columns ─────────────────────────────────────────────────────
    const fetchGridColumns = async () => {
        try {
            const payload = {
                procName: "GetUserGridColumns",
                Para: JSON.stringify({ UserId: getEmployeeId(), GridName: "USP_IncomeSetting" }),
            };
            const res = await universalService(payload);
            const resData = res?.data || res;

            if (Array.isArray(resData)) {
                const visibleSorted = resData
                    .filter((c: any) => c.IsVisible)
                    .sort((a: any, b: any) => a.ColumnOrder - b.ColumnOrder);

                const defaultSortCol = visibleSorted.find((c: any) => c.isSort);
                if (defaultSortCol) {
                    setSortColumnKey(defaultSortCol.ColumnKey);
                    setSortDirection((defaultSortCol.SortDir || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC");
                }

                setInitialSortReady(true);

                const reactCols = resData
                    .filter((c: any) => c.IsVisible === true)
                    .sort((a: any, b: any) => a.ColumnOrder - b.ColumnOrder)
                    .map((c: any, colIndex: number) => ({
                        id: c.ColumnOrder,
                        name: c.DisplayName,
                        sortable: true,
                        columnKey: c.ColumnKey,
                        columnIndex: c.ColumnOrder,
                        isCurrency: c.IsCurrency,
                        isTotal: c.IsTotal,
                        selector: (row: any) => row[c.ColumnKey],
                        cell: (row: any) => {
                            if (row.__isTotal) {
                                if (colIndex === 0) return "Total";
                                if (c.IsTotal) {
                                    const value = row[c.ColumnKey] || 0;
                                    return c.IsCurrency ? `$${Number(value).toLocaleString()}` : Number(value).toLocaleString();
                                }
                                return "";
                            }

                            // ── Status toggle cell ──
                            if (c.ColumnKey === "Status") {
                                const isActive = row["StatusBit"] === 1 || row["StatusBit"] === true;
                                return (
                                    <button
                                        type="button"
                                        onClick={() => handleToggleStatus(row)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
                                            ${isActive ? "bg-primary-button-bg" : "bg-gray-300"}`}
                                        title={isActive ? "Active – click to deactivate" : "Inactive – click to activate"}
                                    >
                                        <span
                                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                                                ${isActive ? "translate-x-4" : "translate-x-1"}`}
                                        />
                                    </button>
                                );
                            }

                            const value = row[c.ColumnKey];
                            if (c.IsCurrency && value != null) return `$${Number(value).toLocaleString()}`;
                            return value ?? "-";
                        },
                    }));

                const actionColumn = {
                    name: "Action",
                    cell: (row: any) => {
                        if (row.__isTotal) return null;
                        return <ActionCell row={row} onEdit={handleEdit} onDelete={handleDelete} />;
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

    // ── fetch grid data ────────────────────────────────────────────────────────
    const fetchGridData = async (options?: any) => {
        const pageToUse = options?.pageOverride ?? page;
        const perPageToUse = options?.perPageOverride ?? perPage;

        try {
            setTableLoading(true);
            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({
                    ActionMode: "GetReport",
                    SearchBy: options?.searchBy ?? filterColumn ?? "",
                    Criteria: options?.criteria ?? searchInput ?? "",
                    Page: pageToUse,
                    PageSize: perPageToUse,
                    SortIndexColumn: sortColumnKey || "",
                    SortDir: sortDirection,
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

    // ── fetch visible columns ──────────────────────────────────────────────────
    const fetchVisibleColumns = async () => {
        const payload = {
            procName: "UniversalColumnSelector",
            Para: JSON.stringify({
                EmployeeId: getEmployeeId(),
                USPName: "USP_IncomeSetting",
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
                        IsVisible: c.IsVisible === true || c.IsVisible === 1 || c.IsVisible === "1",
                        IsHidden: c.IsHidden === false || c.IsHidden === 0 || c.IsHidden === "0",
                    }))
                    .sort((a, b) => a.DisplayOrder - b.DisplayOrder)
            );
            setColumnsReady(true);
            setRefreshGrid((prev) => prev + 1);
        }
    };

    // ── CRUD handlers ──────────────────────────────────────────────────────────
    const handleEdit = async (row: any) => {
        try {
            setEditLoading(true);
            setOpenROI(true);

            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({ ActionMode: "GET", IncomeId: row.IncomeId }),
            };
            const res = await universalService(payload);
            const resData = res?.data ?? res;
            const record = Array.isArray(resData) ? resData[0] : resData;

            if (!record) { console.error("No record found"); return; }

            setEditingIncome({
                IncomeId: record.IncomeId,
                IncomeName: record.IncomeName,
                DisplayName: record.DisplayName,
                Status: record.Status,
                TriggerTypeId: record.TriggerTypeId,
                TriggerTime: record.TriggerTime,
                TriggerValueTypeId: record.TriggerValueTypeId,
                WalletId: record.WalletId,
                IncomeType: record.IncomeType,
                MaxLevel: record.MaxLevel,
                Route: record.Route || "",
                IsIncludedInCapping: record.IsIncludedInCapping,
            });
        } catch (err) {
            console.error("Edit fetch error:", err);
        } finally {
            setEditLoading(false);
        }
    };

    const handleSaveIncome = async (values: any) => {
        const editing = values.IncomeId && values.IncomeId > 0;

        const result = await Swal.fire({
            title: editing ? "Confirm Update?" : "Confirm Add?",
            text: editing
                ? "Are you sure you want to update this income setting?"
                : "Are you sure you want to add this income setting?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: editing ? "Yes, Update" : "Yes, Add",
        });

        if (!result.isConfirmed) return;

        try {
            setProcessingROI(true);

            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({
                    ActionMode: editing ? "UPDATE" : "INSERT",
                    IncomeId: values.IncomeId,
                    IncomeName: values.IncomeName,
                    DisplayName: values.DisplayName,
                    Status: values.Status ? 1 : 0,
                    TriggerTypeId: Number(values.TriggerType),
                    TriggerTime: values.TriggerTime,
                    IsIncludedInCapping: values.IsCapping ? 1 : 0,
                    Route: values.Route,
                    TriggerValueTypeId: Number(values.TriggerValueType),
                    WalletId: Number(values.WalletId),
                    IncomeType: values.IncomeType,
                    MaxLevel:
                        values.MaxLevel === "" ||
                            values.MaxLevel === null ||
                            values.MaxLevel === undefined
                            ? null
                            : Number(values.MaxLevel),
                    EntryBy: getEmployeeId(),
                }),
            };

            const response = await universalService(payload);
            const res = Array.isArray(response) ? response[0] : response;

            if (res?.StatusCode === 1) {
                Swal.fire("Success", res.Message, "success");
                setOpenROI(false);
                setEditingIncome(null);
                fetchGridData();
            } else {
                Swal.fire("Error", res?.Message || "Operation failed", "error");
            }
        } catch (error) {
            console.error("Save error:", error);
            Swal.fire("Error", "Server error", "error");
        } finally {
            setProcessingROI(false);
        }
    };

    // toggle Status (Active/Inactive) inline in grid
    const handleToggleStatus = async (row: any) => {
        const isCurrentlyActive = row.StatusBit === 1 || row.StatusBit === true;

        const result = await Swal.fire({
            title: "Change Status?",
            text: `Set "${row.IncomeName}" to ${isCurrentlyActive ? "Inactive" : "Active"}?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, Change",
        });

        if (!result.isConfirmed) return;

        try {
            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({
                    ActionMode: "TOGGLE_STATUS",
                    IncomeId: row.IncomeId,
                    EntryBy: getEmployeeId(),
                }),
            };
            const response = await universalService(payload);
            const res = Array.isArray(response) ? response[0] : response;

            if (res?.StatusCode === 1) {
                Swal.fire({ icon: "success", title: "Done!", text: res.Message, timer: 1200, showConfirmButton: false });
                fetchGridData();
            } else {
                Swal.fire("Error", res?.Message || "Failed", "error");
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error", "error");
        }
    };

    // soft delete (IsActive = 0)
    const handleDelete = async (row: any) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Delete "${row.IncomeName}"? This action cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it",
        });

        if (!result.isConfirmed) return;

        try {
            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({
                    ActionMode: "DELETE",
                    IncomeId: row.IncomeId,
                    EntryBy: getEmployeeId(),
                }),
            };
            const response = await universalService(payload);
            const res = Array.isArray(response) ? response[0] : response;

            if (res?.StatusCode === 1) {
                await Swal.fire({ icon: "success", title: "Deleted!", text: res.Message, timer: 1500, showConfirmButton: false });
                setSearchTrigger((p) => p + 1);
                fetchGridData();
            } else {
                Swal.fire("Error", res?.Message || "Delete failed", "error");
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error", "error");
        }
    };

    // ── pagination / sort ──────────────────────────────────────────────────────
    const handleSort = (column: any, direction: string) => {
        setSortColumnKey(column.columnKey);
        setSortDirection(direction.toUpperCase());
        setInitialSortReady(true);
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
        if (!SmartActions.canSearch(formName)) return;
        setShowTable(true);
        setHasVisitedTable(true);
        setPage(1);
        setSearchTrigger((p) => p + 1);
    };

    // ── export helpers ─────────────────────────────────────────────────────────
    const exportColumns = columns
        .filter((c) => c.columnKey)
        .map((c) => ({ key: c.columnKey, label: c.name }));

    const fetchExportData = async () => {
        const payload = {
            procName: "IncomeSetting",
            Para: JSON.stringify({
                ActionMode: "GetReport",
                SearchBy: filterColumn,
                Criteria: searchInput,
                Page: page,
                PageSize: 0,
                SortIndexColumn: sortColumnKey || "",
                SortDir: sortDirection,
            }),
        };
        const res = await universalService(payload);
        return res?.data ?? res ?? [];
    };

    // ── totals row ─────────────────────────────────────────────────────────────
    const pageTotals: any = {};
    columns.forEach((col: any) => {
        if (!col.isTotal || !col.columnKey) return;
        pageTotals[col.columnKey] = data.reduce((sum: number, row: any) => sum + Number(row[col.columnKey] || 0), 0);
    });

    const totalRow =
        Object.keys(pageTotals).length > 0
            ? columns.reduce((acc: any, col: any, index: number) => {
                if (!col.columnKey) { acc.__label = "Page Total"; return acc; }
                acc[col.columnKey] = col.isTotal ? pageTotals[col.columnKey] : "";
                return acc;
            }, {})
            : null;

    const hasData = data.length > 0;
    const tableData = hasData && totalRow ? [...data, { ...totalRow, __isTotal: true }] : data;

    // ── effects ────────────────────────────────────────────────────────────────
    useEffect(() => { fetchFormPermissions(); }, []);
    useEffect(() => { fetchGridColumns(); }, [refreshGrid]);
    useEffect(() => { if (openROI) fetchDropdownData(); }, [openROI]);

    useEffect(() => {
        if (!showTable || !hasVisitedTable) return;
        if (!sortColumnKey && initialSortReady) { fetchGridData(); return; }
        if (sortColumnKey) fetchGridData();
    }, [page, perPage, sortColumnKey, sortDirection, searchTrigger, initialSortReady]);

    // ── guards ─────────────────────────────────────────────────────────────────
    if (permissionsLoading) return <Loader />;
    if (!hasPageAccess) return <AccessRestricted />;

    // ── render ─────────────────────────────────────────────────────────────────
    return (
        <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">

            {/* ── Header & Search ─────────────────────────────────────────────── */}
            <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
                <div className="trezo-card-title">
                    <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
                        Manage Income Setting
                    </h5>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">

                        {/* Filter Dropdown */}
                        <div className="relative w-full sm:w-[180px]">
                            <PermissionAwareTooltip
                                allowed={SmartActions.canAdvancedSearch(formName)}
                                allowedText="Search By"
                            >
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                                    <i className="material-symbols-outlined !text-[18px]">filter_list</i>
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
                                    <option value="IncomeName">Income Name</option>
                                    <option value="DisplayName">Display Name</option>
                                    <option value="Route">Route</option>
                                    <option value="TriggerType">Trigger Type</option>
                                    <option value="WalletDisplayName">Wallet</option>
                                </select>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                                    <i className="material-symbols-outlined !text-[18px]">expand_more</i>
                                </span>
                            </PermissionAwareTooltip>
                        </div>

                        {/* Search Input */}
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

                        {/* Buttons */}
                        <div className="flex items-center gap-2">
                            <PermissionAwareTooltip allowed={SmartActions.canSearch(formName)} allowedText="Search">
                                <button
                                    type="button"
                                    onClick={applySearch}
                                    disabled={!SmartActions.canSearch(formName)}
                                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all shadow-sm disabled:opacity-50"
                                >
                                    <i className="material-symbols-outlined text-[20px]">search</i>
                                </button>
                            </PermissionAwareTooltip>

                            <PermissionAwareTooltip allowed={SmartActions.canManageColumns(formName)} allowedText="Manage Columns">
                                <div className={`h-[34px] flex items-center ${!SmartActions.canManageColumns(formName) ? "pointer-events-none opacity-50" : ""}`}>
                                    <ColumnSelector procName="USP_IncomeSetting" onApply={fetchVisibleColumns} />
                                </div>
                            </PermissionAwareTooltip>

                            <PermissionAwareTooltip allowed={SmartActions.canAdd(formName)} allowedText="Add New">
                                <button
                                    type="button"
                                    disabled={!SmartActions.canAdd(formName)}
                                    onClick={() => { setEditingIncome(null); setOpenROI(true); }}
                                    className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all shadow-sm disabled:opacity-50"
                                >
                                    <i className="material-symbols-outlined text-[20px]">add</i>
                                </button>
                            </PermissionAwareTooltip>
                        </div>

                        {(filterColumn || searchInput) && (
                            <PermissionAwareTooltip allowed={SmartActions.canSearch(formName)} allowedText="Reset filter">
                                <button
                                    type="button"
                                    disabled={!SmartActions.canSearch(formName)}
                                    onClick={() => { setFilterColumn(""); setSearchInput(""); setPage(1); setSearchTrigger((p) => p + 1); }}
                                    className={`w-[34px] h-[34px] flex items-center justify-center rounded-md
                                        ${SmartActions.canSearch(formName)
                                            ? "border border-gray-400 text-gray-600 hover:bg-gray-200"
                                            : "border border-gray-300 text-gray-300 cursor-not-allowed"
                                        }`}
                                >
                                    <i className="material-symbols-outlined text-[20px]">refresh</i>
                                </button>
                            </PermissionAwareTooltip>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Landing / Table ──────────────────────────────────────────────── */}
            {!showTable && (
                <LandingIllustration
                    title="Manage Income Setting"
                    addLabel="Add Income Setting"
                    formName={formName}
                    description={
                        <>
                            Search Income Settings using filters above.<br />
                            Manage records, export reports and analyse performance.<br />
                            <span className="font-medium">OR</span><br />
                            Click on Add button to create a new income setting.
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
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md" />
                                ))}
                            </div>
                        </div>
                    ) : hasData ? (
                        <div className="flex justify-between items-center py-2 mb-[10px]">
                            {/* Page Size */}
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
                                    <i className="material-symbols-outlined text-[18px] text-gray-500">expand_more</i>
                                </span>
                            </div>

                            {/* Export */}
                            <PermissionAwareTooltip allowed={canExport}>
                                <div className={!canExport ? "pointer-events-none opacity-50" : ""}>
                                    <ExportButtons
                                        title="IncomeSetting Report"
                                        columns={exportColumns}
                                        fetchData={fetchExportData}
                                        disabled={!canExport}
                                    />
                                </div>
                            </PermissionAwareTooltip>
                        </div>
                    ) : null}

                    <div className="trezo-card-content bg-white dark:bg-[#0f172a] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <DataTable
                            columns={columns}
                            data={tableData}
                            customStyles={customStyles}
                            pagination
                            paginationServer
                            paginationTotalRows={totalRows}
                            paginationComponent={(props) => (
                                <CustomPagination {...props} currentPage={page} rowsPerPage={perPage} />
                            )}
                            onChangePage={handlePageChange}
                            onChangeRowsPerPage={handlePerRowsChange}
                            onSort={handleSort}
                            sortServer
                            defaultSortFieldId={columns.find((col) => col.columnKey === sortColumnKey)?.id}
                            defaultSortAsc={sortDirection === "ASC"}
                            progressPending={tableLoading}
                            progressComponent={<TableSkeleton rows={perPage} columns={columns.length || 8} />}
                            conditionalRowStyles={[
                                {
                                    when: (row) => row.__isTotal,
                                    style: { fontWeight: 700, backgroundColor: "var(--color-primary-table-bg)" },
                                },
                            ]}
                            noDataComponent={!tableLoading && <OopsNoData />}
                        />
                    </div>
                </div>
            )}

            {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
            <Dialog
                open={openROI}
                onClose={() => { setOpenROI(false); setEditingIncome(null); }}
                className="relative z-60"
            >
                <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />

                <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
                        <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-[#0c1427] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[900px]">
                            <div className="trezo-card w-full p-[20px] md:p-[25px]">

                                {/* Modal Header */}
                                <div className="trezo-card-header bg-gray-50 dark:bg-[#15203c] mb-[20px] flex items-center justify-between -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px] p-[20px] md:p-[25px] rounded-t-md">
                                    <h5 className="!mb-0">
                                        {editingIncome ? "Edit Income Setting" : "Add Income Setting"}
                                    </h5>
                                    <button
                                        type="button"
                                        className="text-[23px] hover:text-primary-button-bg"
                                        onClick={() => { setOpenROI(false); setEditingIncome(null); }}
                                    >
                                        <i className="ri-close-fill"></i>
                                    </button>
                                </div>

                                {editLoading ? (
                                    <div className="flex justify-center items-center h-[200px]">
                                        <div className="theme-loader"></div>
                                    </div>
                                ) : (
                                    <Formik
                                        initialValues={{
                                            IncomeId: editingIncome?.IncomeId || 0,
                                            IncomeName: editingIncome?.IncomeName || "",
                                            DisplayName: editingIncome?.DisplayName || "",
                                            Route: editingIncome?.Route || "",
                                            TriggerType: editingIncome?.TriggerTypeId || "",
                                            TriggerTime: editingIncome?.TriggerTime || "",
                                            TriggerValueType: editingIncome?.TriggerValueTypeId || "",
                                            WalletId: editingIncome?.WalletId || "",
                                            IncomeType: editingIncome?.IncomeType || "",
                                            MaxLevel:
                                                editingIncome?.MaxLevel !== null &&
                                                    editingIncome?.MaxLevel !== undefined
                                                    ? editingIncome.MaxLevel
                                                    : "",
                                            IsCapping: editingIncome?.IsIncludedInCapping ?? true,
                                            Status: editingIncome?.Status ?? true,
                                        }}
                                        enableReinitialize
                                        validationSchema={incomeSchema}
                                        onSubmit={handleSaveIncome}
                                    >
                                        <Form className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                                {/* Income Name */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Income Name<span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="IncomeName"
                                                        placeholder="Enter System Income Name (e.g. ROI)"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-button-bg"
                                                    />
                                                    <ErrorMessage name="IncomeName" component="p" className="text-red-500 text-sm" />
                                                </div>

                                                {/* Display Name */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Display Name<span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="DisplayName"
                                                        placeholder="Enter UI Display Name"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-button-bg"
                                                    />
                                                    <ErrorMessage name="DisplayName" component="p" className="text-red-500 text-sm" />
                                                </div>

                                                {/* Route */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Route<span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="Route"
                                                        placeholder="Enter route (e.g. /income/roi)"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-button-bg"
                                                    />
                                                    <ErrorMessage name="Route" component="p" className="text-red-500 text-sm" />
                                                </div>

                                                {/* Trigger Type */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Trigger Type<span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="TriggerType"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                    >
                                                        <option value="">Select Trigger Type</option>
                                                        {triggerTypes.map((item: any) => (
                                                            <option key={item.Value} value={item.Value}>{item.Label}</option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name="TriggerType" component="p" className="text-red-500 text-sm" />
                                                </div>

                                                {/* Trigger Time */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Trigger Time<span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="TriggerTime"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                    >
                                                        <option value="">Select Trigger Time</option>
                                                        <option value="Instant">Instant</option>
                                                        <option value="Daily">Daily</option>
                                                        <option value="Weekly">Weekly</option>
                                                        <option value="Monthly">Monthly</option>
                                                    </Field>
                                                    <ErrorMessage name="TriggerTime" component="p" className="text-red-500 text-sm" />
                                                </div>

                                                {/* Trigger Value Type */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Trigger Value Type<span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="TriggerValueType"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                    >
                                                        <option value="">Select Trigger Value Type</option>
                                                        {triggerValueTypes.map((item: any) => (
                                                            <option key={item.Value} value={item.Value}>{item.Label}</option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name="TriggerValueType" component="p" className="text-red-500 text-sm" />
                                                </div>

                                                {/* Wallet */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Wallet<span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="WalletId"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                    >
                                                        <option value="">Select Wallet</option>
                                                        {wallets.map((item: any) => (
                                                            <option key={item.Value} value={item.Value}>{item.Label}</option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name="WalletId" component="p" className="text-red-500 text-sm" />
                                                </div>

                                                {/* Income Type */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Income Type<span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="IncomeType"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                    >
                                                        <option value="">Select Income Type</option>
                                                        <option value="Percentage">Percentage</option>
                                                        <option value="Fixed">Fixed</option>
                                                    </Field>
                                                    <ErrorMessage name="IncomeType" component="p" className="text-red-500 text-sm" />
                                                </div>

                                                {/* Max Level */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Max Level<span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        type="number"
                                                        name="MaxLevel"
                                                        placeholder="Enter Max Level (for level income)"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-button-bg"
                                                    />
                                                    <ErrorMessage name="MaxLevel" component="p" className="text-red-500 text-sm" />
                                                </div>

                                            </div>

                                            {/* ── Toggles row ───────────────────────────────────── */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

                                                {/* Include In Capping */}
                                                <div className="flex items-center justify-between rounded-md border border-gray-200 dark:border-[#172036] px-4 py-3">
                                                    <label className="font-medium text-black dark:text-white text-sm">
                                                        Include In Capping
                                                    </label>
                                                    <Field name="IsCapping">
                                                        {({ field }: any) => (
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.value}
                                                                    onChange={(e) =>
                                                                        field.onChange({ target: { name: field.name, value: e.target.checked } })
                                                                    }
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-button-bg transition-colors"></div>
                                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                                                            </label>
                                                        )}
                                                    </Field>
                                                </div>

                                                {/* Status */}
                                                <div className="flex items-center justify-between rounded-md border border-gray-200 dark:border-[#172036] px-4 py-3">
                                                    <label className="font-medium text-black dark:text-white text-sm">
                                                        Status (Active)
                                                    </label>
                                                    <Field name="Status">
                                                        {({ field }: any) => (
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!field.value}
                                                                    onChange={(e) =>
                                                                        field.onChange({ target: { name: field.name, value: e.target.checked } })
                                                                    }
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-button-bg transition-colors"></div>
                                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                                                            </label>
                                                        )}
                                                    </Field>
                                                </div>

                                            </div>

                                            <hr className="border-0 border-t border-gray-200 dark:border-gray-700 mt-8 -mx-8" />

                                            {/* Footer */}
                                            <div className="text-right mt-[20px]">
                                                <button
                                                    type="button"
                                                    className="mr-[15px] px-[26.5px] py-[12px] rounded-md bg-danger-500 text-white hover:bg-danger-400"
                                                    onClick={() => { setOpenROI(false); setEditingIncome(null); }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={processingROI}
                                                    className="px-[26.5px] py-[12px] rounded-md bg-primary-button-bg text-white hover:bg-primary-button-bg-hover disabled:opacity-60"
                                                >
                                                    {processingROI ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="theme-loader"></div>
                                                            <span>Processing...</span>
                                                        </div>
                                                    ) : (
                                                        editingIncome ? "Update Setting" : "Add Setting"
                                                    )}
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