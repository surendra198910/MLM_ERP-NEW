"use client";
import React, { useState, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import * as Yup from "yup";

type LevelSetting = {
    RequiredSponsorCount: number | "";
    RequiredBusinessAmount: number | "";
    CommissionType: string;
    LevelPercentage: number | "";
};


interface Props { }

export default function LevelSettingsManager({ }: Props) {

    const { universalService } = ApiService();
    const [errors, setErrors] = useState<any[]>([]);

    const emptyRow: LevelSetting = {
        RequiredSponsorCount: "",
        RequiredBusinessAmount: "",
        CommissionType: "Percent",
        LevelPercentage: "",
    };
    const levelSchema = Yup.array().of(
        Yup.object().shape({
            RequiredSponsorCount: Yup.number()
                .typeError("Sponsor Count is required")
                .required("Sponsor Count is required")
                .min(0, "Cannot be negative"),

            RequiredBusinessAmount: Yup.number()
                .typeError("Business Amount is required")
                .required("Business Amount is required")
                .min(0, "Cannot be negative"),

            CommissionType: Yup.string()
                .required("Commission Type is required"),

            LevelPercentage: Yup.number()
                .typeError("Level Percentage is required")
                .required("Level Percentage is required")
                .min(0, "Cannot be negative")
                .max(100, "Cannot exceed 100%"),
        })
    );

    const [rows, setRows] = useState<LevelSetting[]>([emptyRow]);
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(true);

    /* ======================================================
       LOAD DATA
    ====================================================== */
    useEffect(() => {
        fetchLevels();
    }, []);

    const fetchLevels = async () => {
        try {
            setTableLoading(true);

            const res = await universalService({
                procName: "ManageLevelIncome",
                Para: JSON.stringify({
                    ActionMode: "GetAll",
                }),
            });

            const data = res?.data || res;

            if (Array.isArray(data) && data.length > 0) {

                const formatted = data.map((item: any) => ({
                    RequiredSponsorCount: item?.RequiredSponsorCount ?? "",
                    RequiredBusinessAmount: item?.RequiredBusinessAmount ?? "",
                    CommissionType: item?.CommissionType || "Percent",
                    LevelPercentage: item?.LevelPercentage ?? "",
                }));

                setRows(formatted);

            } else {
                setRows([emptyRow]);
            }

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to load level settings", "error");
        } finally {
            setTableLoading(false);
        }
    };



    /* ======================================================
       ROW OPERATIONS
    ====================================================== */

    const addRow = () => setRows([...rows, emptyRow]);

    const removeRow = async (index: number) => {
        const result = await Swal.fire({
            title: "Remove this level?",
            text: `Level ${index + 1} will be removed.`,
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
        field: keyof LevelSetting,
        value: any
    ) => {
        const updated = [...rows];
        updated[index][field] = value;
        setRows(updated);

        try {
            await levelSchema.validateAt(`[${index}].${field}`, updated);

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
       VALIDATION
    ====================================================== */

    const validate = () => {
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];

            if (
                r.RequiredSponsorCount === "" ||
                r.RequiredBusinessAmount === "" ||
                r.CommissionType === "" ||
                r.LevelPercentage === ""
            ) {
                Swal.fire(
                    "Validation Error",
                    `Please fill all fields in Level ${i + 1}`,
                    "warning"
                );
                return false;
            }
        }
        return true;
    };

    /* ======================================================
       SAVE
    ====================================================== */

   const handleSave = async () => {
    try {
        // ✅ Full Yup validation
        await levelSchema.validate(rows, { abortEarly: false });

        // Clear previous errors if validation passes
        setErrors([]);

    } catch (validationError: any) {

        const formattedErrors: any[] = [];

        if (validationError.inner && validationError.inner.length > 0) {

            validationError.inner.forEach((err: any) => {
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
        }

        // ✅ Set inline errors (no Swal popup)
        setErrors(formattedErrors);
        return;
    }

    // ✅ Confirmation only (correct usage of Swal)
    const confirmResult = await Swal.fire({
        title: "Are you sure?",
        text: "Do you want to update level settings?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Update",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
    });

    if (!confirmResult.isConfirmed) return;

    try {
        setLoading(true);

        const finalData = rows.map((row, index) => ({
            LevelNo: index + 1,
            RequiredSponsorCount: Number(row.RequiredSponsorCount),
            RequiredBusinessAmount: Number(row.RequiredBusinessAmount),
            CommissionType: row.CommissionType,
            LevelPercentage: Number(row.LevelPercentage),
        }));

        const response = await universalService({
            procName: "ManageLevelIncome",
            Para: JSON.stringify({
                ActionMode: "Update",
                JsonData: JSON.stringify(finalData),
                EntryBy: localStorage.getItem("CompanyId"),
            }),
        });

        const res = response?.data?.[0] || response?.[0] || response;

        if (res?.Status === "SUCCESS") {
            Swal.fire("Success", res.Message, "success");
            fetchLevels();
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


    return (
        <div className="trezo-card relative bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">

            {/* HEADER */}
            <div className="flex justify-between items-center 
    border-b border-gray-200 dark:border-gray-700 
    pb-4 mb-0 -mx-7 px-6">

                <h5 className="font-bold text-xl text-black dark:text-white">
                    Level Settings
                </h5>

                <button
                    onClick={addRow}
                    className="px-4 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover 
                   text-white rounded text-sm flex items-center gap-2 transition-all"
                >
                    <FaPlus size={12} />
                    Add Level
                </button>
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
                            <th className="px-4 py-3 text-left font-semibold w-[80px]">Level</th>
                            <th className="px-4 py-3 text-left font-semibold">Sponsor Count</th>
                            <th className="px-4 py-3 text-left font-semibold">Business Amount</th>
                            <th className="px-4 py-3 text-left font-semibold w-[160px]">Commission Type</th>
                            <th className="px-4 py-3 text-left font-semibold w-[120px]">Level %</th>
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

                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        value={row.RequiredSponsorCount}
                                        onChange={(e) =>
                                            handleChange(index, "RequiredSponsorCount", e.target.value)
                                        }
                                        className={`${baseInputClass} ${errors[index]?.RequiredSponsorCount
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-200 dark:border-gray-700 focus:ring-primary-button-bg"
                                            }`}
                                    />

                                    {errors[index]?.RequiredSponsorCount && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors[index].RequiredSponsorCount}
                                        </p>
                                    )}

                                </td>

                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        value={row.RequiredBusinessAmount}
                                        onChange={(e) =>
                                            handleChange(index, "RequiredBusinessAmount", e.target.value)
                                        }
                                        className={`${baseInputClass} ${errors[index]?.RequiredBusinessAmount
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-200 dark:border-gray-700 focus:ring-primary-button-bg"
                                            }`}
                                    />

                                    {errors[index]?.RequiredBusinessAmount && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors[index].RequiredBusinessAmount}
                                        </p>
                                    )}

                                </td>

                                <td className="px-4 py-3">
                                    <select
                                        value={row.CommissionType}
                                        onChange={(e) =>
                                            handleChange(index, "CommissionType", e.target.value)
                                        }
                                        className={`${baseInputClass} ${errors[index]?.CommissionType
                                            ? "border-red-500 focus:ring-red-500"
                                            : "border-gray-200 dark:border-gray-700 focus:ring-primary-button-bg"
                                            }`}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Fixed">Fixed</option>
                                        <option value="Percent">Percent</option>
                                    </select>

                                    {errors[index]?.CommissionType && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors[index].CommissionType}
                                        </p>
                                    )}

                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={row.LevelPercentage}
                                        onChange={(e) =>
                                            handleChange(
                                                index,
                                                "LevelPercentage",
                                                e.target.value === "" ? "" : Number(e.target.value)
                                            )
                                        }
                                        onWheel={(e) => e.currentTarget.blur()} // prevent scroll change
                                        className={`${baseInputClass} ${errors[index]?.LevelPercentage
                                                ? "border-red-500 focus:ring-red-500"
                                                : "border-gray-200 dark:border-gray-700 focus:ring-primary-button-bg"
                                            }`}
                                    />

                                    {errors[index]?.LevelPercentage && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors[index].LevelPercentage}
                                        </p>
                                    )}

                                </td>


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
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover
                   text-white rounded-md text-sm"
                >
                    {loading ? "Saving..." : "Save Settings"}
                </button>
            </div>
        </div>
    );
}
