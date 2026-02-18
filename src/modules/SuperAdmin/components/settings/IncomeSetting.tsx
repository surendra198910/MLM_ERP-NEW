import React, { useEffect, useState } from "react";
import { ApiService } from "../../../../services/ApiService";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TableSkeleton from "../Forms/TableSkeleton";
import { SmartActions } from "../Security/SmartAction";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import Pagination from "../../common/Pagination";
import AccessRestricted from "../../common/AccessRestricted";
import Loader from "../../common/Loader";
import { useCurrency } from "../../context/CurrencyContext";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";

type IncomeRecord = {
    IncomeId: number;
    IncomeName: string;
    DisplayName: string;
    Status: boolean;

    TriggerType?: string;
    TriggerTypeId?: number;

    TriggerTime: string;

    IsIncludedInCapping: boolean;

    TriggerValueType?: string;
    TriggerValueTypeId?: number;

    WalletDisplayName?: string;
    WalletId?: number;

    IncomeType: string;
    MaxLevel: number;
    CreatedDate: string;
};



const ToDoList: React.FC = () => {
    const { currency } = useCurrency();
    const CURRENT_FORM_ID = 5116;
    const { universalService } = ApiService();
    const [records, setRecords] = useState<IncomeRecord[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [tableLoading, setTableLoading] = useState(false);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [hasPageAccess, setHasPageAccess] = useState(true);
    const [sortColumn, setSortColumn] = useState<string>("IncomeId");
    const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
    const [openROI, setOpenROI] = useState(false);
    const [processingROI, setProcessingROI] = useState(false);
    const [triggerTypes, setTriggerTypes] = useState<any[]>([]);
    const [triggerValueTypes, setTriggerValueTypes] = useState<any[]>([]);
    const [wallets, setWallets] = useState<any[]>([]);
    const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);





    const totalPages =
        totalCount > 0 && itemsPerPage > 0
            ? Math.ceil(totalCount / itemsPerPage)
            : 1;
    const incomeSchema = Yup.object().shape({
        IncomeName: Yup.string()
            .trim()
            .required("Income Name is required")
            .max(100, "Maximum 100 characters allowed"),

        DisplayName: Yup.string()
            .trim()
            .required("Display Name is required")
            .max(200, "Maximum 200 characters allowed"),

        TriggerType: Yup.number()
            .typeError("Trigger Type is required")
            .transform((value, originalValue) =>
                originalValue === "" ? undefined : Number(originalValue)
            )
            .required("Trigger Type is required")
            .moreThan(0, "Trigger Type is required"),

        TriggerTime: Yup.string()
            .required("Trigger Time is required"),

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

        IncomeType: Yup.string()
            .required("Income Type is required"),

        MaxLevel: Yup.number()
            .typeError("Max Level must be a number")
            .transform((value, originalValue) =>
                originalValue === "" ? undefined : Number(originalValue)
            )
            .required("Max Level is required")
            .min(1, "Max Level must be at least 1"),

    });




    const fetchDocumentPermissions = async () => {
        try {
            setPermissionsLoading(true);

            const saved = localStorage.getItem("EmployeeDetails");
            const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;

            const payload = {
                procName: "AssignForm",
                Para: JSON.stringify({
                    ActionMode: "Forms",
                    FormCategoryId: 3074, // ✅ correct category
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
                (p: any) => Number(p.FormId) === CURRENT_FORM_ID
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
            console.error("Permission fetch failed:", error);
            setHasPageAccess(false);
        } finally {
            setPermissionsLoading(false);
        }
    };
    const handleEdit = async (incomeId: number) => {
        try {
            setProcessingROI(true);

            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({
                    ActionMode: "GET",
                    IncomeId: incomeId,
                }),
            };

            const response = await universalService(payload);
            const data = Array.isArray(response) ? response[0] : response?.[0];

            if (!data) {
                Swal.fire("Error", "Record not found", "error");
                return;
            }

            setEditingIncome({
                IncomeId: data.IncomeId,
                IncomeName: data.IncomeName,
                DisplayName: data.DisplayName,
                Status: data.Status,
                TriggerTypeId: data.TriggerTypeId,
                TriggerTime: data.TriggerTime,
                IsIncludedInCapping: data.IsIncludedInCapping,
                TriggerValueTypeId: data.TriggerValueTypeId,
                WalletId: data.WalletId,
                IncomeType: data.IncomeType,
                MaxLevel: data.MaxLevel || 0,
                CreatedDate: data.CreatedDate,
            });

            setOpenROI(true);

        } catch (error) {
            console.error("Edit fetch error:", error);
            Swal.fire("Error", "Failed to fetch record", "error");
        } finally {
            setProcessingROI(false);
        }
    };

    const fetchIncomeList = async () => {
        try {
            setTableLoading(true);

            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({
                    ActionMode: "GET_ALL",
                }),
            };

            const response = await universalService(payload);
            const data = response?.data ?? response;

            setRecords(Array.isArray(data) ? data : []);
            setTotalCount(Array.isArray(data) ? data.length : 0);

        } catch (error) {
            console.error("Income list fetch error:", error);
            setRecords([]);
        } finally {
            setTableLoading(false);
        }
    };
    const fetchDropdownData = async () => {
        try {
            const [ttRes, tvRes, walletRes] = await Promise.all([
                universalService({
                    procName: "IncomeSetting",
                    Para: JSON.stringify({ ActionMode: "GET_ALL_TRIGGER_TYPE" }),
                }),
                universalService({
                    procName: "IncomeSetting",
                    Para: JSON.stringify({ ActionMode: "GET_ALL_TRIGGER_VALUE_TYPE" }),
                }),
                universalService({
                    procName: "IncomeSetting",
                    Para: JSON.stringify({ ActionMode: "GET_ALL_WALLETS" }),
                }),
            ]);

            setTriggerTypes(ttRes?.data ?? ttRes ?? []);
            setTriggerValueTypes(tvRes?.data ?? tvRes ?? []);
            setWallets(walletRes?.data ?? walletRes ?? []);

        } catch (error) {
            console.error("Dropdown fetch error:", error);
        }
    };

    const sortedRecords = [...records].sort((a: any, b: any) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA < valB) return sortDirection === "ASC" ? -1 : 1;
        if (valA > valB) return sortDirection === "ASC" ? 1 : -1;
        return 0;
    });

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "ASC" ? "DESC" : "ASC");
        } else {
            setSortColumn(column);
            setSortDirection("ASC");
        }
    };

    const fetchExportData = async (): Promise<IncomeRecord[]> => {
        try {
            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({
                    ActionMode: "GET_ALL",
                }),
            };

            const response = await universalService(payload);
            const data = response?.data ?? response;

            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error("Export fetch error:", err);
            return [];
        }
    };


    const exportCSV = async () => {
        const data = await fetchExportData();
        if (!data.length) return;

        const header = ROI_COLUMNS.map(col => col.label).join(",");

        const rows = data.map(row =>
            ROI_COLUMNS
                .map(col => `"${row[col.key as keyof ROIRecord] ?? "-"}"`)
                .join(",")
        );

        const csvContent = [header, ...rows].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "process-roi-income.csv";
        a.click();
    };


    const exportExcel = async () => {
        const data = await fetchExportData();
        if (!data.length) return;

        const rows = data.map(row => {
            const obj: any = {};
            ROI_COLUMNS.forEach(col => {
                obj[col.label] = row[col.key as keyof ROIRecord] ?? "-";
            });
            return obj;
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "ROI Income");
        XLSX.writeFile(workbook, "process-roi-income.xlsx");
    };

    const exportPDF = async () => {
        try {
            const data = await fetchExportData();

            console.log("PDF Data:", data); // 👈 DEBUG

            if (!data || data.length === 0) {
                alert("No data available for export");
                return;
            }

            const doc = new jsPDF();

            const tableColumn = ROI_COLUMNS.map(col => col.label);

            const tableRows = data.map(row =>
                ROI_COLUMNS.map(col => row[col.key as keyof ROIRecord] ?? "-")
            );

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [25, 118, 210] },
            });

            doc.save("process-roi-income.pdf");

            console.log("PDF Download Triggered");

        } catch (error) {
            console.error("PDF Export Error:", error);
        }
    };

    const handlePrint = async () => {
        const data = await fetchExportData();
        if (!data.length) return;

        const printWindow = window.open("", "_blank", "width=1200,height=800");
        if (!printWindow) return;

        const tableHeaders = ROI_COLUMNS
            .map(col => `<th>${col.label}</th>`)
            .join("");

        const tableRows = data
            .map(row => `
            <tr>
                ${ROI_COLUMNS
                    .map(col => `<td>${row[col.key as keyof ROIRecord] ?? "-"}</td>`)
                    .join("")}
            </tr>
        `)
            .join("");

        printWindow.document.write(`
        <html>
        <head>
            <title>Process ROI Income</title>
            <style>
                body { font-family: Arial; padding: 20px; }
                h2 { text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td {
                    border: 1px solid #ccc;
                    padding: 8px;
                    font-size: 12px;
                    text-align: left;
                }
                th { background: #f3f4f6; }
            </style>
        </head>
        <body>
            <h2>Process ROI Income</h2>
            <table>
                <thead>
                    <tr>${tableHeaders}</tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <script>
                window.onload = function () { window.print(); }
            </script>
        </body>
        </html>
    `);

        printWindow.document.close();
    };



    const ROI_COLUMNS = [
        { key: "IncomeName", label: "Income Name" },
        { key: "DisplayName", label: "Display Name" },
        { key: "TriggerType", label: "Trigger Type" },
        { key: "TriggerTime", label: "Trigger Time" },
        { key: "TriggerValueType", label: "Trigger Value Type" },
        { key: "WalletDisplayName", label: "Wallet" },
        { key: "IncomeType", label: "Income Type" },
        { key: "MaxLevel", label: "Max Level" },
        { key: "IsIncludedInCapping", label: "Capping" },
        { key: "Action", label: "Action" },

    ];

    const handleSaveIncome = async (values: any) => {
        const isEdit = values.IncomeId && values.IncomeId > 0;

        const result = await Swal.fire({
            title: isEdit ? "Confirm Update?" : "Confirm Add?",
            text: isEdit
                ? "Are you sure you want to update this income setting?"
                : "Are you sure you want to add this income setting?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: isEdit ? "Yes, Update" : "Yes, Add",
        });

        if (!result.isConfirmed) return;

        try {
            setProcessingROI(true);

            const payload = {
                procName: "IncomeSetting",
                Para: JSON.stringify({
                    ActionMode: isEdit ? "UPDATE" : "INSERT",
                    IncomeId: values.IncomeId,
                    IncomeName: values.IncomeName,
                    DisplayName: values.DisplayName,
                    Status: 1,
                    TriggerTypeId: Number(values.TriggerType),
                    TriggerTime: values.TriggerTime,
                    IsIncludedInCapping: values.IsCapping ? 1 : 0,
                    TriggerValueTypeId: Number(values.TriggerValueType),
                    WalletId: Number(values.WalletId),
                    IncomeType: values.IncomeType,
                    MaxLevel: values.MaxLevel ? Number(values.MaxLevel) : null,
                    EntryBy: 1,
                }),
            };

            const response = await universalService(payload);
            const res = Array.isArray(response) ? response[0] : response;

            if (res?.StatusCode === 1) {
                Swal.fire(
                    "Success",
                    res.Message,
                    "success"
                );
                fetchIncomeList();
                setOpenROI(false);
                setEditingIncome(null);
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




    useEffect(() => {
        fetchDocumentPermissions();
    }, []);


    useEffect(() => {
        if (!permissionsLoading && hasPageAccess) {
            fetchIncomeList();
            fetchDropdownData();

        }
    }, [currentPage, itemsPerPage, permissionsLoading, hasPageAccess]);


    if (permissionsLoading) {
        return <Loader />;
    }

    if (!hasPageAccess) {
        return <AccessRestricted />;
    }


    return (
        <>
            <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
                <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
                    <div className="trezo-card-title">
                        <h5 className="!mb-0">
                            Manage Income Setting
                        </h5>

                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
                        {/* RIGHT GROUP: Filters + Search + Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">

                            {/* BUTTONS */}
                            <div className="flex items-center gap-2">

                                {/* ADD BUTTON */}
                                <div className="relative group">
                                    <PermissionAwareTooltip
                                        allowed={SmartActions.canAdd(CURRENT_FORM_ID)}
                                        allowedText="Add New Income Setting"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOpenROI(true)}
                                            disabled={!SmartActions.canAdd(CURRENT_FORM_ID)}
                                            className="px-4 h-[35px] flex items-center justify-center rounded-md border border-white text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all disabled:opacity-50"
                                        >
                                            Add New Setting
                                        </button>

                                    </PermissionAwareTooltip>
                                </div>



                            </div>
                        </div>
                    </div>
                </div>

                <div className="trezo-card-content -mx-[20px] md:-mx-[25px]">
                    {tableLoading ? (
                        <div className="table-responsive overflow-x-auto">
                            <TableSkeleton
                                rows={itemsPerPage > 10 ? 10 : itemsPerPage}
                                columns={ROI_COLUMNS.length}
                            />

                        </div>
                    ) : records.length === 0 ? (

                        <div className="flex flex-col md:flex-row items-center justify-center p-10 gap-10 min-h-[300px] animate-in fade-in zoom-in duration-300">
                            <div className="text-center md:text-left max-w-md">
                                <h3 className="text-xl font-bold text-purple-600 mb-1">
                                    Oops!
                                </h3>
                                <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">
                                    No Records Found!
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    Please adjust the data filter and search again.
                                </p>
                            </div>
                            {/* Placeholder Illustration */}
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
                                        className="stroke-primary-button-bg-hover"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <>
                            {" "}
                            {/* EXPORT BUTTON BAR */}
                            <div className="flex justify-between items-center px-7 py-2 mb-2">
                                {/* PAGE SIZE SELECT */}
                                <div className="relative group">
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);

                                        }}
                                        className="
        h-8 w-[120px] px-3 pr-7
        text-xs font-semibold
        text-gray-600 dark:text-gray-300
        bg-transparent
        border border-gray-300 dark:border-gray-600
        rounded-md
        cursor-pointer
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-all
        appearance-none
      "
                                    >
                                        <option value="10">10 / page</option>
                                        <option value="25">25 / page</option>
                                        <option value="50">50 / page</option>
                                        <option value="100">100 / page</option>
                                    </select>

                                    {/* DROPDOWN ICON */}
                                    <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                        <i className="material-symbols-outlined text-[18px] text-gray-500">
                                            expand_more
                                        </i>
                                    </span>

                                    {/* TOOLTIP */}
                                    <div
                                        className="
        absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100
        transition-opacity whitespace-nowrap
      "
                                    >
                                        Items per page
                                        <div
                                            className="
          absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black
        "
                                        />
                                    </div>
                                </div>

                                {/* EXPORT BUTTONS */}
                                <div className="flex items-center gap-2 leading-none">
                                    {/* PDF */}
                                    <div className="relative group">
                                        {/* <PermissionAwareTooltip
                                            allowed={SmartActions.canSearch(CURRENT_FORM_ID)}
                                            deniedText="Export permission required"
                                        > */}
                                        <button
                                            type="button"
                                            onClick={exportPDF}
                                            className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-button-bg
          border border-primary-button-bg
          rounded-md
          hover:bg-primary-button-bg hover:text-white
          transition-all
          dark:hover:bg-gray-800 dark:hover:border-gray-600
        "
                                        >
                                            PDF
                                        </button>
                                        {/* </PermissionAwareTooltip> */}

                                        <div
                                            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                        >
                                            Export PDF
                                            <div
                                                className="absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black"
                                            />
                                        </div>
                                    </div>

                                    {/* EXCEL */}
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            onClick={exportExcel}
                                            className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-button-bg
          border border-primary-button-bg
          rounded-md
          hover:bg-primary-button-bg hover:text-white
          transition-all
          dark:hover:bg-gray-800 dark:hover:border-gray-600
        "
                                        >
                                            Excel
                                        </button>

                                        <div
                                            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                        >
                                            Export Excel
                                            <div
                                                className="absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black"
                                            />
                                        </div>
                                    </div>

                                    {/* CSV */}
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            onClick={exportCSV}
                                            className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-button-bg
          border border-primary-button-bg
          rounded-md
          hover:bg-primary-button-bg hover:text-white
          transition-all
          dark:hover:bg-gray-800 dark:hover:border-gray-600
        "
                                        >
                                            CSV
                                        </button>

                                        <div
                                            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                        >
                                            Export CSV
                                            <div
                                                className="absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black"
                                            />
                                        </div>
                                    </div>

                                    {/* Print */}
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            onClick={handlePrint}
                                            className="
          h-8 px-3
          inline-flex items-center justify-center
          text-xs font-semibold uppercase
          text-primary-button-bg
          border border-primary-button-bg
          rounded-md
          hover:bg-primary-button-bg hover:text-white
          transition-all
          dark:hover:bg-gray-800 dark:hover:border-gray-600
        "
                                        >
                                            Print
                                        </button>

                                        <div
                                            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                        >
                                            Print
                                            <div
                                                className="absolute top-full left-1/2 -translate-x-1/2
          border-4 border-transparent border-t-black"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="table-responsive overflow-x-auto">
                                <table className="w-full">
                                    <thead className="text-primary-table-text dark:text-white">
                                        <tr>
                                            {ROI_COLUMNS.map((col) => (
                                                <th
                                                    key={col.key}
                                                    onClick={() => handleSort(col.key)}
                                                    className={`
                        font-medium ltr:text-left rtl:text-right px-[20px] py-[11px]
                        whitespace-nowrap cursor-pointer transition-colors
                        ${sortColumn === col.key
                                                            ? "bg-primary-table-bg-hover dark:bg-[#1e2a4a]"
                                                            : "bg-primary-table-bg dark:bg-[#15203c]"
                                                        }
                    `}
                                                >
                                                    <div className="flex items-center gap-1 font-semibold">
                                                        <span>{col.label}</span>

                                                        <i
                                                            className={`
                                material-symbols-outlined text-sm transition-all
                                ${sortColumn === col.key
                                                                    ? "text-gray-400 dark:text-primary-button-bg-hover opacity-100"
                                                                    : "text-gray-400 dark:text-gray-500 opacity-40"
                                                                }
                            `}
                                                        >
                                                            {sortDirection === "ASC"
                                                                ? "arrow_drop_up"
                                                                : "arrow_drop_down"}
                                                        </i>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody className="text-black dark:text-white">
                                        {sortedRecords.map((row) => (
                                            <tr
                                                key={row.IncomeId}
                                                className="hover:bg-gray-50 dark:hover:bg-[#1c2846] transition-all"
                                            >
                                                {ROI_COLUMNS.map((col) => {
                                                    const value = row[col.key as keyof IncomeRecord];

                                                    return (
                                                        <td
                                                            key={col.key}
                                                            className="px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]"
                                                        >
                                                            {col.key === "IsIncludedInCapping" ? (
                                                                <span

                                                                >
                                                                    {value ? "Yes" : "No"}
                                                                </span>
                                                            ) : col.key === "Status" ? (
                                                                <span
                                                                    className={`px-2 py-1 text-xs rounded ${value
                                                                        ? "bg-green-100 text-green-600"
                                                                        : "bg-gray-200 text-gray-600"
                                                                        }`}
                                                                >
                                                                    {value ? "Active" : "Disabled"}
                                                                </span>
                                                            ) : col.key === "Action" ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEdit(row.IncomeId)}

                                                                >
                                                                    <i className="material-symbols-outlined !text-md">
                                                                        edit
                                                                    </i>
                                                                </button>
                                                            ) : (
                                                                value ?? "-"
                                                            )}
                                                        </td>
                                                    );
                                                })}
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

            </div>
            <Dialog
                open={openROI}
                onClose={() => {
                    setOpenROI(false);
                    setEditingIncome(null);
                }}

                className="relative z-60"
            >
                <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />

                <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
                        <DialogPanel
                            className="relative transform overflow-hidden rounded-lg 
  bg-white dark:bg-[#0c1427]
  text-left shadow-xl transition-all 
  sm:my-8 sm:w-full sm:max-w-[900px]"
                        >

                            <div className="trezo-card w-full p-[20px] md:p-[25px]">

                                {/* Header */}
                                <div className="trezo-card-header bg-gray-50 dark:bg-[#15203c]
                        mb-[20px] flex items-center justify-between
                        -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px]
                        p-[20px] md:p-[25px] rounded-t-md"
                                >
                                    <h5 className="!mb-0">{editingIncome ? "Edit Income Setting" : "Add Income Setting"}</h5>

                                    <button
                                        type="button"
                                        className="text-[23px] hover:text-primary-button-bg"
                                        onClick={() => {
                                            setOpenROI(false);
                                            setEditingIncome(null);
                                        }}
                                    >
                                        <i className="ri-close-fill"></i>
                                    </button>
                                </div>

                                <Formik
                                    initialValues={{
                                        IncomeId: editingIncome?.IncomeId || 0,
                                        IncomeName: editingIncome?.IncomeName || "",
                                        DisplayName: editingIncome?.DisplayName || "",
                                        TriggerType: editingIncome?.TriggerTypeId || "",
                                        TriggerTime: editingIncome?.TriggerTime || "",
                                        TriggerValueType: editingIncome?.TriggerValueTypeId || "",
                                        WalletId: editingIncome?.WalletId || "",
                                        IncomeType: editingIncome?.IncomeType || "",
                                        MaxLevel: editingIncome?.MaxLevel || "",
                                        IsCapping: editingIncome?.IsIncludedInCapping ?? true,
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
                                                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
        dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0
        transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400
        focus:border-primary-button-bg"
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
                                                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
        dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0
        transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400
        focus:border-primary-button-bg"
                                                />
                                                <ErrorMessage name="DisplayName" component="p" className="text-red-500 text-sm" />
                                            </div>

                                            {/* Trigger Type */}
                                            <div>
                                                <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                    Trigger Type<span className="text-red-500">*</span>
                                                </label>
                                                <Field
                                                    as="select"
                                                    name="TriggerType"
                                                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
    dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full
    outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                >
                                                    <option value="">Select Trigger Type</option>

                                                    {triggerTypes.map((item: any) => (
                                                        <option key={item.Value} value={item.Value}>
                                                            {item.Label}
                                                        </option>
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
                                                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
        dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full
        outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                >
                                                    <option value="">Select Trigger Time</option>
                                                    <option value="Instant">Instant</option>
                                                    <option value="Daily">Daily</option>
                                                    <option value="Weekly">Weekly</option>
                                                    <option value="Monthly">Monthly</option>
                                                </Field>
                                                <ErrorMessage
                                                    name="TriggerTime"
                                                    component="p"
                                                    className="text-red-500 text-sm"
                                                />
                                            </div>

                                            {/* Trigger Value Type */}
                                            <div>
                                                <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                    Trigger Value Type<span className="text-red-500">*</span>
                                                </label>
                                                <Field
                                                    as="select"
                                                    name="TriggerValueType"
                                                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
    dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full
    outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                >
                                                    <option value="">Select Trigger Value Type</option>

                                                    {triggerValueTypes.map((item: any) => (
                                                        <option key={item.Value} value={item.Value}>
                                                            {item.Label}
                                                        </option>
                                                    ))}
                                                </Field>

                                                <ErrorMessage name="TriggerValueType" component="p" className="text-red-500 text-sm" />
                                            </div>

                                            {/* Wallet Id */}
                                            <div>
                                                <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                    Wallet<span className="text-red-500">*</span>
                                                </label>
                                                <Field
                                                    as="select"
                                                    name="WalletId"
                                                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
    dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full
    outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                >
                                                    <option value="">Select Wallet</option>

                                                    {wallets.map((item: any) => (
                                                        <option key={item.Value} value={item.Value}>
                                                            {item.Label}
                                                        </option>
                                                    ))}
                                                </Field>

                                                <ErrorMessage
                                                    name="WalletId"
                                                    component="p"
                                                    className="text-red-500 text-sm"
                                                />

                                            </div>

                                            {/* Income Type */}
                                            <div>
                                                <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                    Income Type<span className="text-red-500">*</span>
                                                </label>
                                                <Field
                                                    as="select"
                                                    name="IncomeType"
                                                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
        dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[14px] block w-full
        outline-0 cursor-pointer transition-all focus:border-primary-button-bg"
                                                >
                                                    <option value="">Select Income Type</option>
                                                    <option value="Percentage">Percentage</option>
                                                    <option value="Fixed">Fixed</option>
                                                </Field>
                                                <ErrorMessage
                                                    name="IncomeType"
                                                    component="p"
                                                    className="text-red-500 text-sm"
                                                />
                                            </div>

                                            {/* Max Level */}
                                            <div>
                                                <label className="mb-[10px] text-black dark:text-white font-medium block">
                                                    Max Level
                                                </label>
                                                <Field
                                                    type="number"
                                                    name="MaxLevel"
                                                    placeholder="Enter Max Level (for level income)"
                                                    className="h-[55px] rounded-md text-black dark:text-white border border-gray-200
        dark:border-[#172036] bg-white dark:bg-[#0c1427] px-[17px] block w-full outline-0
        transition-all placeholder:text-gray-500 dark:placeholder:text-gray-400
        focus:border-primary-button-bg"
                                                />
                                                <ErrorMessage
                                                    name="MaxLevel"
                                                    component="p"
                                                    className="text-red-500 text-sm"
                                                />
                                            </div>

                                        </div>

                                        {/* Toggle Section */}
                                        <div className="flex items-center justify-between mt-4 pr-195">
                                            <label className="font-medium text-black dark:text-white">
                                                Include In Capping
                                            </label>

                                            <Field name="IsCapping">
                                                {({ field }) => (
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.value}
                                                            onChange={(e) =>
                                                                field.onChange({
                                                                    target: {
                                                                        name: field.name,
                                                                        value: e.target.checked,
                                                                    },
                                                                })
                                                            }
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-primary-button-bg"></div>
                                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                                                    </label>
                                                )}
                                            </Field>
                                        </div>

                                        <hr className="border-0 border-t border-gray-200 dark:border-gray-700 mt-8 -mx-8" />

                                        {/* Footer */}
                                        <div className="text-right mt-[20px]">
                                            <button
                                                type="button"
                                                className="mr-[15px] px-[26.5px] py-[12px] rounded-md bg-danger-500 text-white hover:bg-danger-400"
                                                onClick={() => {
                                                    setOpenROI(false);
                                                    setEditingIncome(null);
                                                }}

                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={processingROI}
                                                className="px-[26.5px] py-[12px] rounded-md bg-primary-button-bg text-white hover:bg-primary-button-bg-hover"
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

                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>

        </>
    );
};

export default ToDoList;
