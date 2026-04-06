"use client";

import { useEffect, useState } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import { ApiService } from "../../../../services/ApiService";
import { toast, ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import "react-toastify/dist/ReactToastify.css";
import { FaSave, FaMoneyBillWave, FaExchangeAlt } from "react-icons/fa";
import PermissionAwareTooltip from "../Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../Security/SmartActionWithFormName";
import AccessRestricted from "../../common/AccessRestricted";
import { motion } from "framer-motion";
import Loader from "../../common/Loader";

// -------------------------------------
// TYPES
// -------------------------------------
; const initialValues = {
    SettingId: "",

    // Withdrawal
    MinimumWithdrawalAmount: "",
    MaximumWithdrawalAmount: "",
    WithdrawalAdminCharge: "",
    WithdrawalStatus: false,
    WithdrawType: "",
    WithdrawalTDS: "",
    WithdrawalOtherCharges: "",

    // Transfer
    MinimumTransferAmount: "",
    MaximumTransferAmount: "",
    TransferCharge: "",
    TransferStatus: false,
    TransferTDS: "",
    TransferOtherCharges: "",
};
// -------------------------------------
// VALIDATION
// -------------------------------------

const validationSchema = Yup.object().shape({

    // 🔹 Withdrawal
    MinimumWithdrawalAmount: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .min(0, "Must be greater than or equal to 0"),

    MaximumWithdrawalAmount: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .moreThan(Yup.ref("MinimumWithdrawalAmount"), "Must be greater than Minimum Withdrawal"),

    WithdrawalAdminCharge: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .min(0, "Cannot be negative")
        .max(100, "Cannot exceed 100%"),

    WithdrawalStatus: Yup.boolean(),


    // 🔹 Transfer
    MinimumTransferAmount: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .min(0, "Must be greater than or equal to 0"),

    MaximumTransferAmount: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .moreThan(Yup.ref("MinimumTransferAmount"), "Must be greater than Minimum Transfer"),

    TransferCharge: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .min(0, "Cannot be negative")
        .max(100, "Cannot exceed 100%"),

    TransferStatus: Yup.boolean(),
    WithdrawType: Yup.string().required("Required"),

    WithdrawalTDS: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .min(0)
        .max(100),

    WithdrawalOtherCharges: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .min(0)
        .max(100),

    TransferTDS: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .min(0)
        .max(100),

    TransferOtherCharges: Yup.number()
        .typeError("Must be a number")
        .required("Required")
        .min(0)
        .max(100),
});


// -------------------------------------
// MAIN COMPONENT
// -------------------------------------

export default function GlobalSetting() {
    const { universalService } = ApiService();
    const [form, setForm] = useState(initialValues);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [hasPageAccess, setHasPageAccess] = useState(true);

    const path = location.pathname;
    const formName = path.split("/").pop();   // must match DB

    const [tab, setTab] = useState(0);


    const tabs = [
        { label: "Withdrawal Settings", icon: <FaMoneyBillWave /> },
        { label: "Transfer Settings", icon: <FaExchangeAlt /> },
    ];

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
        } catch (error) {
            console.error("Permission fetch failed:", error);
            setHasPageAccess(false);
        } finally {
            setPermissionsLoading(false);
        }
    };


    const inputClass =
        "w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 " +
        "focus:outline-none focus:border-primary-button-bg focus:ring-1 focus:ring-primary-button-bg " +
        "bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100";


    useEffect(() => {
        fetchFormPermissions();
        loadSettings();

    }, []);



    // -------------------------------------
    // LOAD DATA (GET)
    // -------------------------------------
    const handleBlur = () => {
        console.log("handleBlur");
    };
    const loadSettings = async () => {
        try {
            setInitialLoading(true);

            const payload = {
                procName: "ManageWithdrawalSetting",
                Para: JSON.stringify({
                    ActionMode: "GET",
                }),
            };

            const res = await universalService(payload);

            const data = res?.data?.[0] || res?.[0];

            if (!data) return;
            setForm({
                SettingId: data.SettingId,

                // Withdrawal
                MinimumWithdrawalAmount: data.MinimumWithdrawalAmount || "",
                MaximumWithdrawalAmount: data.MaximumWithdrawalAmount || "",
                WithdrawalAdminCharge: data.WithdrawalAdminCharge || "",
                WithdrawalStatus: data.WithdrawalStatus || false,
                WithdrawType: data.WithdrawType?.trim() || "",
                WithdrawalTDS: data.WithdrawalTDS || "",
                WithdrawalOtherCharges: data.WithdrawalOtherCharges || "",

                // Transfer
                MinimumTransferAmount: data.MinimumTransferAmount || "",
                MaximumTransferAmount: data.MaximumTransferAmount || "",
                TransferCharge: data.TransferCharge || "",
                TransferStatus: data.TransferStatus || false,
                TransferTDS: data.TransferTDS || "",
                TransferOtherCharges: data.TransferOtherCharges || "",
            });



        } catch (err) {
            console.error("Load Error", err);
            toast.error("Failed to load settings");
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        const confirm = await Swal.fire({
            title: "Update Settings?",
            text: "Are you sure you want to save these changes?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, Update",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#3085d6",
        });

        if (!confirm.isConfirmed) return;

        try {
            setLoading(true);
            const payload = {
                procName: "ManageWithdrawalSetting",
                Para: JSON.stringify({
                    ActionMode: "UPDATE",

                    SettingId: values.SettingId,

                    // Withdrawal
                    MinimumWithdrawalAmount: Number(values.MinimumWithdrawalAmount),
                    MaximumWithdrawalAmount: Number(values.MaximumWithdrawalAmount),
                    WithdrawalAdminCharge: Number(values.WithdrawalAdminCharge),
                    WithdrawalStatus: values.WithdrawalStatus,
                    WithdrawType: values.WithdrawType,
                    WithdrawalTDS: Number(values.WithdrawalTDS),
                    WithdrawalOtherCharges: Number(values.WithdrawalOtherCharges),

                    // Transfer
                    MinimumTransferAmount: Number(values.MinimumTransferAmount),
                    MaximumTransferAmount: Number(values.MaximumTransferAmount),
                    TransferCharge: Number(values.TransferCharge),
                    TransferStatus: values.TransferStatus,
                    TransferTDS: Number(values.TransferTDS),
                    TransferOtherCharges: Number(values.TransferOtherCharges),
                }),
            };


            const res = await universalService(payload);

            const result =
                res?.data?.[0] ||
                res?.data ||
                res?.[0] ||
                res;

            if (result?.Status === "SUCCESS") {
                Swal.fire(
                    "Success!",
                    result?.Message || "Settings updated successfully",
                    "success"
                );

                loadSettings();
            } else {
                Swal.fire(
                    "Error",
                    result?.Message || "Update failed",
                    "error"
                );
            }
        } catch (err) {
            console.error("Update Error", err);
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };



    // -------------------------------------
    // LOADING SCREEN
    // -------------------------------------
    if (permissionsLoading) {
        return (
            <Loader />
        );
    }
    if (!hasPageAccess) {
        return (
            <AccessRestricted />
        );
    }

    if (initialLoading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    // -------------------------------------
    // UI
    // -------------------------------------

    return (
        <Formik
            initialValues={form}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={handleSubmit}
        >
            {({
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
                setFieldValue,
            }) => (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white dark:bg-[#0c1427] rounded-lg shadow p-6 relative"
                >
                    {/* LOADER */}
                    {(loading) && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 flex items-center justify-center z-10 rounded-lg">
                            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                        </div>
                    )}

                    {/* HEADER */}
                    <div className="flex justify-between items-center border-b border-gray-200  pb-3 mb-3 -mx-[20px] md:-mx-[20px] px-[20px] md:px-[25px]">
                        <div className="trezo-card-title">
                            <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
                                Withdraw Setting
                            </h5>
                        </div>

                        <div className="flex gap-2">
                            <PermissionAwareTooltip
                                allowed={SmartActions.canUpdate(formName)}
                                allowedText="Update Settings"
                                deniedText="Permission required"
                            >
                                <button
                                    type="submit"
                                    disabled={!SmartActions.canUpdate(formName)}
                                    className="flex items-center gap-2 px-4 py-1.5 
    bg-primary-button-bg hover:bg-primary-button-bg-hover 
    text-white rounded text-sm disabled:opacity-50"
                                >
                                    <FaSave /> Update
                                </button>
                            </PermissionAwareTooltip>

                        </div>

                    </div>

                    {/* TABS */}
                    <div className="mt-7 mb-6">
                        <div className="flex border-b border-gray-200 gap-6 overflow-x-auto px-6 relative">

                            {tabs.map((t, i) => {
                                const isActive = tab === i;

                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setTab(i)}
                                        className={`
          relative pb-3 text-sm font-medium
          transition-colors duration-200
          flex items-center gap-2 whitespace-nowrap
          ${isActive
                                                ? "text-primary-button-bg"
                                                : "text-gray-500 hover:text-gray-700"}
        `}
                                    >
                                        {t.icon}
                                        {t.label}

                                        {/* 🔥 Animated Underline */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="tabUnderline"
                                                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-button-bg rounded-full"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}

                        </div>

                    </div>
                    {tab === 0 && (
                        <div className="space-y-6 animate-fadeIn">

                            {/* 🔥 TOP STATUS BAR */}
                            <div className="flex items-center justify-between p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0c1427]">
                                {/* <h6 className="text-sm font-semibold text-black dark:text-white">
                                    Withdrawal Settings
                                </h6> */}

                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 dark:text-gray-300">
                                        Withdrawal Status
                                    </span>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="WithdrawalStatus"
                                            className="sr-only peer"
                                            checked={values.WithdrawalStatus}
                                            onChange={() =>
                                                setFieldValue("WithdrawalStatus", !values.WithdrawalStatus)
                                            }
                                        />
                                        <div className="w-11 h-6 bg-gray-300 rounded-full peer dark:bg-gray-600 peer-checked:bg-primary-button-bg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                    </label>
                                </div>
                            </div>

                            {/* 🔥 ROW 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                {/* 🔹 Minimum Withdrawal */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        Minimum Withdrawal Amount<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="MinimumWithdrawalAmount"
                                        value={values.MinimumWithdrawalAmount || ""}
                                        onChange={handleChange}
                                        min="0"
                                        className={`${inputClass} ${touched.MinimumWithdrawalAmount && errors.MinimumWithdrawalAmount ? "border-red-500" : ""}`}
                                    />
                                    {touched.MinimumWithdrawalAmount && errors.MinimumWithdrawalAmount && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.MinimumWithdrawalAmount}
                                        </p>
                                    )}
                                </div>

                                {/* 🔹 Maximum Withdrawal */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        Maximum Withdrawal Amount<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="MaximumWithdrawalAmount"
                                        value={values.MaximumWithdrawalAmount || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="0"
                                        className={`${inputClass} ${touched.MaximumWithdrawalAmount && errors.MaximumWithdrawalAmount ? "border-red-500" : ""}`}
                                    />
                                    {touched.MaximumWithdrawalAmount && errors.MaximumWithdrawalAmount && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.MaximumWithdrawalAmount}
                                        </p>
                                    )}
                                </div>

                                {/* 🔹 Admin Charges */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        Admin Charges (%)<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="WithdrawalAdminCharge"
                                            value={values.WithdrawalAdminCharge || ""}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`${inputClass} pr-8 ${touched.WithdrawalAdminCharge && errors.WithdrawalAdminCharge ? "border-red-500" : ""}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                                    </div>
                                    {touched.WithdrawalAdminCharge && errors.WithdrawalAdminCharge && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.WithdrawalAdminCharge}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 🔥 ROW 2 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                {/* 🔹 TDS */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        TDS (%)<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="WithdrawalTDS"
                                            value={values.WithdrawalTDS || ""}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`${inputClass} pr-8 ${touched.WithdrawalTDS && errors.WithdrawalTDS ? "border-red-500" : ""}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                                    </div>
                                    {touched.WithdrawalTDS && errors.WithdrawalTDS && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.WithdrawalTDS}
                                        </p>
                                    )}
                                </div>

                                {/* 🔹 Other Charges */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        Other Charges (%)<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="WithdrawalOtherCharges"
                                            value={values.WithdrawalOtherCharges || ""}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`${inputClass} pr-8 ${touched.WithdrawalOtherCharges && errors.WithdrawalOtherCharges ? "border-red-500" : ""}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                                    </div>
                                    {touched.WithdrawalOtherCharges && errors.WithdrawalOtherCharges && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.WithdrawalOtherCharges}
                                        </p>
                                    )}
                                </div>

                                {/* 🔹 Withdraw Type */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        Withdraw Type<span className="text-red-500">*</span>
                                    </label>

                                    <div
                                        className={`${inputClass} flex items-center gap-6`}
                                    >
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="WithdrawType"
                                                value="Auto"
                                                checked={values.WithdrawType === "Auto"}
                                                onChange={handleChange}
                                            />
                                            <span>Auto</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="WithdrawType"
                                                value="Manual"
                                                checked={values.WithdrawType === "Manual"}
                                                onChange={handleChange}
                                            />
                                            <span>Manual</span>
                                        </label>
                                    </div>

                                    {touched.WithdrawType && errors.WithdrawType && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.WithdrawType}
                                        </p>
                                    )}
                                </div>
                            </div>

                        </div>
                    )}
                    {tab === 1 && (
                        <div className="space-y-6 animate-fadeIn">

                            {/* 🔥 TOP STATUS BAR */}
                            <div className="flex items-center justify-between p-4 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0c1427]">
                                {/* <h6 className="text-sm font-semibold text-black dark:text-white">
                                    Transfer Settings
                                </h6> */}

                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 dark:text-gray-300">
                                        Transfer Status
                                    </span>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="TransferStatus"
                                            className="sr-only peer"
                                            checked={values.TransferStatus}
                                            onChange={() =>
                                                setFieldValue("TransferStatus", !values.TransferStatus)
                                            }
                                        />
                                        <div className="w-11 h-6 bg-gray-300 rounded-full peer dark:bg-gray-600 peer-checked:bg-primary-button-bg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                                    </label>
                                </div>
                            </div>

                            {/* 🔥 ROW 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                {/* 🔹 Minimum Transfer */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        Minimum Transfer Amount<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="MinimumTransferAmount"
                                        value={values.MinimumTransferAmount || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="0"
                                        className={`${inputClass} ${touched.MinimumTransferAmount && errors.MinimumTransferAmount ? "border-red-500" : ""}`}
                                    />
                                    {touched.MinimumTransferAmount && errors.MinimumTransferAmount && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.MinimumTransferAmount}
                                        </p>
                                    )}
                                </div>

                                {/* 🔹 Maximum Transfer */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        Maximum Transfer Amount<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="MaximumTransferAmount"
                                        value={values.MaximumTransferAmount || ""}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        min="0"
                                        className={`${inputClass} ${touched.MaximumTransferAmount && errors.MaximumTransferAmount ? "border-red-500" : ""}`}
                                    />
                                    {touched.MaximumTransferAmount && errors.MaximumTransferAmount && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.MaximumTransferAmount}
                                        </p>
                                    )}
                                </div>

                                {/* 🔹 Transfer Charges */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        Transfer Charges (%)<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="TransferCharge"
                                            value={values.TransferCharge || ""}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`${inputClass} pr-8 ${touched.TransferCharge && errors.TransferCharge ? "border-red-500" : ""}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                                    </div>
                                    {touched.TransferCharge && errors.TransferCharge && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.TransferCharge}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* 🔥 ROW 2 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                {/* 🔹 Transfer TDS */}
                                {/* <div>
                                    <label className="text-sm mb-1 block">
                                        TDS (%)<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="TransferTDS"
                                            value={values.TransferTDS || ""}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`${inputClass} pr-8 ${touched.TransferTDS && errors.TransferTDS ? "border-red-500" : ""}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                                    </div>
                                    {touched.TransferTDS && errors.TransferTDS && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.TransferTDS}
                                        </p>
                                    )}
                                </div> */}

                                {/* 🔹 Transfer Other Charges */}
                                <div>
                                    <label className="text-sm mb-1 block">
                                        Other Charges (%)<span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="TransferOtherCharges"
                                            value={values.TransferOtherCharges || ""}
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            className={`${inputClass} pr-8 ${touched.TransferOtherCharges && errors.TransferOtherCharges ? "border-red-500" : ""}`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                                    </div>
                                    {touched.TransferOtherCharges && errors.TransferOtherCharges && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.TransferOtherCharges}
                                        </p>
                                    )}
                                </div>

                                {/* 🔹 EMPTY (for alignment or future field) */}
                                <div></div>

                            </div>

                        </div>
                    )}


                    <ToastContainer position="top-right" autoClose={3000} />


                </form>
            )}
        </Formik>
    );
}
