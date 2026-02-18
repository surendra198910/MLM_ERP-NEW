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

type ROIRecord = {
    SrNo: number;
    Name: string;
    UserName: string;
    ProductName: string;
    Amount: number;
    ROIPercentage: number;
    Income: number;
    TotalIncome: number;
};

const ToDoList: React.FC = () => {
    const { currency } = useCurrency();
    const CURRENT_FORM_ID = 5116;
    const { universalService } = ApiService();
    const [records, setRecords] = useState<ROIRecord[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [tableLoading, setTableLoading] = useState(false);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [hasPageAccess, setHasPageAccess] = useState(true);
    const [sortColumn, setSortColumn] = useState<string>("SrNo");
    const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
    const [openROI, setOpenROI] = useState(false);
    const [processingROI, setProcessingROI] = useState(false);
    const todayDate = new Date().toISOString().split("T")[0];

    const roiSchema = Yup.object().shape({
        Date: Yup.string().required("Date is required"),
    });


    const totalPages =
        totalCount > 0 && itemsPerPage > 0
            ? Math.ceil(totalCount / itemsPerPage)
            : 1;
    const formatToDDMMMYYYY = (dateString: string) => {
        if (!dateString) return "";

        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = date.toLocaleString("default", { month: "short" });
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };
   
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

    const fetchROIIncome = async () => {
        try {
            setTableLoading(true);

            const payload = {
                procName: "ProcessROIIncome",
                Para: JSON.stringify({
                    ActionMode: "PreviewIncome",
                    PageNumber: currentPage,
                    PageSize: itemsPerPage,
                }),
            };

            const response = await universalService(payload);

            // 👇 YOUR RESPONSE IS ARRAY
            const apiRes = Array.isArray(response) ? response[0] : response?.data?.[0];

            if (!apiRes?.ROIResultJson) {
                setRecords([]);
                setTotalCount(0);
                setTotalIncome(0);
                return;
            }

            // 1️⃣ Parse outer JSON
            const parsed = JSON.parse(apiRes.ROIResultJson);

            setTotalIncome(Number(parsed.TotalIncome) || 0);
            setTotalCount(Number(parsed.TotalRecords) || 0);

            // 2️⃣ Parse inner Data array
            const data = parsed.Data ? parsed.Data : [];

            setRecords(data);

        } catch (error) {
            console.error("ROI fetch error:", error);
            setRecords([]);
        } finally {
            setTableLoading(false);
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

    const fetchExportData = async (): Promise<ROIRecord[]> => {
        try {
            const payload = {
                procName: "ProcessROIIncome",
                Para: JSON.stringify({
                    ActionMode: "ExportIncome",
                }),
            };

            const response = await universalService(payload);

            const apiRes = response?.data ?? response;

            return Array.isArray(apiRes) ? apiRes : [];

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

    const formatCurrency = (value: number) => {
        if (value === null || value === undefined) return "-";

        return `${currency.symbol}${Number(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const ROI_COLUMNS = [
        { key: "SrNo", label: "Sr No" },
        { key: "Name", label: "Name" },
        { key: "UserName", label: "Username" },
        { key: "ProductName", label: "Package" },
        { key: "Amount", label: "Investment" },
        { key: "ROIPercentage", label: "ROI %" },
        { key: "Income", label: "Income" },
    ];
    const handleProcessROI = async (date: string) => {
        try {
            const formattedDate = formatToDDMMMYYYY(date);

            const confirmResult = await Swal.fire({
                title: "Process ROI Income?",
                html: `
                <div style="font-size:14px;">
                    Do you want to process ROI Income of
                    <b style="color:#3085d6;">${formattedDate}</b> ?
                </div>
            `,
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes, Process it!",
            });

            if (!confirmResult.isConfirmed) return;

            setProcessingROI(true);

            const payload = {
                procName: "DistributeInvestmentROI",
                Para: JSON.stringify({
                    ProcessBy : localStorage.getItem("CompanyId"),
                    ProcessDate: date,
                }),
            };

            const response = await universalService(payload);
            const res = Array.isArray(response) ? response[0] : response;

            if (res?.StatusCode === 1) {
                await Swal.fire({
                    title: "Success!",
                    html: `ROI Income processed successfully for <b>${formattedDate}</b>`,
                    icon: "success",
                    confirmButtonColor: "#3085d6",
                });

                fetchROIIncome();
                setOpenROI(false);
            } else {
                Swal.fire({
                    title: "Error",
                    text: res?.msg || "Something went wrong",
                    icon: "error",
                });
            }

        } catch (error) {
            console.error("Process ROI Error:", error);

            Swal.fire({
                title: "Error",
                text: "Server error while processing ROI.",
                icon: "error",
            });
        } finally {
            setProcessingROI(false);
        }
    };


    useEffect(() => {
        fetchDocumentPermissions();
    }, []);


    useEffect(() => {
        if (!permissionsLoading && hasPageAccess) {
            fetchROIIncome();
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
                        <h5 className="!mb-0">Process ROI Income</h5>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
                        {/* RIGHT GROUP: Filters + Search + Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">

                            {/* BUTTONS */}
                            <div className="flex items-center gap-2">


                                <button
                                    type="button"
                                    className="px-4 h-[35px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg bg-white hover:bg-primary-button-bg hover:border-white hover:text-white transition-all disabled:opacity-50"

                                >
                                    Total Income : {currency.symbol}{totalIncome}
                                </button>
                                {/* ADD BUTTON */}
                                <div className="relative group">
                                    <PermissionAwareTooltip
                                        allowed={SmartActions.canAdd(CURRENT_FORM_ID)}
                                        allowedText="Process ROI"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOpenROI(true)}
                                            disabled={!SmartActions.canAdd(CURRENT_FORM_ID)}
                                            className="px-4 h-[35px] flex items-center justify-center rounded-md border border-white text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all disabled:opacity-50"
                                        >
                                            Process ROI
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
                                                key={row.SrNo}
                                                className="hover:bg-gray-50 dark:hover:bg-[#1c2846] transition-all"
                                            >
                                                {ROI_COLUMNS.map((col) => {
                                                    const value = row[col.key as keyof ROIRecord];

                                                    const isCurrency =
                                                        col.key === "Amount" || col.key === "Income";


                                                    return (
                                                        <td
                                                            key={col.key}
                                                            className={`px-[20px] py-[15px] border-b border-gray-100 dark:border-[#172036]
                                           `}
                                                        >
                                                            {isCurrency
                                                                ? formatCurrency(value as number)
                                                                : value ?? "-"}
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
                onClose={() => setOpenROI(false)}
                className="relative z-60"
            >
                <DialogBackdrop className="fixed inset-0 bg-gray-500/75 transition-opacity" />

                <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 sm:p-0">
                        <DialogPanel
                            className="relative transform overflow-hidden rounded-lg bg-white dark:bg-[#0c1427]
                text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[450px]"
                        >
                            <div className="trezo-card w-full p-[20px] md:p-[25px]">

                                {/* Header */}
                                <div className="trezo-card-header bg-gray-50 dark:bg-[#15203c]
                        mb-[20px] flex items-center justify-between
                        -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px]
                        p-[20px] md:p-[25px] rounded-t-md"
                                >
                                    <h5 className="!mb-0">Process ROI Income</h5>

                                    <button
                                        type="button"
                                        className="text-[23px] hover:text-primary-button-bg"
                                        onClick={() => setOpenROI(false)}
                                    >
                                        <i className="ri-close-fill"></i>
                                    </button>
                                </div>

                                <Formik
                                    initialValues={{
                                        Date: todayDate,
                                    }}
                                    validationSchema={roiSchema}
                                    onSubmit={(values) => {
                                        handleProcessROI(values.Date);
                                    }}

                                >
                                    <Form className="space-y-5">

                                        {/* Date */}
                                        <div>
                                            <label className="mb-[10px] font-medium block">
                                                Select Date <span className="text-red-500">*</span>
                                            </label>

                                            <Field name="Date">
                                                {({ field, form }: any) => (
                                                    <input
                                                        type="text"
                                                        value={formatToDDMMMYYYY(field.value)}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            const parsed = new Date(raw);
                                                            if (!isNaN(parsed.getTime())) {
                                                                form.setFieldValue(
                                                                    "Date",
                                                                    parsed.toISOString().split("T")[0]
                                                                );
                                                            }
                                                        }}
                                                        onFocus={(e) => {
                                                            e.target.type = "date";
                                                            e.target.value = field.value;
                                                        }}
                                                        onBlur={(e) => {
                                                            e.target.type = "text";
                                                            e.target.value = formatToDDMMMYYYY(field.value);
                                                        }}
                                                        className="h-[55px] rounded-md border border-gray-200
      dark:border-[#172036] bg-white dark:bg-[#0c1427]
      px-[17px] block w-full focus:border-primary-button-bg"
                                                    />
                                                )}
                                            </Field>



                                            <ErrorMessage
                                                name="Date"
                                                component="p"
                                                className="text-red-500 text-sm"
                                            />
                                        </div>

                                        <hr className="border-t border-gray-200 dark:border-gray-700 -mx-7" />

                                        {/* Footer */}
                                        <div className="text-right">

                                            <button
                                                type="button"
                                                className="mr-[15px] px-[26px] py-[12px]
                                    rounded-md bg-danger-500 text-white hover:bg-danger-400"
                                                onClick={() => setOpenROI(false)}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={processingROI}
                                                className="px-[26px] py-[12px]
                                    rounded-md bg-primary-button-bg text-white
                                    hover:bg-primary-button-bg-hover"
                                            >
                                                {processingROI ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="theme-loader"></div>
                                                        <span>Processing...</span>
                                                    </div>
                                                ) : (
                                                    "Process ROI"
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
