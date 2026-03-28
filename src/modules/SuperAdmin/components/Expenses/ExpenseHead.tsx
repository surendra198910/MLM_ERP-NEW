import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { useLocation } from "react-router-dom";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { ErrorMessage, Field, Form, Formik } from "formik";
import Swal from "sweetalert2";
import * as Yup from "yup";

// components
import { SmartActions } from "../Security/SmartActionWithFormName";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import TableSkeleton from "../Forms/TableSkeleton";
import CustomPagination from "../../../../components/CommonFormElements/Pagination/CustomPagination";
import ExportButtons from "../../../../components/CommonFormElements/ExportButtons/ExportButtons";
import LandingIllustration from "../../../../components/CommonFormElements/LandingIllustration/LandingIllustration";
import ColumnSelector from "../ColumnSelector/ColumnSelectorV1";
import AccessRestricted from "../../common/AccessRestricted";
import Loader from "../../common/Loader";
import OopsNoData from "../../../../components/CommonFormElements/DataNotFound/OopsNoData";
import { ApiService } from "../../../../services/ApiService";
import customStyles from "../../../../components/CommonFormElements/DataTableComponents/CustomStyles";
import ActionCell from "../../../../components/CommonFormElements/DataTableComponents/ActionCell";

const ExpenseHead: React.FC = () => {
    const formSchema = Yup.object().shape({
        ExpenseHeadName: Yup.string().required("Expense head name is required"),
        ExpenditureGroupId: Yup.number().required("Expenditure group is required"),
    });

    const [searchInput, setSearchInput] = useState("");
    const [filterColumn, setFilterColumn] = useState("");
    const [showTable, setShowTable] = useState(false);
    const { universalService } = ApiService();
    const [hasVisitedTable, setHasVisitedTable] = useState(false);
    const [searchTrigger, setSearchTrigger] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);
    const [expenditureGroups, setExpenditureGroups] = useState<any[]>([]);
    const [data, setData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortColumnKey, setSortColumnKey] = useState<string>("ExpenseHeadId");
    const [editLoading, setEditLoading] = useState(false);
    const [sortDirection, setSortDirection] = useState("DESC");
    const [visibleColumns, setVisibleColumns] = useState<any[]>([]);
    const [columnsReady, setColumnsReady] = useState(false);
    const [tableLoading, setTableLoading] = useState(true);
    const [refreshGrid, setRefreshGrid] = useState(0);
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState(true);
    const [initialSortReady, setInitialSortReady] = useState(false);
    
    const location = useLocation();
    const path = location.pathname;
    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    const isId = !isNaN(Number(last));
    const formName = isId ? segments[segments.length - 2] : last;
    const canExport = SmartActions.canExport(formName);
    
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    const closeModal = () => {
        setOpen(false);
    };

    const fetchExpenditureGroups = async () => {
        try {
            const payload = {
                procName: "GetDDLData",
                Para: JSON.stringify({
                    tbl: "Master.ExpenditureGroup",
                    searchField: "ExpenditureGroupName",
                    filterCTL: "IsActive",
                    filterCTLvalue: "1",
                    filterData: "",
                }),
            };

            const response = await universalService(payload);
            const res = response?.data || response;

            if (Array.isArray(res)) {
                setExpenditureGroups(
                    res.map((g: any) => ({
                        value: g.id,
                        label: g.name,
                    }))
                );
            }
        } catch (error) {
            console.error("Expenditure Group fetch error:", error);
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

    const handleSort = (column: any, direction: string) => {
        setSortColumnKey(column.columnKey);
        setSortDirection(direction.toUpperCase());
        setInitialSortReady(true);
    };

    const handlePageChange = (p) => {
        setPage(p);
        fetchGridData({ pageOverride: p });
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
                    GridName: "USP_ExpenseHead",
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
                    setSortColumnKey(defaultSortCol.ColumnKey);
                    setSortDirection((defaultSortCol.SortDir || "DESC").toUpperCase());
                }

                setInitialSortReady(true);

                const reactCols = visibleSorted
                    .filter((c: any) => c.ColumnKey !== "ExpenseHeadId") // Hide primary key
                    .map((c: any) => ({
                        id: c.ColumnOrder,
                        name: c.DisplayName,
                        sortable: true,
                        columnKey: c.ColumnKey,
                        columnIndex: c.ColumnOrder,
                        selector: (row: any) => row[c.ColumnKey],
                        cell: (row: any) => {
                            const value = row[c.ColumnKey];
                            return value ?? "-";
                        }
                    }));

                const actionColumn = {
                    name: "Action",
                    cell: (row: any) => (
                        <ActionCell
                            row={row}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ),
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
        setIsEdit(true);

        try {
            const payload = {
                procName: "ExpenseHead",
                Para: JSON.stringify({
                    ActionMode: "Select",
                    EditId: Number(row.ExpenseHeadId),
                }),
            };

            const response = await universalService(payload);
            const data = Array.isArray(response) ? response[0] : response;

            if (data && data.ExpenseHeadId) {
                setEditData(data);
            }
        } catch (err) {
            console.error("Edit fetch failed:", err);
            Swal.fire("Error", "Failed to load record details", "error");
            setOpen(false);
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
            procName: "ExpenseHead",
            Para: JSON.stringify({
                ActionMode: "GetReport",
                SearchBy: filterColumn || "",
                Criteria: searchInput || "",
                Page: page,
                PageSize: 0, 
                SortIndexColumn: sortColumnKey || "ExpenseHeadId",
                SortDirNew: sortDirection,
            }),
        };

        const res = await universalService(payload);
        return res?.data ?? res ?? [];
    };

    const handleDelete = async (row: any) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Delete "${row.ExpenseHeadName}" ?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

        try {
            const payload = {
                procName: "ExpenseHead",
                Para: JSON.stringify({
                    ActionMode: "Delete",
                    ExpenseHeadId: row.ExpenseHeadId,
                    EntryBy: 1, 
                }),
            };

            const response = await universalService(payload);
            const res = Array.isArray(response) ? response[0] : response;

            if (res?.StatusCode === 1 || res?.StatusCode === "1" || res?.Status === 1 || res?.Status === "1") {
                await Swal.fire({
                    icon: "success",
                    title: "Deleted!",
                    text: res?.Msg || res?.msg || "Deleted successfully",
                    timer: 1500,
                    showConfirmButton: false,
                });

                setSearchTrigger(p => p + 1);
                setRefreshGrid(p => p + 1);
            } else {
                Swal.fire("Error", res?.Msg || res?.msg || "Delete failed", "error");
            }
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error", "error");
        }
    };

    const fetchGridData = async (options?: any) => {
        const pageToUse = options?.pageOverride ?? page;
        const perPageToUse = options?.perPageOverride ?? perPage;

        try {
            setTableLoading(true);

            const payload = {
                procName: "ExpenseHead",
                Para: JSON.stringify({
                    ActionMode: "GetReport",
                    SearchBy: filterColumn || "",
                    Criteria: options?.criteria ?? searchInput ?? "",
                    Page: pageToUse,
                    PageSize: perPageToUse,
                    SortIndexColumn: sortColumnKey || "ExpenseHeadId",
                    SortDirNew: sortDirection,
                }),
            };

            const res = await universalService(payload);
            const result = res?.data || res;

            if (Array.isArray(result)) {
                setData(result);
                setTotalRows(result[0]?.TotalRecords || 0);
            } else if (result?.rows && Array.isArray(result.rows)) {
                setData(result.rows);
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
                USPName: "USP_ExpenseHead",
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
                    .sort((a, b) => a.DisplayOrder - b.DisplayOrder),
            );
            setColumnsReady(true);
            setRefreshGrid((prev) => prev + 1);
        }
    };

    useEffect(() => {
        fetchGridColumns();
        fetchExpenditureGroups();
    }, [refreshGrid]);

    useEffect(() => {
        if (!showTable || !hasVisitedTable) return;

        if (!sortColumnKey && initialSortReady) {
            fetchGridData();
            return;
        }

        if (sortColumnKey) {
            fetchGridData();
        }
    }, [
        page,
        perPage,
        sortColumnKey,
        sortDirection,
        searchTrigger,
        initialSortReady
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
        if (!open) {
            const t = setTimeout(() => {
                setIsEdit(false);
                setEditData(null);
            }, 200); 
            return () => clearTimeout(t);
        }
    }, [open]);

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
                        Manage Expense Head
                    </h5>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
                        
                        {/* 1. Filter Dropdown */}
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
                                    <option value="ExpenseHeadName">Expense Head Name</option>
                                    <option value="ExpenditureGroupName">Expenditure Group Name</option>
                                </select>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                                    <i className="material-symbols-outlined !text-[18px]">
                                        expand_more
                                    </i>
                                </span>
                            </PermissionAwareTooltip>
                        </div>

                        {/* 2. Search Input */}
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

                        {/* 3. BUTTONS GROUP */}
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
                                        procName="USP_ExpenseHead"
                                        onApply={fetchVisibleColumns}
                                    />
                                </div>
                            </PermissionAwareTooltip>
                            
                            {/* ADD BUTTON */}
                            <PermissionAwareTooltip
                                allowed={SmartActions.canAdd(formName)}
                                allowedText="Add New"
                            >
                                <button
                                    type="button"
                                    disabled={!SmartActions.canAdd(formName)}
                                    onClick={() => {
                                        setOpen(true);
                                    }}
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
                    title="Manage Expense Head"
                    addLabel="Add Expense Head"
                    formName={formName}
                    description={
                        <>
                            Search expense heads using filters above.<br />
                            Manage records, export reports and analyse performance.<br />
                            <span className="font-medium">OR</span><br />
                            Click on Add button to create a new expense head.
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
                                            pageOverride: 1,
                                            perPageOverride: size,
                                        });
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

                            {/* EXPORT */}
                            <PermissionAwareTooltip allowed={canExport}>
                                <div className={!canExport ? "pointer-events-none opacity-50" : ""}>
                                    <ExportButtons
                                        title="Expense Head Report"
                                        columns={exportColumns}
                                        fetchData={fetchExportData}
                                        disabled={!canExport}
                                    />
                                </div>
                            </PermissionAwareTooltip>
                        </div>
                    ) : null}

                    {/* --- CONTENT CONTAINER --- */}
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
                            defaultSortFieldId={
                                columns.find(col => col.columnKey === sortColumnKey)?.id
                            }
                            defaultSortAsc={sortDirection === "ASC"}
                            progressPending={tableLoading}
                            progressComponent={
                                <TableSkeleton
                                    rows={perPage}
                                    columns={columns.length || 8}
                                />
                            }
                            noDataComponent={!tableLoading && <OopsNoData />}
                        />
                    </div>
                </div>
            )}

            <Dialog
                open={open}
                onClose={closeModal}
                className="relative z-60"
            >
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
                />

                <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <DialogPanel
                            transition
                            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-[550px] data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                        >
                            <div className="trezo-card w-full bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">
                                {/* Header */}
                                <div
                                    className="trezo-card-header bg-gray-50 dark:bg-[#15203c] mb-[20px] md:mb-[25px] flex items-center justify-between -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px] p-[20px] md:p-[25px] rounded-t-md"
                                >
                                    <div className="trezo-card-title">
                                        <h5 className="!mb-0">
                                            {isEdit ? "Edit Expense Head" : "Add New Expense Head"}
                                        </h5>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-[23px] transition-all leading-none text-black dark:text-white hover:text-primary-button-bg"
                                        onClick={closeModal}
                                    >
                                        <i className="ri-close-fill"></i>
                                    </button>
                                </div>

                                {/* BODY */}
                                {editLoading ? (
                                    <div className="flex items-center justify-center min-h-[280px]">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="theme-loader"></div>
                                            <p className="text-sm text-gray-500">Loading document...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <Formik
                                        initialValues={{
                                            ExpenseHeadName: editData?.ExpenseHeadName || "",
                                            ExpenditureGroupId: editData?.ExpenditureGroupId || "",
                                        }}
                                        enableReinitialize
                                        validationSchema={formSchema}
                                        onSubmit={async (values, { resetForm }) => {
                                            const confirm = await Swal.fire({
                                                title: isEdit ? "Update Expense Head?" : "Add Expense Head?",
                                                text: "Do you want to continue?",
                                                icon: "question",
                                                showCancelButton: true,
                                            });

                                            if (!confirm.isConfirmed) return;

                                            try {
                                                setSaving(true);
                                                Swal.fire({
                                                    title: "Processing...",
                                                    allowOutsideClick: false,
                                                    didOpen: () => Swal.showLoading(),
                                                });

                                                const payload = {
                                                    procName: "ExpenseHead",
                                                    Para: JSON.stringify({
                                                        ActionMode: isEdit ? "Update" : "Insert",
                                                        ExpenseHeadName: values.ExpenseHeadName,
                                                        ExpenditureGroupId: Number(values.ExpenditureGroupId),
                                                        EditId: isEdit ? Number(editData?.ExpenseHeadId) : 0,
                                                        EntryBy: 1,
                                                    }),
                                                };

                                                const response = await universalService(payload);
                                                const res = Array.isArray(response) ? response[0] : response;
                                                Swal.close();

                                                if (res?.StatusCode === 1 || res?.StatusCode === "1" || res?.Status === 1 || res?.Status === "1") {
                                                    await Swal.fire({
                                                        icon: "success",
                                                        title: isEdit ? "Updated!" : "Added!",
                                                        text: res?.Msg || res?.msg || "Saved successfully",
                                                        timer: 1500,
                                                        showConfirmButton: false,
                                                    });

                                                    resetForm();
                                                    closeModal();
                                                    setPage(1);
                                                    setSearchTrigger(p => p + 1);
                                                    setRefreshGrid(p => p + 1);
                                                } else {
                                                    Swal.fire("Error", res?.Msg || res?.msg || "Operation failed", "error");
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                Swal.fire("Error", "Server error", "error");
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                    >
                                        {() => (
                                            <Form className="space-y-5">
                                                
                                                {/* Select Expenditure Group */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Expenditure Group:
                                                        <span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="ExpenditureGroupId"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                    >
                                                        <option value="">Select Expenditure Group</option>
                                                        {expenditureGroups.map((g) => (
                                                            <option key={g.value} value={g.value}>
                                                                {g.label}
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage
                                                        name="ExpenditureGroupId"
                                                        component="p"
                                                        className="text-red-500 text-sm"
                                                    />
                                                </div>

                                                {/* Input Expense Head */}
                                                <div>
                                                    <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                        Expense Head Name:
                                                        <span className="text-red-500">*</span>
                                                    </label>
                                                    <Field
                                                        type="text"
                                                        name="ExpenseHeadName"
                                                        placeholder="Enter Expense Head Name"
                                                        className="h-[55px] rounded-md text-black dark:text-white border border-gray-200 dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-primary-button-bg"
                                                    />
                                                    <ErrorMessage
                                                        name="ExpenseHeadName"
                                                        component="p"
                                                        className="text-red-500 text-sm"
                                                    />
                                                </div>

                                                <hr className="border-0 border-t border-gray-200 dark:border-gray-700 my-4 mt-10 md:-mx-[25px] px-[20px] md:px-[25px]" />

                                                <div className="text-right mt-[20px]">
                                                    <button
                                                        type="button"
                                                        className="mr-[15px] px-[26.5px] py-[12px] rounded-md bg-danger-500 text-white hover:bg-danger-400"
                                                        onClick={closeModal}
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        type="submit"
                                                        disabled={saving}
                                                        className="px-[26.5px] py-[12px] rounded-md bg-primary-button-bg text-white hover:bg-primary-button-bg-hover"
                                                    >
                                                        {saving ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="theme-loader"></div>
                                                                <span>Processing...</span>
                                                            </div>
                                                        ) : isEdit ? (
                                                            "Update Expense Head"
                                                        ) : (
                                                            "Add Expense Head"
                                                        )}
                                                    </button>
                                                </div>
                                            </Form>
                                        )}
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

export default ExpenseHead;