"use client";
import React, { useState, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import * as Yup from "yup";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import AccessRestricted from "../../common/AccessRestricted";

type PairIncomeSettingRow = {
    FromPair: number | "";
    ToPair: number | "";
    Ratio: string;
    IncomePercentage: number | "";
    Capping: number | "";
};



interface Props { }

export default function PairIncomeSetting({ }: Props) {

    const { universalService } = ApiService();
    const [errors, setErrors] = useState<any[]>([]);

    const emptyRow: PairIncomeSettingRow = {
        FromPair: "",
        ToPair: "",
        Ratio: "",
        IncomePercentage: "",
        Capping: "",
    };

    const pairSchema = Yup.array().of(
        Yup.object().shape({
            FromPair: Yup.number()
                .typeError("From Pair is required")
                .required("From Pair is required")
                .min(0),

            ToPair: Yup.number()
                .typeError("To Pair is required")
                .required("To Pair is required")
                .min(0),

            Ratio: Yup.string()
                .required("Ratio is required")
                .matches(/^\d+:\d+$/, "Ratio must be like 1:1 or 2:1"),


            IncomePercentage: Yup.number()
                .typeError("Income % is required")
                .required("Income % is required")
                .min(0)
                .max(100),

            Capping: Yup.number()
                .typeError("Capping is required")
                .required("Capping is required")
                .min(0),
        })
    );


    const [rows, setRows] = useState<PairIncomeSettingRow[]>([emptyRow]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(true);
    const [permissionLoading, setPermissionLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState(true);

    const path = location.pathname;
    const formName = path.split("/").pop();
    const isEditable = SmartActions.canEdit(formName);
    // must match DB
    const fetchFormPermissions = async () => {
        try {
            setPermissionLoading(true);

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
                    formName?.trim().toLowerCase()
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

        } catch (err) {
            console.error("Permission fetch failed", err);
            setHasPageAccess(false);
        } finally {
            setPermissionLoading(false);
        }
    };

    /* ======================================================
       LOAD DATA
    ====================================================== */



    const fetchPairIncome = async () => {
        try {
            setTableLoading(true);

            const res = await universalService({
                procName: "ManagePairIncome",
                Para: JSON.stringify({
                    ActionMode: "GetAll",
                }),
            });

            const data = res?.data || res;

            if (Array.isArray(data) && data.length > 0) {
                const formatted = data.map((item: any) => ({
                    FromPair: item?.FromPair ?? "",
                    ToPair: item?.ToPair ?? "",
                    Ratio: item?.Ratio ?? "",
                    IncomePercentage: item?.IncomePercentage ?? "",
                    Capping: item?.Capping ?? "",
                }));

                setRows(formatted);
            } else {
                setRows([{ ...emptyRow }]);
            }

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to load Pair Income settings", "error");
        } finally {
            setTableLoading(false);
        }
    };


    useEffect(() => {
        fetchFormPermissions();
        fetchPairIncome();
    }, []);


    /* ======================================================
       ROW OPERATIONS
    ====================================================== */

    const addRow = () => setRows([...rows, emptyRow]);

    const removeRow = async (index: number) => {
        const result = await Swal.fire({
            title: "Remove this pair?",
            text: `Pair ${index + 1} will be removed.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Remove",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
        });

        if (!result.isConfirmed) return;

        setRows((prev) => prev.filter((_, i) => i !== index));

        Swal.fire({
            icon: "success",
            title: "Removed",
            text: "Level removed successfully.",
            timer: 1200,
            showConfirmButton: false,
        });
    };


    const handleChange = async (
        index: number,
        field: keyof PairIncomeSettingRow,
        value: any
    ) => {
        const updated = [...rows];
        updated[index][field] = value;
        setRows(updated);

        try {
            await pairSchema.validateAt(`[${index}].${field}`, updated);

            const newErrors = [...errors];
            if (newErrors[index]) {
                delete newErrors[index][field];
            }
            setErrors(newErrors);

        } catch (validationError: any) {
            const newErrors = [...errors];
            newErrors[index] = {
                ...newErrors[index],
                [field]: validationError.message,
            };
            setErrors(newErrors);
        }
    };




    /* ======================================================
       SAVE
    ====================================================== */
    const handleSave = async () => {

        if (!SmartActions.canEdit(formName)) {
            Swal.fire("Permission Denied", "You cannot update Pair Income settings.", "error");
            return;
        }

        try {
            await pairSchema.validate(rows, { abortEarly: false });
            setErrors([]);
        } catch (validationError: any) {

            const formattedErrors: any[] = [];

            validationError.inner?.forEach((err: any) => {
                const match = err.path?.match(/\[(\d+)\]\.(.+)/);
                if (match) {
                    const rowIndex = Number(match[1]);
                    const fieldName = match[2];

                    if (!formattedErrors[rowIndex]) {
                        formattedErrors[rowIndex] = {};
                    }
                    formattedErrors[rowIndex][fieldName] = err.message;
                }
            });

            setErrors(formattedErrors);
            return;
        }

        const confirmResult = await Swal.fire({
            title: "Are you sure?",
            text: "Do you want to update Pair Income settings?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Update",
            cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            setLoading(true);

            const finalData = rows.map(row => ({
                FromPair: Number(row.FromPair),
                ToPair: Number(row.ToPair),
                Ratio: row.Ratio,
                IncomePercentage: Number(row.IncomePercentage),
                Capping: Number(row.Capping),
            }));

            const response = await universalService({
                procName: "ManagePairIncome",
                Para: JSON.stringify({
                    ActionMode: "Update",
                    JsonData: JSON.stringify(finalData),
                    EntryBy: Number(localStorage.getItem("CompanyId") || 0),
                }),
            });

            const res = response?.data?.[0] || response?.[0] || response;

            if (res?.Status === "SUCCESS") {
                Swal.fire("Success", res.Message, "success");
                fetchPairIncome();
            } else {
                Swal.fire("Error", res?.Message || "Operation failed", "error");
            }

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to save settings", "error");
        } finally {
            setLoading(false);
        }
    };



    /* ======================================================
       UI
    ====================================================== */
    const baseInputClass =
        "w-full h-10 px-3 rounded-md text-sm " +
        "border bg-white dark:bg-gray-800 dark:text-gray-100 " +
        "focus:outline-none focus:ring-1 transition-all duration-200";
  if (permissionLoading) {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-[#0c1427] rounded-md">
      <div className="flex flex-col items-center gap-3">
        <div className="theme-loader"></div>
        {/* <p className="text-sm text-gray-500">
          Loading permissions...
        </p> */}
        
      </div>
    </div>
  );
}
if (!hasPageAccess) {
  return (
   <AccessRestricted />
  );
}


    return (
        <div className="trezo-card relative bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">

            {/* HEADER */}
            <div className="flex justify-between items-center 
    border-b border-gray-200 dark:border-gray-700 
    pb-4 mb-0 -mx-7 px-6">

                <h5 className="font-bold text-xl text-black dark:text-white">
                    Binary Income Setting
                </h5>

                <PermissionAwareTooltip
                    allowed={isEditable}
                    allowedText="Add Pair"
                    deniedText="Permission required"
                >
                    <button
                        onClick={() => {
                            if (!isEditable) return;
                            addRow();
                        }}
                        disabled={!isEditable}
                        className="px-4 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover 
        text-white rounded text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <FaPlus size={12} />
                        Add Pair
                    </button>
                </PermissionAwareTooltip>

            </div>

            {/* LOADER OVERLAY */}
            {tableLoading && (
                <div className="absolute inset-0 
                    bg-white/60 dark:bg-black/40
                    flex items-center justify-center 
                    z-10 rounded-lg">

                    <div className="animate-spin w-8 h-8 
                      border-4 border-primary-button-bg 
                      border-t-transparent rounded-full" />
                </div>
            )}

            {/* TABLE */}
            <div className="overflow-x-auto -mx-13 px-6">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-primary-table-bg text-primary-table-text dark:bg-[#15203c]">
                            <th className="px-4 py-3 text-left font-semibold w-[80px]">S. No.</th>
                            <th className="px-4 py-3 text-left font-semibold">From Pair</th>
                            <th className="px-4 py-3 text-left font-semibold">To Pair</th>
                            <th className="px-4 py-3 text-left font-semibold w-[160px]">Ratio</th>
                            <th className="px-4 py-3 text-left font-semibold w-[190px]">Income Percentage</th>
                            <th className="px-4 py-3 text-left font-semibold w-[120px]">Capping</th>
                            <th className="px-0 py-3 text-center font-semibold w-[100px]">Action</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white dark:bg-[#0c1427]">
                        {rows.map((row, index) => (
                            <tr
                                key={index}
                                className="border-b border-gray-100 dark:border-gray-700 
            hover:bg-gray-50 dark:hover:bg-[#172036] 
            transition-colors duration-200"
                            >
                                <td className="px-4 py-3 font-semibold">
                                    {index + 1}
                                </td>

                                {/* From Pair */}
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        disabled={!isEditable}
                                        value={row.FromPair}
                                        className={`${baseInputClass} ${errors[index]?.FromPair
                                                ? "border-red-500 focus:ring-red-500"
                                                : "border-gray-200 dark:border-gray-700 focus:ring-primary-button-bg"
                                            }`}
                                        onChange={(e) =>
                                            handleChange(index, "FromPair", e.target.value)
                                        }
                                    />
                                    {errors[index]?.FromPair && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors[index].FromPair}
                                        </p>
                                    )}
                                </td>

                                {/* To Pair */}
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        disabled={!isEditable}
                                        value={row.ToPair}
                                        className={`${baseInputClass} ${errors[index]?.ToPair
                                                ? "border-red-500 focus:ring-red-500"
                                                : "border-gray-200 dark:border-gray-700 focus:ring-primary-button-bg"
                                            }`}
                                        onChange={(e) =>
                                            handleChange(index, "ToPair", e.target.value)
                                        }
                                    />
                                    {errors[index]?.ToPair && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors[index].ToPair}
                                        </p>
                                    )}
                                </td>

                                {/* Ratio */}
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        disabled={!isEditable}
                                        value={row.Ratio}
                                        placeholder="e.g. 1:1"
                                        className={`${baseInputClass} ${errors[index]?.Ratio
                                                ? "border-red-500 focus:ring-red-500"
                                                : "border-gray-200 dark:border-gray-700 focus:ring-primary-button-bg"
                                            }`}
                                        onChange={(e) =>
                                            handleChange(index, "Ratio", e.target.value)
                                        }
                                    />
                                    {errors[index]?.Ratio && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors[index].Ratio}
                                        </p>
                                    )}
                                </td>

                                {/* Income Percentage */}
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        disabled={!isEditable}
                                        value={row.IncomePercentage}
                                        className={`${baseInputClass} ${errors[index]?.IncomePercentage
                                                ? "border-red-500 focus:ring-red-500"
                                                : "border-gray-200 dark:border-gray-700 focus:ring-primary-button-bg"
                                            }`}
                                        onChange={(e) =>
                                            handleChange(index, "IncomePercentage", e.target.value)
                                        }
                                    />
                                    {errors[index]?.IncomePercentage && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors[index].IncomePercentage}
                                        </p>
                                    )}
                                </td>

                                {/* Capping */}
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        disabled={!isEditable}
                                        value={row.Capping}
                                        className={`${baseInputClass} ${errors[index]?.Capping
                                                ? "border-red-500 focus:ring-red-500"
                                                : "border-gray-200 dark:border-gray-700 focus:ring-primary-button-bg"
                                            }`}
                                        onChange={(e) =>
                                            handleChange(index, "Capping", e.target.value)
                                        }
                                    />
                                    {errors[index]?.Capping && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors[index].Capping}
                                        </p>
                                    )}
                                </td>

                                {/* Action */}
                                <td className="px-8 py-3 text-center">
                                    {rows.length > 1 && (
                                        <button
                                            onClick={() => removeRow(index)}
                                            className="w-9 h-9 flex items-center justify-center
                        rounded-md text-red-500 hover:bg-red-500 hover:text-white"
                                        >
                                            <FaTimes size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

            {/* SAVE BUTTON */}
            <div className="mt-6 flex justify-end">
                <PermissionAwareTooltip
                    allowed={isEditable}
                    allowedText="Save Settings"
                    deniedText="Permission required"
                >
                    <button
                        onClick={() => {
                            if (!isEditable) return;
                            handleSave();
                        }}
                        disabled={!isEditable || loading}
                        className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover
        text-white rounded-md text-sm disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </button>
                </PermissionAwareTooltip>

            </div>
        </div>
    );
}
