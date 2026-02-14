"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ApiService } from "../../../../services/ApiService";
import * as Yup from "yup";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

import {
    FaTimes,
    FaPlus,
    FaTrash,
    FaServer,
    FaKey,
} from "react-icons/fa";
type Props = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;   // 👈 ADD THIS
};

type Parameter = {
    key: string;
    value: string;
    isRequired: boolean;
};
const EMAIL_DEFAULT_PARAMETERS: Parameter[] = [
    { key: "Host", value: "", isRequired: true },
    { key: "Port", value: "", isRequired: true },
    { key: "Username", value: "", isRequired: true },
    { key: "Password", value: "", isRequired: true },
    { key: "EnableSSL", value: "true", isRequired: true },
    { key: "FromEmail", value: "", isRequired: true },
    { key: "FromName", value: "", isRequired: false },
];

export default function AddProviderModal({
    open,
    onClose,
    onSuccess,
    editData,     // ✅ ADD THIS
}: Props) {

    const { universalService } = ApiService();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [mappingLoading, setMappingLoading] = useState(false);

    const isEdit = !!editData;
    useEffect(() => {
        if (!open) return;

        // EDIT MODE → wait for editData
        if (editData === undefined) {
            setMappingLoading(true);
            return;
        }

        setMappingLoading(true);

        if (editData) {
            setForm({
                providerType: editData.ProviderType,
                httpMethod: editData.HttpMethod || "POST",
                providerName: editData.Name,
                baseUrl: editData.BaseURL,
                senderId: editData.SenderId || "",
                isDefault: editData.IsDefault ?? false,
                isActive: editData.IsActive ?? true
            });

            setParameters(
                editData.Parameters?.map((p: any) => ({
                    key: p.ParamKey,
                    value: p.ParamValue,
                    isRequired: p.IsRequired,
                })) || []
            );
        } else {
            // ADD MODE
            setForm({
                providerType: "SMS",
                httpMethod: "POST",
                providerName: "",
                baseUrl: "",
                senderId: "",
                isDefault: false,
                isActive: true
            });

            setParameters([{ key: "ApiKey", value: "", isRequired: true }]);
        }

        // Small delay ensures React state finished mapping
        setTimeout(() => {
            setMappingLoading(false);
        }, 50);

    }, [open, editData]);

    const validationSchema = Yup.object().shape({
        providerType: Yup.string().required("Provider Type is required"),

        providerName: Yup.string()
            .trim()
            .min(3, "Provider Name must be at least 3 characters")
            .required("Provider Name is required"),

        baseUrl: Yup.string()
            .trim()

            .required("Base URL is required"),


        parameters: Yup.array()
            .of(
                Yup.object().shape({
                    key: Yup.string().trim().required("Parameter Key is required"),
                    value: Yup.string().trim().required("Parameter Value is required"),
                    isRequired: Yup.boolean(),
                })
            )
            .min(1, "At least one parameter is required")
            .test(
                "unique-keys",
                "Parameter keys must be unique",
                function (params) {
                    if (!params) return true;
                    const keys = params.map(p => p.key?.trim()).filter(Boolean);
                    const uniqueKeys = new Set(keys);
                    return uniqueKeys.size === keys.length;
                }
            ),

        httpMethod: Yup.string()
            .when("providerType", {
                is: (val: string) => val !== "Email",
                then: (schema) => schema.required("HTTP Method is required"),
                otherwise: (schema) => schema.notRequired(),
            }),

    });

    const [form, setForm] = useState({
        providerType: "SMS",
        httpMethod: "POST",   // ✅ ADD THIS
        providerName: "",
        baseUrl: "",
        senderId: "",
        isDefault: false,     // optional if you use it
        isActive: true        // optional if you use it
    });

    useEffect(() => {
        if (!open) return;
        if (isEdit) return;   // ❗ Prevent overwrite in edit mode

        if (form.providerType === "Email") {
            setForm(prev => ({
                ...prev,
                httpMethod: ""
            }));
            setParameters(EMAIL_DEFAULT_PARAMETERS);
        } else {
            setParameters([{ key: "ApiKey", value: "", isRequired: true }]);
        }

    }, [form.providerType, open, isEdit]);


    const [parameters, setParameters] = useState<Parameter[]>([
        { key: "ApiKey", value: "", isRequired: true },
    ]);


    if (!open) return null;

    const inputClass =
        "w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-button-bg focus:border-primary-button-bg bg-white dark:bg-[#111827] dark:text-white";

    const handleAddRow = () => {
        setParameters([
            ...parameters,
            { key: "", value: "", isRequired: true },
        ]);
    };



    const handleRemoveRow = (index: number) => {
        const updated = [...parameters];
        updated.splice(index, 1);
        setParameters(updated);
    };
    const handleSave = async () => {
        try {
            // ✅ Validate with Yup
            await validationSchema.validate(
                { ...form, parameters },
                { abortEarly: false }
            );

            // Clear previous errors if validation passes
            setErrors({});

        } catch (validationError: any) {

            const formattedErrors: any = {};

            if (validationError.inner && validationError.inner.length > 0) {
                validationError.inner.forEach((err: any) => {
                    if (!formattedErrors[err.path]) {
                        formattedErrors[err.path] = err.message;
                    }
                });
            } else if (validationError.path) {
                formattedErrors[validationError.path] = validationError.message;
            }

            setErrors(formattedErrors);
            return;
        }


        try {
            setLoading(true);

            const payload = {
                procName: "ApiManager",
                Para: JSON.stringify({
                    ActionMode: isEdit ? "Update" : "Insert",
                    ProviderId: editData?.ProviderId,
                    ProviderType: form.providerType,
                    HttpMethod: form.httpMethod,   // ✅ ADD THIS
                    ProviderName: form.providerName,
                    BaseUrl: form.baseUrl,
                    SenderId: form.senderId || 0,
                    IsDefault: form.isDefault,
                    IsActive: form.isActive,
                    CreatedBy: 1,
                    Parameters: JSON.stringify(
                        parameters.map((p) => ({
                            ParamKey: p.key,
                            ParamValue: p.value,
                            IsRequired: p.isRequired,
                            IsEncrypted: false,
                        }))
                    ),
                }),

            };

            const res = await universalService(payload);
            const result = res?.data?.[0] || res?.[0] || res;

            if (result?.Status === "SUCCESS") {
                Swal.fire(
                    "Success",
                    isEdit
                        ? "Provider updated successfully"
                        : "Provider added successfully",
                    "success"
                );

                setErrors({});
                onSuccess();
                onClose();
            } else {
                Swal.fire("Error", result?.Message || "Operation failed", "error");
            }

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Server error occurred", "error");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog
            open={open}
            onClose={onClose}
            className="relative z-60"
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/75 transition-opacity 
      data-[closed]:opacity-0 
      data-[enter]:duration-300 
      data-[leave]:duration-200 
      data-[enter]:ease-out 
      data-[leave]:ease-in"
            />

            <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">

                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
          data-[closed]:translate-y-4 data-[closed]:opacity-0 
          data-[enter]:duration-300 data-[leave]:duration-200
          data-[enter]:ease-out data-[leave]:ease-in 
          sm:my-8 sm:w-full sm:max-w-[900px]
          data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                    >
                        {mappingLoading ? (
                            <div className="flex items-center justify-center h-[400px]">
                                <div className="animate-spin w-12 h-12 
            border-4 border-primary-button-bg 
            border-t-transparent 
            rounded-full" />
                            </div>
                        ) : (
                            <div className="trezo-card w-full bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">



                                {/* Header */}
                                <div
                                    className="trezo-card-header bg-gray-50 dark:bg-[#15203c] 
  mb-[20px] md:mb-[25px]
  flex items-center justify-between 
  -mx-[20px] md:-mx-[25px] 
  -mt-[20px] md:-mt-[25px]
  p-[20px] md:p-[25px] rounded-t-md"
                                >
                                    <div className="trezo-card-title">
                                        <h5 className="!mb-0">
                                            {isEdit ? "Edit Provider" : "Add New Provider"}
                                        </h5>
                                    </div>

                                    <button
                                        type="button"
                                        className="text-[23px] transition-all leading-none 
    text-black dark:text-white hover:text-primary-button-bg"
                                        onClick={onClose}
                                    >
                                        <i className="ri-close-fill"></i>
                                    </button>
                                </div>


                                {/* Provider Info Section */}
                                <div className="bg-gray-50 dark:bg-[#111827] p-6 rounded-xl mb-6">

                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">
                                                Provider Type<span className="text-red-500 ml-0.5">*</span>
                                            </label>
                                            <select
                                                disabled={isEdit}
                                                className={`${inputClass} 
        ${isEdit ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-70" : ""} 
        ${errors.providerType ? "border-red-500 focus:ring-red-500" : ""}`}
                                                value={form.providerType}
                                                onChange={(e) =>
                                                    setForm({ ...form, providerType: e.target.value })
                                                }
                                            >


                                                <option value="SMS">SMS</option>
                                                <option value="WhatsApp">WhatsApp</option>
                                                <option value="Email">Email</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">
                                                Provider Name<span className="text-red-500 ml-0.5">*</span>
                                            </label>
                                            <input
                                                className={`${inputClass} ${errors.providerName ? "border-red-500 focus:ring-red-500" : ""
                                                    }`}
                                                placeholder="Enter provider name"
                                                value={form.providerName}
                                                onChange={(e) =>
                                                    setForm({ ...form, providerName: e.target.value })
                                                }
                                            />

                                            {errors.providerName && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.providerName}
                                                </p>
                                            )}

                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">
                                                Base URL<span className="text-red-500 ml-0.5">*</span>
                                            </label>
                                            <input
                                                className={`${inputClass} ${errors.baseUrl ? "border-red-500 focus:ring-red-500" : ""
                                                    }`}
                                                placeholder="Enter base url"
                                                value={form.baseUrl}
                                                onChange={(e) =>
                                                    setForm({ ...form, baseUrl: e.target.value })
                                                }
                                            />

                                            {errors.baseUrl && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.baseUrl}
                                                </p>
                                            )}

                                        </div>

                                        {/* <div>
                                        <label className="text-xs text-gray-500 mb-2 block">
                                            Sender ID<span className="text-red-500 ml-0.5">*</span>
                                        </label>
                                        <input
                                            className={`${inputClass} ${errors.senderId ? "border-red-500 focus:ring-red-500" : ""
                                                }`}
                                            placeholder="Enter sender id"
                                            value={form.senderId}
                                            onChange={(e) =>
                                                setForm({ ...form, senderId: e.target.value })
                                            }
                                        />

                                        {errors.senderId && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors.senderId}
                                            </p>
                                        )}

                                    </div> */}
                                        <div>
                                            <label className="text-xs text-gray-500 mb-2 block">
                                                HTTP Method<span className="text-red-500 ml-0.5">*</span>
                                            </label>

                                            <select
                                                className={`${inputClass} ${errors.httpMethod ? "border-red-500 focus:ring-red-500" : ""}`}
                                                value={form.httpMethod}
                                                onChange={(e) =>
                                                    setForm({ ...form, httpMethod: e.target.value })
                                                }
                                            >
                                                <option value="GET">GET</option>
                                                <option value="POST">POST</option>

                                            </select>

                                            {errors.httpMethod && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.httpMethod}
                                                </p>
                                            )}
                                        </div>


                                    </div>
                                </div>

                                {/* Parameters Section */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                                    <div className="flex justify-between items-center mb-5">
                                        <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                            Parameters
                                        </h5>

                                        {form.providerType !== "Email" && (
                                            <button
                                                type="button"
                                                onClick={handleAddRow}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded-md text-xs transition-all"
                                            >
                                                <FaPlus />
                                                Add Parameter
                                            </button>
                                        )}

                                    </div>
                                    {/* Divider */}
                                    <div className="border-b border-gray-200 dark:border-gray-700 mb-3 -mx-6"></div>
                                    {/* HEADER ROW */}
                                    <div
                                        className={`grid ${form.providerType === "Email"
                                            ? "grid-cols-12"
                                            : "grid-cols-12"
                                            } gap-4 mb-3 text-xs font-semibold text-gray-500 dark:text-gray-400 px-2`}
                                    >
                                        <div className="col-span-4">Key</div>
                                        <div className="col-span-5">Value</div>
                                        <div className="col-span-2 text-center">Is Required</div>

                                        {form.providerType !== "Email" && (
                                            <div className="col-span-1 text-center">Action</div>
                                        )}
                                    </div>


                                    {/* Divider */}
                                    <div className="border-b border-gray-200 dark:border-gray-700 mb-4 -mx-6"></div>
                                    {errors.parameters && typeof errors.parameters === "string" && (
                                        <div className="px-2 mb-3">
                                            <p className="text-red-500 text-xs">
                                                {errors.parameters}
                                            </p>
                                        </div>
                                    )}

                                    {/* PARAMETER ROWS */}
                                    <div className="max-h-64 overflow-y-auto pr-2 space-y-4 custom-scrollbar">

                                        {parameters.map((param, index) => (
                                            <div
                                                key={index}
                                                className="grid grid-cols-12 gap-4 items-start"

                                            >
                                                {/* Key */}
                                                <div className="col-span-4 relative">
                                                    {/* <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" /> */}
                                                    <input
                                                        readOnly={form.providerType === "Email"}
                                                        className={`${inputClass}  ${form.providerType === "Email"
                                                            ? "bg-gray-100 cursor-not-allowed"
                                                            : ""
                                                            }`}
                                                        value={param.key}
                                                        onChange={(e) => {
                                                            if (form.providerType === "Email") return;
                                                            const updated = [...parameters];
                                                            updated[index].key = e.target.value;
                                                            setParameters(updated);
                                                        }}
                                                    />


                                                    {errors[`parameters[${index}].key`] && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {errors[`parameters[${index}].key`]}
                                                        </p>
                                                    )}



                                                </div>

                                                {/* Value */}
                                                <div className="col-span-5">
                                                    <input
                                                        placeholder="Enter Value"
                                                        className={`${inputClass} ${errors[`parameters[${index}].value`] ? "border-red-500 focus:ring-red-500" : ""
                                                            }`}

                                                        value={param.value}
                                                        onChange={(e) => {
                                                            const updated = [...parameters];
                                                            updated[index].value = e.target.value;
                                                            setParameters(updated);
                                                        }}
                                                    />
                                                    {errors[`parameters[${index}].value`] && (
                                                        <p className="text-red-500 text-xs mt-1">
                                                            {errors[`parameters[${index}].value`]}
                                                        </p>
                                                    )}



                                                </div>

                                                {/* Toggle */}
                                                <div className="col-span-2 flex justify-center">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={param.isRequired}
                                                            onChange={() => {
                                                                const updated = [...parameters];
                                                                updated[index].isRequired = !updated[index].isRequired;
                                                                setParameters(updated);
                                                            }}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-300 rounded-full peer 
                peer-checked:bg-primary-button-bg 
                transition-colors duration-300">
                                                        </div>
                                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full 
                transition-transform duration-300 
                peer-checked:translate-x-5">
                                                        </div>
                                                    </label>
                                                </div>

                                                {/* Delete */}
                                                {form.providerType !== "Email" && (
                                                    <div className="col-span-1 flex justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRow(index)}
                                                            className="w-9 h-9 flex items-center justify-center rounded-lg 
      hover:bg-red-100 text-red-500 transition-all"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                </div>


                                {/* Footer */}
                                <hr className="border-0 border-t border-gray-200 dark:border-gray-700 my-6 -mx-[20px] md:-mx-[25px]" />

                                <div className="text-right">
                                    <button
                                        type="button"
                                        className="mr-[15px] px-[26.5px] py-[12px] rounded-md 
    bg-danger-500 text-white hover:bg-danger-400"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={handleSave}
                                        className="px-[26.5px] py-[12px] rounded-md 
    bg-primary-button-bg text-white 
    hover:bg-primary-button-bg-hover"
                                    >
                                        {loading ? "Processing..." : isEdit ? "Update Provider" : "Save Provider"}
                                    </button>
                                </div>

                            </div>
                        )}
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );

}
